// gameInitialization.test.js

const { initializeGame } = require('../utils/pokerLogic');  // Import your game initialization function

test('Should initialize a game for two players', () => {
    const players = [{name: 'Alice'}, {name: 'Bob'}];
    const gameState = initializeGame(players);

    expect(gameState).toBeDefined();
    expect(gameState.players).toEqual(players);
    expect(gameState.communityCards).toEqual([]);
    expect(gameState.pot).toBe(0);
    expect(gameState.deck.length).toBe(48); // 52 cards - 2 cards for each of the 2 players
});
test('Each player should have 2 cards after initialization', () => {
    const players = [{name: 'Alice'}, {name: 'Bob'}];
    const gameState = initializeGame(players);

    players.forEach(player => {
        expect(player.cards.length).toBe(2);
    });
});
test('Should throw error if less than two players', () => {
    const players = [{name: 'Alice'}];
    expect(() => initializeGame(players)).toThrow("At least two players are required to start the game.");
});
test('Deck should have no duplicate cards', () => {
    const players = [{name: 'Alice'}, {name: 'Bob'}];
    const gameState = initializeGame(players);
    const allCards = gameState.deck.concat(...gameState.players.map(p => p.cards));
    
    const uniqueCards = new Set(allCards);
    
    expect(uniqueCards.size).toBe(52);
});
test('All players should have the correct starting chips', () => {
    const players = [{name: 'Alice'}, {name: 'Bob'}, {name: 'Charlie'}];
    const gameState = initializeGame(players);
    
    gameState.players.forEach(player => {
        expect(player.chips).toBe(1000);
    });
});
test('Initialization with a large number of players', () => {
    const players = new Array(20).fill(null).map((_, idx) => ({ name: `Player${idx + 1}` }));
    
    // This should either work or throw an error if you've set a limit on the number of players.
    expect(() => initializeGame(players)).not.toThrow();
});
test('No community cards should be dealt at the start', () => {
    const players = [{name: 'Alice'}, {name: 'Bob'}];
    const gameState = initializeGame(players);
    
    expect(gameState.communityCards).toEqual([]);
});


// Add more tests as required
