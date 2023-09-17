const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: String,
    chips: Number,
    cards: [String],
    currentBet: Number,
    folded: Boolean,
    hasActed: Boolean,  // Track if a player has acted in the current betting round
    isAllIn: Boolean,   // Track if a player has bet all their chips
    lastAction: {
        type: String,
        enum: ['fold', 'check', 'call', 'bet', 'raise', 'none'],
        default: 'none'
    },
    isDealer: { type: Boolean, default: false },
    position: { 
        type: Number, 
        min: 1, 
        max: 8, 
        required: true 
    },
    transactions: [{
        type: {
            type: String,
            enum: ['buy-in', 'buy-out', 'profit/loss']
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('Player', playerSchema);
