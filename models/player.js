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
    buyIn: { type: Number, default: 0 },
    buyOut: { type: Number, default: 0 },
    currentStack: { type: Number, default: 0 },
    netProfitLoss: { type: Number },
    inHand: Boolean,
    handsPlayed: { type: Number, default: 0 },
    handsVoluntarilyPutMoney: { type: Number, default: 0 },
    bets: { type: Number, default: 0 },
    raises: { type: Number, default: 0 },
    calls: { type: Number, default: 0 },
});

playerSchema.pre('save', function(next) {
    this.netProfitLoss = this.currentStack + this.buyOut - this.buyIn;
    next();
});


module.exports = mongoose.model('Player', playerSchema);
