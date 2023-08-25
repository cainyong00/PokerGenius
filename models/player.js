const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: String,
    chips: Number,
    cards: [String],
    currentBet: Number,
    folded: Boolean,
    hasActed: Boolean,  // Track if a player has acted in the current betting round
    isAllIn: Boolean,   // Track if a player has bet all their chips
});

module.exports = mongoose.model('Player', playerSchema);
