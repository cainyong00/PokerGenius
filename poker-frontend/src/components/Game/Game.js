import React, { useState } from 'react';
import axios from 'axios';
import PokerTable from './PokerTable/PokerTable';

const Game = () => {
  const [game, setGame] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [error, setError] = useState("");

  const createGame = async () => {
    try {
      const response = await axios.post('/api/game/create');
      setGame(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to create game.");
    }
  }

  const joinGame = async (name) => {
    if (!game || !name) return;
    try {
      const response = await axios.post(`/api/game/${game._id}/join`, { name });
      setCurrentPlayer(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to join game.");
    }
  }

  const startGame = async () => {
    if (!game) return;
    try {
      const response = await axios.post(`/api/game/${game._id}/start`);
      setGame(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to start game.");
    }
  }

  return (
    <div>
      {!game && <button onClick={createGame}>Create Game</button>}
      {game && !currentPlayer && 
        <div>
          <input placeholder="Enter name" onChange={(e) => setName(e.target.value)} />
          <button onClick={() => joinGame(name)}>Join Game</button>
        </div>
      }
      {game && currentPlayer && !game.started && <button onClick={startGame}>Start Game</button>}
      {game && <PokerTable game={game} currentPlayer={currentPlayer} />}
      {error && <p>{error}</p>}
    </div>
  );
}

export default Game;
