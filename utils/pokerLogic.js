const PokerEvaluator = require("poker-evaluator");
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
    
}

function advanceGame(game) {
    // Check if all players have acted
    const allPlayersActed = game.players.every(p => p.hasActed);
    
    // Check if all but one player have folded
    const remainingPlayers = game.players.filter(p => !p.folded);
    
    if (allPlayersActed || remainingPlayers.length === 1) {
        switch(game.state) {
            case "pre-deal":
                game.state = "pre-flop";
                break;
            case "pre-flop":
                game.state = "flop";
                dealCommunityCards(game, 3);  // Deal 3 cards for flop
                break;
            case "flop":
                game.state = "turn";
                dealCommunityCards(game, 1);  // Deal 1 card for turn
                break;
            case "turn":
                game.state = "river";
                dealCommunityCards(game, 1);  // Deal 1 card for river
                break;
            case "river":
                game.state = "end";
                determineWinner(game);
                break;
        }
    }

    // If there's only one player left, they win, advance to end state
    if (remainingPlayers.length === 1) {
        game.state = "end";
        // You might want to assign the pot to the remaining player
        // remainingPlayers[0].chips += game.pot;
        // game.pot = 0;
    }

    // Reset players' hasActed for next round if we've advanced states
    if (allPlayersActed) {
        game.players.forEach(p => p.hasActed = false);
    }
}


function dealCommunityCards(game, count) {
    const deck = shuffleDeck();  // Use an improved method that retains deck state across rounds
    for (let i = 0; i < count; i++) {
        game.communityCards.push(deck.pop());
    }
}

function determineWinner(game) {
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
        winner.chips += game.pot;
    } else {
        console.log("No winner determined.");
    }
    game.pot = 0;
}

module.exports = {shuffleDeck, dealCards , advanceGame, initializeGame };
