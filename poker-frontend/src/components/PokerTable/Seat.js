import React, { useState } from 'react';
import { hasPlayerJoined, markPlayerJoined } from '../../StorageUtils.js';

function Seat({ gameId, player, setPlayerId, setPlayer, position, isPlayerTurn }) {
    const [joining, setJoining] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [chipCount, setChipCount] = useState(0); // Chip count state

    const handleJoinSeat = async () => {
        try {
            if (hasPlayerJoined(gameId)) {
                alert("This device has already joined the game.");  // Use an alert for immediate feedback
                return;
            }

            if (!playerName) {
                alert("Please enter a player name before joining.");
                return;
            }
            if (!chipCount || chipCount <= 0) {
                alert("Please enter a valid chip count before joining.");
                return;
            }

            console.log("Joining seat with position:", position);

            const response = await fetch(`http://localhost:5000/game/${gameId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: playerName, position: position, chips: chipCount }) // Sending chip count
            });

            const data = await response.json();

            if (data && data._id) {
                markPlayerJoined(gameId);
                sessionStorage.setItem('playerId', data._id);
                sessionStorage.setItem('playerName', playerName);
                setPlayer(data); 
                setPlayerId(data._id);  
                setJoining(false);
            } else {
                alert("Error joining game: " + (data.message || "Unknown error"));

            }
            
        } catch (err) {
            console.error("Error while joining game:", err);
            alert("Failed to join. Please try again.");
        }
    };

    if (player) {
        return (
            <div className={`player-container ${isPlayerTurn ? 'player-turn' : ''}`}>
             <span className="player-name">{player.name}</span>
             <span className="player-stack">
                 Stack: ${player.chips}
             </span>
             {player.isDealer && (
                 <span className="dealer-chip">Dealer</span>
             )}
         </div>
        );
        
    } else if (joining) {
        return (
            <div>
                <input type="text" placeholder="Enter your name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
                <input type="number" placeholder="Enter chip count" value={chipCount} onChange={(e) => setChipCount(e.target.value)} /> {/* New Input */}
                <button onClick={handleJoinSeat}>Confirm</button>
                <button onClick={() => setJoining(false)}>Cancel</button>
            </div>
        );
    } else {
        return <button onClick={() => setJoining(true)} disabled={!!player}>Join</button>;
    }
}



export default Seat;
