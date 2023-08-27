const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const Player = require('../models/player');
const { shuffleDeck, dealCards, dealCommunityCards, shouldAdvanceGame, moveToNextPlayer, getRemainingPlayers } = require('../utils/pokerLogic');

router.post('/create', async (req, res) => {
    try {
        const game = new Game({
            state: "pre-deal",
            communityCards: [],
            potAmount: 0,
            players: [],
        });
        

        await game.save();
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/join', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found" });

        if (game.players.length >= 8) return res.status(400).json({ error: 'Game lobby is full.' });

        const player = new Player({
            name: req.body.name,
            chips: 1000,
            cards: [],
            currentBet: 0,
            folded: false,
            hasActed: false,
            lastAction: "none",
            isDealer: false
        });
        if (game.players.length === 0) {
            player.isDealer = true;
        }

        await player.save();

        game.players.push(player._id);
        if (game.players.length === 1) game.currentPlayerTurn = player._id;

        await game.save();
        res.json(player);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/start', async (req, res) => {
    try {
        let game = await Game.findById(req.params.id).populate('players');
        if (!game || game.players.length < 2) return res.status(400).json({ message: "Game not found or not enough players" });

        if (game.state !== "pre-deal") return res.status(400).json({ message: "Game already in progress" });
        
        const dealerIndex = game.players.findIndex(p => p.isDealer);
        const smallBlindIndex = (dealerIndex + 1) % game.players.length;
        const bigBlindIndex = (dealerIndex + 2) % game.players.length;
        
        const smallBlindAmount = 10;
        const bigBlindAmount = 20;
        
        game.players[smallBlindIndex].chips -= smallBlindAmount;
        game.players[smallBlindIndex].currentBet = smallBlindAmount;
        game.potAmount += smallBlindAmount;
        
        game.players[bigBlindIndex].chips -= bigBlindAmount;
        game.players[bigBlindIndex].currentBet = bigBlindAmount;
        game.potAmount += bigBlindAmount;
        
        // Rotate the dealer button to the next player (to be used for the next hand)
        game.players[dealerIndex].isDealer = false;
        game.players[smallBlindIndex].isDealer = true;
        
        const deck = shuffleDeck();
        await dealCards(deck, game.players);
        game.state = "pre-flop";
        game.players.forEach(p => p.hasActed = false);

        await game.save();
        game = await Game.findById(game._id).populate('players').exec();
        
        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.post('/:gameId/player/:playerId/action', async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId).populate('players');
        let player = await Player.findById(req.params.playerId);
        const { advanceGame } = require('../utils/pokerLogic');

        if (!game) return res.status(404).json({ message: "Game not found" });
        if (!player) return res.status(404).json({ message: "Player not found" });

        const action = req.body.action;
        const amount = req.body.amount;

        if (action === "bet" && amount > player.chips) {
            return res.status(400).json({ error: 'Insufficient chips' });
        }

        if (game.currentPlayerTurn.toString() !== req.params.playerId) {
            return res.status(400).json({ error: 'It is not your turn.' });
        }

        if (action === "check" && game.currentBet > player.currentBet) {
            return res.status(400).json({ error: 'Cannot check. You need to call or raise.' });
        }
        
        if (action === "fold") {
            player.folded = true;
            const remainingPlayers = getRemainingPlayers(game);  // use the utility function
            if (remainingPlayers.length === 1) {
                // Award the pot to the remaining player
                remainingPlayers[0].chips += game.pot;
                game.pot = 0;
                game.state = "end";
                await game.save();
                res.json(game);
                return;
            }
        }
        switch(action) {
            case "bet":
            case "raise":
                player.chips -= amount;
                player.currentBet += amount;
                game.pot += amount;
                game.currentBet = player.currentBet;
                break;
            case "call":
                const callAmount = game.currentBet - player.currentBet;
                player.chips -= callAmount;
                player.currentBet += callAmount;
                game.pot += callAmount;
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
        await player.save();
        player = await Player.findById(req.params.playerId);

        await game.save();
        await advanceGame(game);

        // Save the updated game state and the player state
        

        res.json(game);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});




router.get('/:id', async (req, res) => {
    try {
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
