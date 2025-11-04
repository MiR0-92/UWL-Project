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

let players = {}; // Stores { socket.id: ghostName }
let gameSocket = null;
const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on('controller-ready', () => {
        // Find first available ghost
        let assignedGhost = null;
        const takenGhosts = Object.values(players);
        for (const ghostName of GHOST_NAMES) {
            if (!takenGhosts.includes(ghostName)) {
                assignedGhost = ghostName;
                break;
            }
        }

        if (assignedGhost) {
            players[socket.id] = assignedGhost;
            console.log(`Controller ${socket.id} assigned to ${assignedGhost}`);
            // Tell the game a player joined
            if (gameSocket) {
                gameSocket.emit('player-join', assignedGhost);
            }
        } else {
            console.log(`Controller ${socket.id} tried to join, but no ghosts are available.`);
            // You could optionally tell the controller it's a spectator
            // socket.emit('spectate', 'All ghosts are taken.');
        }
    });

    socket.on('game-ready', () => {
        console.log(`Game client connected: ${socket.id}`);
        gameSocket = socket;
        // Tell the game about all controllers that are already connected
        for (const [id, ghostName] of Object.entries(players)) {
            console.log(`Notifying game of existing player: ${ghostName}`);
            gameSocket.emit('player-join', ghostName);
        }
    });
    
    socket.on('control', (data) => {
        const ghostName = players[socket.id]; // Find which ghost this socket controls
        if (ghostName && gameSocket) {
            // Pass the control data to the game, tagging it for the correct ghost
            data.ghost = ghostName;
            gameSocket.emit('game-control', data);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        if (gameSocket && gameSocket.id === socket.id) {
            console.log('Game client disconnected.');
            gameSocket = null;
        }

        const ghostName = players[socket.id];
        if (ghostName) {
            // This was a player
            console.log(`Player for ${ghostName} disconnected. ${ghostName} is now AI controlled.`);
            delete players[socket.id];
            // Tell the game the player left
            if (gameSocket) {
                gameSocket.emit('player-leave', ghostName);
            }
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Pac-Man is running!`);
    console.log(`- Game: http://localhost:${PORT}`);
    console.log(`- Controller: http://localhost:${PORT}/controller`);
});