const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve all the game files
app.use(express.static(__dirname));

// Main game page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Controller page
app.get('/controller', (req, res) => {
    res.sendFile(path.join(__dirname, 'controller.html'), (err) => {
        if (err) {
            console.error('Failed to send controller.html:', err);
            res.status(404).send('Controller not found. Make sure you copied the file.');
        }
    });
});

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('A user connected.');
    
    // For now, we'll just assign the first user to Blinky (the red ghost)
    // We can make this more robust later.
    console.log('Assigning user to Blinky.');
    socket.broadcast.emit('player-join', 'blinky');

    socket.on('control', (data) => {
        // Pass the control data to the game, tagging it for Blinky
        data.ghost = 'blinky';
        socket.broadcast.emit('game-control', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected. Blinky is now AI controlled.');
        // Tell the game the player left
        socket.broadcast.emit('player-leave', 'blinky');
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Pac-Man is running!`);
    console.log(`- Game: http://localhost:${PORT}`);
    console.log(`- Controller: http://localhost:${PORT}/controller`);
});