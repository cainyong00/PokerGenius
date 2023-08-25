# Poker Hand Evaluator

This is the official repository of the npm module poker-evaluator.

This is a poker hand evaluator using the Two Plus Two algorithm and lookup table.
The lookup table HandRanks.dat is included in the module.

Capable of evaluating 3, 5, 6 and 7 card hands. The highest hand possible in a 3 card hand is 3 of a kind (straights & flushes do not apply to 3 cards).

This can evaluate about 22MM hands per second on a quad-core 2.7GHz Macbook Pro. Run the speedtest.js file under /test to try it.

---

## Installation
`npm install poker-evaluator` 
  OR  
`yarn add poker-evaluator`

---

## Usage:

Call the public `evalHand` method with a single argument, an array of 3, 5, 6 or 7 cards as:  
- strings in the format 'Xy' where X = rank and y = suit). This is case insensitive so xy or XY (or any other combination) work fine too.  
  - Ranks: A, 1, 2, 3, 4, 5, 6, 7, 8, 9, T, J, Q, K  
  - Suits: c, d, h, s  
- numbers corresponding to the values in the [deck](src/constants/deck.const.ts) (currently does not work for 3 card hands)

_See `src/constants/deck.const.ts` for the full deck_

Typescript:
```ts
import * as PokerEvaluator from 'poker-evaluator-ts';

PokerEvaluator.evalHand(['As', 'Ks', 'Qs', 'Js', 'Ts', '3c', '5h']);
//{ handType: 9,
//  handRank: 10,
//  value: 36874,
//  handName: 'straight flush' }

PokerEvaluator.evalHand(['As', 'Ac', 'Qs']);
//{ handType: 2,
//  handRank: 2761,
//  value: 10953,
//  handName: 'one pair' }
```

Importing in Javascript
```js
const PokerEvaluator = require('poker-evaluator');
```

Passing numbers as arguments (values from deck.const.ts): 
```js
PokerEvaluator.evalHand([17, 22, 27, 32, 33]);
//{ handType: 5,
//  handRank: 6,
//  value: 20486,
//  handName: 'straight' }
```


The returned object is an `EvaluatedHand` (src/types/evaluated-hand.interface.ts). An explanation of its properties is as follows:  
```ts
handType: number; // Index of the HAND_TYPES array  
handRank: number; // Rank within the handType  
value: number; // Overall value of this hand, the higher the better. USE THIS TO DETERMINE WINNER OF A HAND  
handName: HandName; // Human readable name of the hand
```

---

## Contributing
To contribute create a pull request from your fork to this repository.

## Contributors
[David Chen](https://github.com/chenosaurus) - Wrote original poker-evaluator

[Rory Mcgit](https://github.com/rorymcgit) - Made project typescript friendly
