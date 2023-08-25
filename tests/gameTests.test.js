const mongoose = require('mongoose');
const { shuffleDeck, dealCards, advanceGame, initializeGame } = require('../utils/pokerLogic');
const Game = require('../models/game');
const Player = require('../models/player');

let gameState;
let players;

beforeEach(() => {
    players = [
        new Player({name: 'Alice', chips: 1000}),
        new Player({name: 'Bob', chips: 1000})
    ];
    
    gameState = initializeGame(players);
});

afterEach(() => {
    gameState = null;
    players = [];
});

test('Shuffle deck has 52 cards', () => {
    const deck = shuffleDeck();
    expect(deck.length).toBe(52);
});

test('Initialize game with two players', () => {
    expect(gameState.players.length).toBe(2);
    expect(gameState.communityCards.length).toBe(0);
    expect(gameState.pot).toBe(0);
});

test('Advance game to flop', () => {
    gameState.state = "pre-flop";
    advanceGame(gameState);
    expect(gameState.state).toBe("flop");
    expect(gameState.communityCards.length).toBe(3);
});

test('Determine winner after river', () => {
    gameState.state = "pre-flop";
    advanceGame(gameState);
    advanceGame(gameState);
    advanceGame(gameState);
    gameState.potAmount = 500;  // Example pot value
    const totalChips = gameState.players.reduce((acc, player) => acc + player.chips, 0);
    
    advanceGame(gameState);
    
    const newTotalChips = gameState.players.reduce((acc, player) => acc + player.chips, 0);
    expect(newTotalChips - totalChips).toBe(gameState.pot);
    expect(gameState.pot).toBe(0);
});
