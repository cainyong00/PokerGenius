import React from 'react';

const Player = ({ player, isCurrentUser }) => {
  return (
    <div className={`player ${isCurrentUser ? 'current-user' : ''}`}>
      <p>{player.name}</p>
      <p>Chips: {player.chips}</p>
      {/* Add more details as needed */}
    </div>
  );
}

export default Player;
