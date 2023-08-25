const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const Player = require('../models/player');
const { shuffleDeck, dealCards } = require('../utils/pokerLogic');

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
        res.status(500).json({ message: err.message });
    }
});

router.post('/:id/join', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found" });
        if (game.players.length >= 8) {
            return res.status(400).json({ error: 'Game lobby is full.' });
        }

        const player = new Player({
            name: req.body.name,
            chips: 1000,  // or any starting amount
            cards: [],
            currentBet: 0,
            folded: false,
            hasActed: false
        });

        await player.save();

        game.players.push(player._id);
        
        // If this is the first player joining, set them as the currentPlayerTurn.
        if (game.players.length === 1) {
            game.currentPlayerTurn = player._id;
        }

        await game.save();

        res.json(player);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.post('/:id/start', async (req, res) => {
    try {
        let game = await Game.findById(req.params.id).populate('players');
        if (!game || game.players.length < 2) {
            return res.status(400).json({ message: "Game not found or not enough players" });
        }

        if (game.state !== "pre-deal") {
            return res.status(400).json({ message: "Game already in progress" });
        }

        const deck = shuffleDeck();
        await dealCards(deck, game.players);
        console.log(game.players[0].cards)
        await game.save();
        game.state = "pre-flop";

        // Reset the hasActed flag for all players for the new round
        game.players.forEach(p => p.hasActed = false);

        await game.save();

        // To return the most recent state of the game, including the populated players.
        game = await Game.findById(game._id).populate('players').exec();
        
        res.json(game);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
});




// Player Action: fold, check, call, bet or raise
router.post('/:gameId/player/:playerId/action', async (req, res) => {
    try {
        const game = await Game.findById(req.params.gameId);
        const player = await Player.findById(req.params.playerId);

        const action = req.body.action;  // Action sent from client: fold, check, call, bet, raise
        const amount = req.body.amount;  // Amount for bet or raise

        if (action === "bet" && amount > player.chips) {
            return res.status(400).json({ error: 'Insufficient chips' });
        }
        if (game.currentPlayerTurn.toString() !== req.params.playerId) {
            return res.status(400).json({ error: 'It is not your turn.' });
        }
        if (action === "check" && game.currentBet > player.currentBet) {
            return res.status(400).json({ error: 'Cannot check. You need to call or raise.' });
        }
        

        // Handle action. Simplified for brevity.
        switch(action) {
            case "fold":
                player.folded = true;
                break;
            case "check":
                break;
            case "call":
                const callAmount = game.currentBet - player.currentBet;
                player.chips -= callAmount;
                player.currentBet += callAmount;
                break;
            case "bet":
            case "raise":
                player.chips -= amount;
                player.currentBet += amount;
                game.currentBet = player.currentBet;  // Update game's current bet
                break;
        }

        player.hasActed = true;
        if (player.chips === 0) player.isAllIn = true;

        await player.save();

        // update current player's turn to the next player
        const currentPlayerIndex = game.players.map(p => p._id.toString()).indexOf(player._id.toString());
        const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
        game.currentPlayerTurn = game.players[nextPlayerIndex]._id;

        await game.save();
        // Check if all players have acted. If yes, advance the game.
        const allPlayersActed = game.players.every(p => p.hasActed);
        if (allPlayersActed) {
            if (game.state === "pre-flop") {
                // Move to flop state and reveal the flop cards
                game.state = "flop";
                dealCommunityCards(game, 3);  // Deal 3 cards for flop
                game.players.forEach(p => p.hasActed = false);
            }
            // Handle transitions for other game states...
            await game.save();
        }

        res.json(game);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('players');
        if (!game) return res.status(404).json({ message: "Game not found" });
        res.json(game);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = router;
