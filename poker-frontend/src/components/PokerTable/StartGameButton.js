import React, { useEffect, useState } from 'react';

function StartGameButton({ gameId, players, setPlayerCards, currentPlayerID, setGame }) {
    const [canStart, setCanStart] = useState(false);

    useEffect(() => {
        // Check if there are more than 2 players and update canStart state
        setCanStart(players.length >= 2);
    }, [players]);

    // Call this function when 'Start Game' is clicked
    const handleStartGame = async () => {
        try {
            const response = await fetch(`http://localhost:5000/game/${gameId}/start`, {
                method: 'POST'
            });
    
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
    
            const data = await response.json();
            const currentPlayer = data.players.find(p => p._id === currentPlayerID);
            setGame(data);
            if (currentPlayer) {
                setPlayerCards(currentPlayer.cards);  // Assuming each player object has a cards array
            } else {
                console.error("Current player not found in game data!");
            }
        } catch (err) {
            console.error("Error while starting game:", err);
        }
    };

    

    return (
        <button disabled={!canStart} onClick={handleStartGame}>
            Start Game
        </button>
    );
}

export default StartGameButton;
