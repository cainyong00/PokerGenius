const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const Player = require('../models/player');
const { resetAndStartGame, initiateFirstGame } = require('../utils/pokerLogic');
const player = require('../models/player');
const mongoose = require('mongoose');


router.post('/create', async (req, res) => {
    try {
        const { smallBlind, bigBlind } = req.body;

        if (!smallBlind || !bigBlind) {
            return res.status(400).json({ message: 'Please provide smallBlind and bigBlind values.' });
        }

        const game = new Game({
            state: "pre-deal",
            communityCards: [],
            potAmount: 0,
            players: [],
            smallBlind, 
            bigBlind
        });
        

        await game.save();
        console.log(game._id);
        res.json({ success: true, gameId: game._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/join', async (req, res) => {
    try {
        const gameId = req.params.id;
        console.log("Received request to join with data:", req.body);


        if (!mongoose.Types.ObjectId.isValid(gameId)) {
            return res.status(400).send('Invalid Game ID');
        }

        const game = await Game.findById(req.params.id).populate('players');
        if (!game) return res.status(404).json({ message: "Game not found" });

        if (game.players.length >= 8) return res.status(400).json({ error: 'Game lobby is full.' });
        if (!req.body.name || req.body.name.length == 0) {
            return res.status(400).json({ error: 'invalid name' });
        }
        if (game.players.some(p => p.name === req.body.name)) {
            return res.status(400).json({ error: 'Player with this name is already in the game.' });
        }
        
        // Retrieve occupied positions
        const occupiedPositions = game.players.map(player => player.position);
        const desiredPosition = req.body.position;

        if (occupiedPositions.includes(desiredPosition)) {
            return res.status(400).json({ error: 'This seat is already occupied.' });
        }
        // Find the first unoccupied position from 1 to 8

        const desiredChips = req.body.chips || 1000; // Default to 1000 if not provided

        const player = new Player({
            name: req.body.name,
            chips: desiredChips,
            cards: [],
            currentBet: 0,
            folded: false,
            hasActed: false,
            position: desiredPosition,
            lastAction: "none",
            isDealer: false
        });
        if (game.players.length === 0) {
            player.isDealer = true;
        }


        game.players.push(player._id);
        if (game.players.length === 1) game.currentPlayerTurn = player._id;


        player.buyIn += desiredChips;
        player.currentStack += desiredChips;
        game.totalBuyIn += desiredChips;
        game.totalCurrentStack += desiredChips;

        await player.save();
        await game.save();

        // Emit an event to update all clients about the new player
        req.io.emit('playerJoined', { gameId: game._id, player });
        console.log('Emitted playerJoined event for game:', game._id);
        res.json(player);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/start', async (req, res) => {
    try {
        const gameId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(gameId)) {
            return res.status(400).send('Invalid Game ID');
        }
        let game = await Game.findById(req.params.id).populate('players');
        console.log(game);

        if (!game || game.players.length < 2) {
            return res.status(400).json({ message: "Game not found or not enough players" });
        }
        if (game.state !== "pre-deal"){
            return res.status(400).json({ message: "Game already in progress" });
        } 
        game = await initiateFirstGame(game);  // Use the helper function to start the game
        

        for (let player of game.players) {
            await player.save();
        }
        
        await game.save();
        req.io.emit('gameUpdated', { gameId: game._id, game });

        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


router.post('/:gameId/player/:playerId/action', async (req, res) => {
    const session = await mongoose.startSession(); // Initialize the session
    session.startTransaction();  // Start a transaction
    try {
        const gameId = req.params.gameId;
        if (!mongoose.Types.ObjectId.isValid(gameId)) {
            return res.status(400).send('Invalid Game ID');
        }

        let game = await Game.findById(req.params.gameId).populate('players');
        let player = await Player.findById(req.params.playerId);
        const { advanceGame } = require('../utils/pokerLogic');

        if (!game) return res.status(404).json({ message: "Game not found" });
        if (!player) return res.status(404).json({ message: "Player not found" });

        const action = req.body.action;
        const amount = parseInt(req.body.amount, 10);

        if (isNaN(amount) && (action === "bet" || action === "raise")) {
            return res.status(400).json({ error: 'Invalid bet or raise amount' });
        }

        if (action === "bet" && amount > player.chips) {
            return res.status(400).json({ error: 'Insufficient chips' });
        }

        if (game.currentPlayerTurn.toString() !== req.params.playerId) {
            return res.status(400).json({ error: 'It is not your turn.' });
        }

        if (action === "check" && game.highestBet > player.currentBet) {
            return res.status(400).json({ error: 'Cannot check. You need to call or raise.' });
        }

        if (action === "bet" && game.highestBet > player.currentBet) {
            return res.status(400).json({ error: 'Cannot bet. You need to call or raise.' });
        }

        if (action === "raise" && amount < (game.highestBet * 2)) {
            return res.status(400).json({ error: 'You need to raise at least twice the current highest bet' });
        }

        if (action === "raise" && game.highestBet == 0 ) {
            return res.status(400).json({ error: 'Cannot raise. You need to raise, check, or fold.' });
        }
        
        switch(action) {
            case "bet":
            case "raise":
                player.chips -= amount;
                player.currentBet += amount;
                player.currentStack = player.chips;
                game.potAmount += amount;
                game.highestBet = player.currentBet;
                break;
            case "call":
                const callAmount = parseInt(game.highestBet, 10) - parseInt(player.currentBet, 10);
                player.chips -= callAmount;
                player.currentBet += callAmount;
                player.currentStack = player.chips;

                game.potAmount += callAmount;
                break;
            case "fold":
                player.folded = true;
                break;
            case "check":
                // Do nothing
                break;
            default:
                return res.status(400).json({ error: "Invalid action" });
        }

        player.hasActed = true;
        player.lastAction = action;
        const indexToUpdate = game.players.findIndex(p => p._id.toString() === player._id.toString());
        if (indexToUpdate !== -1) {
            game.players[indexToUpdate] = player;
        }

        
        // Determine the next player's turn, skipping folded players and players who have already acted
        let nextPlayerIndex = (game.players.map(p => p._id.toString()).indexOf(player._id.toString()) + 1) % game.players.length;
        let cycleCount = 0; // Counter to avoid infinite loop
        while ((game.players[nextPlayerIndex].folded || game.players[nextPlayerIndex].hasActed) && cycleCount < game.players.length) {
            nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
            cycleCount++;
        }
        
        // Now, only advance the game if all players have acted or checked

        game = await advanceGame(game);
        // Save player and game at the end of the function
        
        for (let p of game.players) {
            await p.save({ session });
        }
        
        await game.save({ session });
        
        // Commit the Transaction
        await session.commitTransaction();
        session.endSession();
        
        req.io.emit('gameUpdated', { gameId: game._id, game });


        res.json(game);
    } catch (err) {
        // If an error occurs, abort the transaction and undo any changes
        await session.abortTransaction();
        session.endSession();
        
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});




router.get('/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        console.log(gameId);
        if (!mongoose.Types.ObjectId.isValid(gameId)) {
            return res.status(400).send('Invalid Game ID');
        }

        const game = await Game.findById(req.params.id).populate('players');
        if (!game) return res.status(404).json({ message: "Game not found" });
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router;
