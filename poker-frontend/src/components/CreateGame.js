import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateGame() {
    const [smallBlind, setSmallBlind] = useState('');  // small blind state
    const [bigBlind, setBigBlind] = useState('');  // big blind state
    const navigate = useNavigate();

    const handleCreateGame = async () => {
        try {
            if (!smallBlind || !bigBlind || smallBlind <= 0 || bigBlind <= 0) {
                alert("Please enter valid small and big blind values.");
                return;
            }

            // Make an API call to your backend to create a new game
            const response = await fetch('http://localhost:5000/game/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smallBlind, bigBlind })  // Sending blinds
            });

            const data = await response.json();
            console.log("Received game ID:", data.gameId);

            // If game creation is successful and you get a game ID back, redirect to the game page
            if (data.success && data.gameId) {
                navigate(`/game/${data.gameId}`);
            } else {
                console.error("Error creating game:", data.message);
                // Optionally, show an error message to the user using a state or any other preferred method
            }
        } catch (err) {
            console.error("Error while creating game:", err);
        }
    };

    return (
        <div>
            <input 
                type="number"
                value={smallBlind}
                onChange={(e) => setSmallBlind(Number(e.target.value))}
                placeholder="Enter small blind"
            />
            <input 
                type="number"
                value={bigBlind}
                onChange={(e) => setBigBlind(Number(e.target.value))}
                placeholder="Enter big blind"
            />
            <button onClick={handleCreateGame}>Create New Game</button>
        </div>
    );
}

export default CreateGame;
