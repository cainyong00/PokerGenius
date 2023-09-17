const mongoose = require('mongoose');
const Player = require('./player');  

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
    },
    totalBuyIn: { type: Number, default: 0 },
    totalBuyOut: { type: Number, default: 0 },
    totalNetProfitLoss: { type: Number, default: 0 },
    totalCurrentStack: { type: Number, default: 0 }
});

gameSchema.pre('save', async function(next) {
    if (this.isModified('players')) {  // Only re-calculate if the players have changed to optimize performance
        // Fetch all player documents associated with this game
        const players = await Player.find({ _id: { $in: this.players }}).exec();

        // Aggregate netProfitLoss and currentStack
        let totalNetProfit = 0;
        let totalStack = 0;

        players.forEach(player => {
            totalNetProfit += (player.currentStack + player.buyOut - player.buyIn);
            totalStack += player.currentStack;
        });

        // Assign aggregated values to the game
        this.totalNetProfitLoss = totalNetProfit;
        this.totalCurrentStack = totalStack;
    }

    next();
});


module.exports = mongoose.model('Game', gameSchema);
