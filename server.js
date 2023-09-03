require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Middlewares
// Explicitly define origin for CORS
app.use(cors({
    origin: 'http://localhost:3000', // Adjust this if your frontend changes
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json());

const server = http.createServer(app);
// Explicitly define CORS for socket.io
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});


// Socket.io connection setup
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    // Listen for a player action or join event and then broadcast it
    socket.on('playerAction', (data) => {
        io.emit('updateGame', data);
    });

    socket.on('playerJoined', (data) => {
        io.emit('updateGame', data);
    });

    // Test socket event for diagnosis
    socket.on('testEvent', (data) => {
        console.log('Received test event:', data.message);
    });
});

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Poker Server!');
});

app.use('/game', (req, res, next) => {
    req.io = io;
    next();
}, gameRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });
