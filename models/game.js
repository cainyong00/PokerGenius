const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    state: String,
    communityCards: Array,
    potAmount: Number,
    currentTurn: mongoose.Types.ObjectId,  // Refers to Player ID
    highestBet: Number,
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],     // Array of Player IDs
    currentPlayerTurn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: false
    },
    
});

module.exports = mongoose.model('Game', gameSchema);
