import React, { useState, useEffect, useContext, useCallback } from 'react';
import Seat from './Seat';
import ActionButton from 'C:/Users/cainy/Desktop/Poker/poker-frontend/src/components/PokerTable/ActionButtons.js';
import StartGameButton from './StartGameButton';
import PlayerCardsComponent from 'C:/Users/cainy/Desktop/Poker/poker-frontend/src/components/PlayerCards.js';  // Import the PlayerCards component
import { useParams, useLocation } from 'react-router-dom';
import 'C:/Users/cainy/Desktop/Poker/poker-frontend/src/styles.css'; // Simplified path
import { SocketContext } from 'C:/Users/cainy/Desktop/Poker/poker-frontend/src/App.js';  // Simplified path
import CommunityCards from 'C:/Users/cainy/Desktop/Poker/poker-frontend/src/components/CommunityCards.js';
import PlayerStats from 'C:/Users/cainy/Desktop/Poker/poker-frontend/src/components/PlayerStats.js';  // Adjust path as necessary


function PokerTable() {

    const { gameId } = useParams();
    const { state } = useLocation();
    const socket = useContext(SocketContext);

    const [game, setGame] = useState({ players: [], state: "pre-deal" });
    const [player, setPlayer] = useState(state ? state.playerName : null);
    const [error, setError] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [PlayerCards, setPlayerCards] = useState(null);
    const [communityCards, setCommunityCards] = useState([]);
    const [currentPlayerTurn, setCurrentPlayerTurn] = useState(null);
    const [showLedger, setShowLedger] = useState(false);

    useEffect(() => {
        const storedPlayerId = sessionStorage.getItem('playerId');
        const storedPlayerName = sessionStorage.getItem('playerName');
        if (storedPlayerId) {
            setPlayerId(storedPlayerId);
        }
        if (storedPlayerName) {
            setPlayer(storedPlayerName);
        }
    }, []);
    
    const fetchGame = useCallback(async () => {
        try {
            console.log("Fetching game data for:", gameId);
            const res = await fetch(`http://localhost:5000/game/${gameId}`);
            const data = await res.json();
            setGame(data);
            setCommunityCards(data.communityCards || []);
            setCurrentPlayerTurn(data.currentPlayerTurn); // Update this here
            console.log("TURN", data.currentPlayerTurn )


            if (playerId) { // Ensure playerId state has been set
                const currentPlayer = data.players.find(p => p._id === playerId);
                if (currentPlayer) {
                    setPlayerCards(currentPlayer.cards);
                }
            }
            
        } catch (err) {
            console.error("Failed to fetch game data:", err);
            setError("Failed to fetch game data.");
        }
    }, [gameId, playerId]);

    useEffect(() => {
        if (!socket) return;
        
        fetchGame();

        const handleGameUpdates = (data) => {
            if (data && data.gameId === gameId) {
                console.log("Received update from socket for game:", gameId);
                fetchGame();
            }
        };

        socket.on('playerJoined', handleGameUpdates);
        socket.on('gameUpdated', handleGameUpdates);

        socket.on('connect_error', (error) => console.log("Connection Error:", error));
        socket.on('connect_timeout', (timeout) => console.log("Connection Timeout:", timeout));
        socket.on('error', (error) => console.log("Error Event:", error));
        
        socket.on('connect', () => {
            console.log("Socket connected:", socket.id);
            setTimeout(() => {
                socket.emit('testEvent', { message: "Hello from client!" });
                console.log("testEvent emitted.");
            }, 2000);
        });
        
        socket.on('disconnect', (reason) => console.log("Socket disconnected:", reason));

        return () => {
            socket.off('playerJoined', handleGameUpdates);
            socket.off('gameUpdated', handleGameUpdates);
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [gameId, socket, fetchGame]);

    if (error) return <div>Error: {error}</div>;
    if (!game || !game.players) return <div>Loading...</div>;

    const localPlayer = game.players.find(p => p._id === playerId);
    const rotationAmount = localPlayer ? calculateRotation(localPlayer.position) : 0;

    const rotatedSeats = [...Array(8).keys()].map(i => (i + rotationAmount) % 8 + 1);


    return (
        <div className="poker-table">
            <div className="seats">
                {rotatedSeats.map(position => (
                    <Seat
                        key={position}
                        position={position}
                        player={game.players.find(p => p.position === position)}
                        isPlayerTurn={game.players.find(p => p.position === position)?._id === currentPlayerTurn}
                        gameId={gameId}
                        currentPlayer={player}
                        players={game.players}
                        fetchGame={fetchGame}
                        setPlayer={setPlayer}
                        setPlayerId={setPlayerId}
                    />
                ))}
            </div>

            {/* Render Community Cards */}
            {game.state !== "pre-deal" && communityCards && (
                <CommunityCards cards={communityCards} />
            )}

            {game.state !== "pre-deal" && PlayerCards && (
                <PlayerCardsComponent cards={PlayerCards} />
            )}

            {game.state !== "pre-deal" && (
                <div className="pot-display">
                    Pot Amount: ${game.potAmount}
                </div>
            )}

            {game.state === "pre-deal" ? (
                <div className="start-game-button">
                    <StartGameButton gameId={gameId} players={game.players} currentPlayerID={playerId} setPlayerCards={setPlayerCards} setGame={setGame} />
                </div>
            ) : (
                <ActionButton 
                    player={localPlayer} 
                    gameId={gameId} 
                    setGame={setGame} 
                    playerId={playerId} 
                    setCommunityCards={setCommunityCards} 
                    highestBet={game.highestBet}
                    currentBet={localPlayer.currentBet} // Assuming this value exists
                    currentPlayerTurn = {currentPlayerTurn}
                    game = {game}
                />
            )}
             {/* Ledger Button */}
             <button className="ledger-button" onClick={() => setShowLedger(true)}>
                Show Ledger
            </button>

            {/* Ledger Modal */}
            {showLedger && <LedgerModal players={game.players} onClose={() => setShowLedger(false)} />}
        </div>
    );
}

function calculateRotation(currentPosition) {
    return (currentPosition - 5 + 8) % 8;
}
function LedgerModal({ players, onClose }) {
    return (
        <div className="ledger-modal">
            <h2>Game Ledger</h2>
            <table>
                <thead>
                    <tr>
                        <th>Player Name</th>
                        <th>Total Buy-In</th>
                        <th>Total Buy-Out</th>
                        <th>Current Stack</th>
                        <th>Net Profit</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => (
                        <tr key={player._id}>
                            <td>{player.name}</td>
                            <td>${player.buyIn}</td>
                            <td>${player.buyOut}</td>
                            <td>${player.currentStack}</td>
                            <td>${player.currentStack + player.buyOut - player.buyIn}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={onClose}>Close</button>
        </div>
    );
}







export default PokerTable;
