import React, { useState, useEffect } from 'react';

function ActionButtons({ player, gameId, setGame, playerId, setCommunityCards, highestBet, currentBet, currentPlayerTurn, game }) {
    const [betAmount, setBetAmount] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Clear the error when it's not the player's turn
        if (currentPlayerTurn !== playerId) {
            setError(null);
        }
    }, [currentPlayerTurn, playerId]);
    if (!player) return null;

    const handleAction = async (action) => {
        try {
            console.log("Player Info:", playerId);
            console.log("GAMEID:", gameId);
            const payload = {
                playerId: playerId,
                action: action
            };

            // Only add the amount to the payload if the action is 'bet' or 'raise'
            if (action === 'bet' || action === 'raise') {
                payload.amount = betAmount;
            }

            const response = await fetch(`http://localhost:5000/game/${gameId}/player/${playerId}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }

            const data = await response.json();
            setGame(data);
            setCommunityCards(data.communityCards);
            
            console.log(data.highestBet);
            
        } catch (err) {
            console.error("Error while performing game action:", err);
            setError(err.message);
        }
        
    };

    // Calculate button availability
    const isBetDisabled = highestBet !== 0 || currentPlayerTurn !== playerId;
    const isCheckDisabled = highestBet > player.currentBet || currentPlayerTurn !== playerId;
    const isRaiseDisabled = highestBet === 0 || currentPlayerTurn !== playerId;
    const isCallDisabled = currentBet >= highestBet || highestBet === 0 || currentPlayerTurn !== playerId;
    const isFoldDisabled = currentPlayerTurn !== playerId;

    return (
        <div className="action-buttons">
            {error && (
            <div className="errorModal">
                <div className="modal-content">
                    <span className="close-btn" onClick={() => setError(null)}>&times;</span>
                        <p>{error}</p>
                </div>
            </div>
            )}
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} placeholder="Bet/Raise Amount" />
            <button onClick={() => handleAction('bet')} disabled={isBetDisabled}>Bet</button>
            <button onClick={() => handleAction('check')} disabled={isCheckDisabled}>Check</button>
            <button onClick={() => handleAction('fold')} disabled={isFoldDisabled}>Fold</button>
            <button onClick={() => handleAction('raise')} disabled={isRaiseDisabled}>Raise</button>
            <button onClick={() => handleAction('call')} disabled={isCallDisabled}>Call</button>
        </div>
    );
}

export default ActionButtons;