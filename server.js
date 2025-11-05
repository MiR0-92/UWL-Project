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

let gameSocket = null;
const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];
// New players object: stores player data keyed by ghost name
// null means the ghost is AI-controlled
let players = {
    'blinky': null,
    'pinky': null,
    'inky': null,
    'clyde': null
};

// Helper function to get the current player status
function getPlayerStatus() {
    const status = {};
    for (const ghostName of GHOST_NAMES) {
        if (players[ghostName]) {
            status[ghostName] = { name: players[ghostName].name };
        } else {
            status[ghostName] = null;
        }
    }
    return status;
}

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Immediately send the current ghost status to the new connection
    socket.emit('ghost-status', getPlayerStatus());

    socket.on('controller-ready', () => {
        // This is sent when a controller loads, just send them the latest status
        console.log(`Controller ${socket.id} is ready, sending status.`);
        socket.emit('ghost-status', getPlayerStatus());
    });
    
    socket.on('join-request', (data) => {
        const { name, ghost } = data;

        if (!ghost || !GHOST_NAMES.includes(ghost)) {
            console.log(`Controller ${socket.id} sent invalid join request.`);
            socket.emit('join-error', { message: 'Invalid ghost selected.' });
            return;
        }

        if (players[ghost]) {
            // Ghost is already taken
            console.log(`Controller ${socket.id} tried to take ${ghost}, but it's held by ${players[ghost].name}`);
            socket.emit('join-error', { message: `${ghost} is already taken by ${players[ghost].name}!` });
        } else {
            // Assign ghost to this player
            players[ghost] = { id: socket.id, name: name };
            socket.ghostName = ghost; // Store a reference on the socket for quick lookup
            
            console.log(`Controller ${socket.id} (${name}) successfully joined as ${ghost}`);
            
            // 1. Tell the controller it was successful
            socket.emit('join-success', { name: name, ghost: ghost });

            // 2. Tell the game a player joined (using the *existing* event)
            if (gameSocket) {
                gameSocket.emit('player-join', ghost);
            }

            // 3. Tell *all* controllers about the new status
            io.emit('ghost-status', getPlayerStatus());
        }
    });

    socket.on('game-ready', () => {
        console.log(`Game client connected: ${socket.id}`);
        gameSocket = socket;
        // Tell the game about all controllers that are *already* connected
        for (const ghostName of GHOST_NAMES) {
            if (players[ghostName]) {
                console.log(`Notifying game of existing player: ${ghostName}`);
                gameSocket.emit('player-join', ghostName);
            }
        }
    });
    
    socket.on('control', (data) => {
        const ghostName = socket.ghostName; // Find which ghost this socket controls
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

        const ghostName = socket.ghostName; // Get ghost name from the socket
        if (ghostName) {
            // This was a player
            console.log(`Player ${players[ghostName].name} for ${ghostName} disconnected. ${ghostName} is now AI controlled.`);
            players[ghostName] = null; // Free up the ghost
            
            // 1. Tell the game the player left (using the *existing* event)
            if (gameSocket) {
                gameSocket.emit('player-leave', ghostName);
            }

            // 2. Tell *all* controllers the ghost is now available
            io.emit('ghost-status', getPlayerStatus());
        }
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Pac-Man is running!`);
    console.log(`- Game: http://localhost:${PORT}`);
    console.log(`- Controller: http://localhost:${PORT}/controller`);
});