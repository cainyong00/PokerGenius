const PokerEvaluator = require("poker-evaluator");

test('Should correctly identify a royal flush', () => {
    const hand = ['As', 'Ks', 'Qs', 'Js', 'Ts', '3c', '5h']; // Texas Hold'em hand
    const result = PokerEvaluator.evalHand(hand);
    expect(result.handName).toBe('straight flush');
});

// Add more tests for other hand types using a similar structure
