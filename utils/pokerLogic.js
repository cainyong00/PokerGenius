const PokerEvaluator = require("poker-evaluator");
const Game = require('../models/game');
const Player = require('../models/player');



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
    return deck, players;
}

async function advanceGame(game) {
    let remainingPlayers = await getRemainingPlayers(game);  // use the utility function
    if (remainingPlayers.length === 1) {
        // Award the pot to the remaining player
        remainingPlayers[0].chips += game.potAmount;
        console.log(`${remainingPlayers[0].name} won with a pot of ${game.potAmount}`);
        game = resetAndStartGame(game);
        return game;
    }
    if (shouldAdvanceGame(game)) {
        switch(game.state) {
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
            p.highestBet = 0;
        });
    } else {
        // If we're not advancing the game, move to the next player
        game = moveToNextPlayer(game);
    }
    return game;
}

function dealCommunityCards(game, count) {
    const deck = game.deck;  // Use an improved method that retains deck state across rounds
    for (let i = 0; i < count; i++) {
        game.communityCards.push(deck.pop());
    }
}

async function determineWinner(game) {
    let winningHandValue = 0;
    let winners = [];

    game.players.forEach(player => {
        const hand = player.cards.concat(game.communityCards);
        const evaluation = PokerEvaluator.evalHand(hand);
        
        if (evaluation.value > winningHandValue) {
            winningHandValue = evaluation.value;
            winners = [player];
        } else if (evaluation.value === winningHandValue) {
            winners.push(player);
        }
    });

    // Now, award the pot to the winners
    if (winners.length) {
        const splitAmount = game.potAmount / winners.length;
        winners.forEach(winner => {
            winner.chips += splitAmount;
            console.log(`${winner.name} won a split pot of ${splitAmount}`);
        });
        game = await resetAndStartGame(game);
    } else {
        console.log("No winner determined.");
    }
}

function shouldAdvanceGame(game) {
    // Filter out players that have folded or gone all-in, as they don't need to act.
    const playersExpectedToAct = game.players.filter(p => !p.folded && !p.isAllIn);

    // Check if all the players who are supposed to act have indeed acted.
    const allExpectedPlayersActed = playersExpectedToAct.every(p => p.hasActed);
    if (!allExpectedPlayersActed) {
        return false;
    }

    // Filter out players that have folded since they aren't considered in the next steps.
    const activePlayers = game.players.filter(p => !p.folded);

    // Check if all players have either checked or are all in.
    const allCheckedOrAllIn = activePlayers.every(p => p.lastAction === "check" || p.isAllIn);
    if (allCheckedOrAllIn) {
        return true;
    }

    // Check if all players have matched the highest bet.
    const allMatchedHighestBet = activePlayers.every(p => p.currentBet === game.highestBet || p.isAllIn);
    if (allMatchedHighestBet) {
        return true;
    }

    // If none of the conditions are met, we do not advance the game.
    return false;
}





function resetTurnPointer(game) {
    // Get the position of the dealer
    const dealerPosition = game.players.find(p => p.isDealer).position;

    // Create an array of players ordered by their position
    let orderedPlayers = game.players.slice().sort((a, b) => a.position - b.position);

    // Find the player with position just after the dealer
    const nextPosition = (dealerPosition % 8) + 1;
    const nextPlayer = orderedPlayers.find(p => p.position === nextPosition && !p.folded);
    
    if (nextPlayer) {
        game.currentPlayerTurn = nextPlayer._id;
        console.log(`Reset to Player at position ${nextPlayer.position}`);
    } else {
        for (let pos = nextPosition + 1; pos !== dealerPosition; pos = (pos % 8) + 1) {
            const nextAvailablePlayer = orderedPlayers.find(p => p.position === pos && !p.folded);
            if (nextAvailablePlayer) {
                game.currentPlayerTurn = nextAvailablePlayer._id;
                console.log(`Reset to Player at position ${nextAvailablePlayer.position}`);
                break;
            }
        }
    }

    return game;
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
    const smallBlindIndex = (dealerIndex + 2) % game.players.length;
    const bigBlindIndex = (dealerIndex + 3) % game.players.length;

    // 3. Deal cards to players before deducting blinds
    const deck = shuffleDeck();
    game.players.forEach(p => {
        p.cards = [];
    });
    
    // Rotate the dealer button to the next player
    game.players[dealerIndex].isDealer = false;
    game.players[smallBlindIndex].isDealer = true;

    deck, game.players = await dealCards(deck, game.players);
    game.deck = deck;
    // Deduct blinds and set the current bet for the small and big blinds
    const smallBlindAmount = 10;
    const bigBlindAmount = 20;

    game.players.forEach(p => {
        p.currentBet = 0;
    });

    game.players[smallBlindIndex].chips -= smallBlindAmount;
    game.players[smallBlindIndex].currentBet = smallBlindAmount;
    game.potAmount = smallBlindAmount + bigBlindAmount;  // Set potAmount instead of adding

    game.players[bigBlindIndex].chips -= bigBlindAmount;
    game.players[bigBlindIndex].currentBet = bigBlindAmount;

    

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
    game.communityCards = [];
    game.highestBet = bigBlindAmount;


    return game;
};
const initiateFirstGame = async (game) => {
    // Assuming the first player is the dealer in the first game.
    const dealerIndex = 0;
    const smallBlindIndex = 1 % game.players.length;
    const bigBlindIndex = 2 % game.players.length;

    // 3. Deal cards to players before deducting blinds
    const deck = shuffleDeck();
    game.players.forEach(p => {
        p.cards = [];
    });
    
    // No need to rotate the dealer button since it's the first game.
    
    deck, game.players = await dealCards(deck, game.players);
    game.deck = deck;
    
    // Deduct blinds and set the current bet for the small and big blinds
    const smallBlindAmount = 10;
    const bigBlindAmount = 20;

    game.players[smallBlindIndex].chips -= smallBlindAmount;
    game.players[smallBlindIndex].currentBet = smallBlindAmount;
    game.potAmount = smallBlindAmount + bigBlindAmount;  // Set potAmount instead of adding

    game.players[bigBlindIndex].chips -= bigBlindAmount;
    game.players[bigBlindIndex].currentBet = bigBlindAmount;

    // 1. Set the current player's turn to be the player immediately after the big blind
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
    game.communityCards = [];
    game.highestBet = bigBlindAmount;

    return game;
};




module.exports = { shuffleDeck, dealCards, advanceGame, dealCommunityCards, resetTurnPointer, shouldAdvanceGame, moveToNextPlayer, getRemainingPlayers, resetAndStartGame, initiateFirstGame };
