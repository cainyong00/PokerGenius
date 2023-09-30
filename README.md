# PokerGenius
Poker Genius is an online poker platform that offers seamless gameplay, intuitive interfaces, and real-time interactions.

Primarily focused on Texas Hold'em style poker, 

## **Technologies Used**

Backend: Node.js, Express.js

Database: MongoDB (using Mongoose for object modeling)

Frontend: React.js

Real-time communication: Socket.io


## **Backend API**

The backend API is responsible for handling game creation, player actions, and game state management. It leverages Express.js for route handling and Mongoose for interactions with the MongoDB database.

### Routes

POST /create: Initializes a new game with given smallBlind and bigBlind values.

POST /:id/join: Lets a player join an existing game using its ID. Players can specify a name, chips, and a desired position (seat) upon joining.

POST /:id/start: Commences the game using the game's ID. Requires at least two players to be present in the game.

POST /:gameId/player/:playerId/action: Lets a player execute an action in a game (e.g., bet, call, raise, fold, check). Utilizes a transaction to ensure synchronized updates to the game and player states.

GET /:id: Fetches details of a particular game, including its players, using the game's ID.

## **Frontend**
The frontend, built using React.js, offers a responsive, intuitive user interface that provides players with an immersive poker experience. The real-time nature of the gameplay is powered by Socket.io, ensuring smooth and instantaneous interactions.
