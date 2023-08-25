const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const Player = require('../models/player');
const { shuffleDeck, dealCards, dealCommunityCards } = require('../utils/pokerLogic');

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
            lastAction: "none"
        });

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
        const player = await Player.findById(req.params.playerId);

        if (!game) return res.status(404).json({ message: "Game not found" });
        if (!player) return res.status(404).json({ message: "Player not found" });

        const action = req.body.action;
        const amount = req.body.amount;

        if (action === "bet" && amount > player.chips) return res.status(400).json({ error: 'Insufficient chips' });
        if (game.currentPlayerTurn.toString() !== req.params.playerId) return res.status(400).json({ error: 'It is not your turn.' });
        if (action === "check" && game.currentBet > player.currentBet) return res.status(400).json({ error: 'Cannot check. You need to call or raise.' });

        switch (action) {
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
                game.currentBet = player.currentBet;
                break;
        }

        player.hasActed = true;
        player.lastAction = action;

        if (player.chips === 0) player.isAllIn = true;
        await player.save();

        const indexToUpdate = game.players.findIndex(p => p._id.toString() === player._id.toString());
        if (indexToUpdate !== -1) game.players[indexToUpdate] = player;

        const currentPlayerIndex = game.players.map(p => p._id.toString()).indexOf(player._id.toString());
        const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
        game.currentPlayerTurn = game.players[nextPlayerIndex]._id;

        const allPlayersActed = game.players.every(p => p.hasActed);
        const allPlayersChecked = game.players.every(p => p.hasActed && p.lastAction === "check");

        if (allPlayersActed || allPlayersChecked) {
            if (game.state === "pre-flop") {
                game.state = "flop";
                dealCommunityCards(game, 3);
                game.players.forEach(p => p.hasActed = false);
            }
            await game.save();
        } else {
            await game.save();
        }

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
