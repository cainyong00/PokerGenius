const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    state: String,
    communityCards: Array,
    potAmount: Number,
    currentTurn: mongoose.Types.ObjectId,  // Refers to Player ID
    highestBet: Number,
    deck: Array,
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],     // Array of Player IDs
    currentPlayerTurn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: false
    },
    smallBlind: {
        type: Number,
        required: true  // We're making it required assuming you always want it specified; change as per your requirements
    },
    bigBlind: {
        type: Number,
        required: true  // Same here, change if necessary
    }
});

module.exports = mongoose.model('Game', gameSchema);
