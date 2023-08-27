const PokerEvaluator = require("poker-evaluator");
const Game = require('../models/game');
const Player = require('../models/player');


function initializeGame(players) {
    if (!players || players.length < 2) {
        throw new Error("At least two players are required to start the game.");
    }

    // Assuming a standard deck function that shuffles and returns a new deck
    const deck = shuffleDeck();

    // Distribute 2 cards to each player
    players.forEach(player => {
        player.cards = [deck.pop(), deck.pop()];
    });

    // Set initial community cards as empty
    const communityCards = [];

    // Set initial pot amount (assuming starting pot is 0)
    const pot = 0;

    // Assuming each player starts with a default chip count
    players.forEach(player => {
        player.chips = 1000; // example starting chip amount
    });

    // Initialize other game variables if needed, e.g., blinds, dealer position, etc.

    return {
        players,
        communityCards,
        pot,
        deck
    };
}
function shuffleDeck() {
    const suits = ['s', 'd', 'c', 'h'];  // spades, diamonds, clubs, hearts
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']; // Note that 10 is represented by 'T'
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push(value + suit);
        }
    }

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}


function dealCards(deck, players) {
    for (let player of players) {
        if (Array.isArray(player.cards)) {
            player.cards.push(deck.pop(), deck.pop());
        } else {
            console.error(`Player ${player._id} does not have a cards property initialized.`);
        }
    }
    return players;
}

async function advanceGame(game) {
    const remainingPlayers = getRemainingPlayers(game);

    if (remainingPlayers.length === 1) {
        // Award the pot to the remaining player
        remainingPlayers[0].chips += game.pot;
        game.pot = 0;
        console.log(`${remainingPlayers[0].name} won because everyone else folded.`);
        game.state = "end";
        return;
    }
    if (shouldAdvanceGame(game)) {
        switch(game.state) {
            case "pre-deal":
                game.state = "pre-flop";
                resetTurnPointer(game);

                break;
            case "pre-flop":
                game.state = "flop";
                dealCommunityCards(game, 3);  // Deal 3 cards for flop
                resetTurnPointer(game);

                break;
            case "flop":
                game.state = "turn";
                dealCommunityCards(game, 1);  // Deal 1 card for turn
                resetTurnPointer(game);
                break;
            case "turn":
                game.state = "river";
                dealCommunityCards(game, 1);  // Deal 1 card for river
                resetTurnPointer(game);
                break;
            case "river":
                determineWinner(game);
                break;
        }
        // Reset players' hasActed for the next round since we've advanced states
        game.players.forEach(p => {
            p.hasActed = false;
            p.lastAction = "none";
        });
    } else {
        // If we're not advancing the game, move to the next player
        game = moveToNextPlayer(game);
    }
    return game;
}

function dealCommunityCards(game, count) {
    const deck = shuffleDeck();  // Use an improved method that retains deck state across rounds
    for (let i = 0; i < count; i++) {
        game.communityCards.push(deck.pop());
    }
}

async function determineWinner(game) {
    let winningHandValue = 0;
    let winner = null;

    game.players.forEach(player => {
        const hand = player.cards.concat(game.communityCards);
        
        console.log("Evaluating hand:", hand); // This line will print the hand to the console

        const evaluation = PokerEvaluator.evalHand(hand);
        
        if (evaluation.value > winningHandValue) {
            winningHandValue = evaluation.value;
            winner = player;
        }
    });

    // Now, award the pot to the winner
    if (winner) {
        console.log(`${winner.name} won with a pot of ${game.pot}`);
        winner.chips += game.potAmount;
        game = await resetAndStartGame(game);
    } else {
        console.log("No winner determined.");
    }


}
function shouldAdvanceGame(game) {
    const allPlayersActed = game.players.every(p => p.hasActed);
    const allPlayersChecked = game.players.filter(p => !p.folded).every(p => p.lastAction === "check");

    return allPlayersActed && allPlayersChecked;
}




function resetTurnPointer(game) {
    if (!game.players[0].folded) {
        game.currentPlayerTurn = game.players[0]._id;
        console.log("Reset to Player 1");
    } else {
        for (let i = 1; i < game.players.length; i++) {
            if (!game.players[i].folded) {
                game.currentPlayerTurn = game.players[i]._id;
                console.log("Reset to Player", i + 1);
                break;
            }
        }
    }

}

function moveToNextPlayer(game) {
    const currentPlayerIndex = game.players.findIndex(p => p._id.toString() === game.currentPlayerTurn.toString());
    let nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;

    while(game.players[nextPlayerIndex].folded && nextPlayerIndex !== currentPlayerIndex) {
        nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
    }

    if (!game.players[nextPlayerIndex].folded) {
        game.currentPlayerTurn = game.players[nextPlayerIndex]._id;
    } else {
        // All players have folded except one, handle accordingly
        game.currentPlayerTurn = null;
    }
    return game;
}

function getRemainingPlayers(game) {
    const remainingPlayers = game.players.filter(p => !p.folded);
    return remainingPlayers;
}

const resetAndStartGame = async (game) => {
    // 1. Get index of the current dealer, small blind, and big blind
    const dealerIndex = game.players.findIndex(p => p.isDealer);
    const smallBlindIndex = (dealerIndex + 1) % game.players.length;
    const bigBlindIndex = (dealerIndex + 2) % game.players.length;

    // 3. Deal cards to players before deducting blinds
    const deck = shuffleDeck();
    game.players = await dealCards(deck, game.players);

    // Deduct blinds and set the current bet for the small and big blinds
    const smallBlindAmount = 10;
    const bigBlindAmount = 20;

    game.players[smallBlindIndex].chips -= smallBlindAmount;
    game.players[smallBlindIndex].currentBet = smallBlindAmount;
    game.potAmount = smallBlindAmount + bigBlindAmount;  // Set potAmount instead of adding

    game.players[bigBlindIndex].chips -= bigBlindAmount;
    game.players[bigBlindIndex].currentBet = bigBlindAmount;

    // Rotate the dealer button to the next player
    game.players[dealerIndex].isDealer = false;
    game.players[smallBlindIndex].isDealer = true;

    // 1. Reset the current player's turn to be the player immediately after the big blind
    const nextPlayerIndex = (bigBlindIndex + 1) % game.players.length;
    game.currentPlayerTurn = game.players[nextPlayerIndex]._id;

    // Reset player actions and states for the new hand
    game.players.forEach(p => {
        p.hasActed = false;
        p.lastAction = "none";
        p.folded = false;  // Ensure all players are marked as not folded for the new game
        p.isAllIn = false; // Reset all-in status for each player
    });

    game.state = "pre-flop";


    return game;
};




module.exports = { shuffleDeck, dealCards, advanceGame, initializeGame, dealCommunityCards, resetTurnPointer, shouldAdvanceGame, moveToNextPlayer, getRemainingPlayers, resetAndStartGame };
