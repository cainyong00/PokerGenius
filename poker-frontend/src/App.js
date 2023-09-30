import React, { useEffect, createContext, useState } from 'react';
import io from 'socket.io-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PokerTable from './components/PokerTable/PokerTable';
import CreateGame from './components/CreateGame';
import './styles.css';

export const SocketContext = createContext();

function App() {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io.connect('http://localhost:5000');
        setSocket(newSocket);
    
        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/game/:gameId" element={<PokerTable />} />
                        <Route path="/" element={<CreateGame />} />
                    </Routes>
                </div>
            </Router>
        </SocketContext.Provider>
    );
}

export default App;
