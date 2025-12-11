const playerSessions = {};
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
app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'join.html'), (err) => {
        if (err) {
            console.error('Failed to send join.html:', err);
            res.status(404).send('Controller not found. Make sure you copied the file.');
        }
    });
});

let gameSocket = null;
const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];

// --- START OF MODIFICATION ---
// All possible AI ghost names from src/game.js to block players from using
const AI_GHOST_NAMES = [
    'blinky', 'pinky', 'inky', 'clyde', 'sue', // Pac-Man & Ms. Pac-Man names
    'plato', 'darwin', 'freud', 'newton',       // Crazy Otto names
    'elmo', 'piggy', 'rosita', 'zoe'             // Cookie-Man names
];
// --- END OF MODIFICATION ---


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

// --- START: Refactored Disconnect Logic ---
/**
 * Handles all logic for when a player (controller) or game disconnects.
 * @param {Socket} socket - The socket that is disconnecting.
 */
function handleDisconnect(socket) {
    const startHandoff = process.hrtime(); // [START TIMER]

    console.log(`Handling disconnect for: ${socket.id}`);

    if (gameSocket && gameSocket.id === socket.id) {
        console.log('Game client disconnected.');
        gameSocket = null;
    }

    const ghostName = socket.ghostName; 
    if (ghostName && players[ghostName]) { 
        console.log(`Player ${players[ghostName].name} for ${ghostName} disconnected. ${ghostName} is now AI controlled.`);
        players[ghostName] = null; 
        
        if (gameSocket) {
            gameSocket.emit('player-leave', ghostName);
        }

        io.emit('ghost-status', getPlayerStatus());

        // [END TIMER] - Calculate execution time
        const endHandoff = process.hrtime(startHandoff);
        // Convert [seconds, nanoseconds] to milliseconds
        const timeInMs = (endHandoff[0] * 1000 + endHandoff[1] / 1e6).toFixed(3);
        
        console.log(`[METRIC] AI-Handoff Execution Time: ${timeInMs}ms`); 
    } else {
        console.log('Disconnect was not for an active player or game.');
    }
}
// --- END: Refactored Disconnect Logic ---


// Socket.io connection logic
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Immediately send the current ghost status to the new connection
    socket.emit('ghost-status', getPlayerStatus());
    
    socket.on("latency-ping", (startTime) => {
    socket.emit("latency-pong", startTime);
  });
    socket.on('controller-ready', () => {
        // This is sent when a controller loads, just send them the latest status
        console.log(`Controller ${socket.id} is ready, sending status.`);
        socket.emit('ghost-status', getPlayerStatus());
    });
    
    // --- MODIFIED: Added Duplicate Name Check ---
socket.on('join-request', (data) => {
    
        const { name, ghost } = data;

        // Validation 1: Check if player is trying to use a reserved ghost name
        if (AI_GHOST_NAMES.includes(name.toLowerCase())) {
            socket.emit('join-error', { message: 'Name Already Taken!' });
            return;
        }

        // Validation 2: Duplicate Name Check
        let nameInUse = false;
        for (const ghostKey in players) {
            if (players[ghostKey] && players[ghostKey].name.toLowerCase() === name.toLowerCase()) {
                nameInUse = true;
                break;
            }
        }
        if (nameInUse) {
            socket.emit('join-error', { message: 'Name is already in use!' });
            return;
        }

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
            // SUCCESSFUL JOIN
            players[ghost] = { id: socket.id, name: name };
            socket.ghostName = ghost; 
            
            console.log(`Controller ${socket.id} (${name}) successfully joined as ${ghost}`);
            
            // 1. Tell the controller it was successful
            socket.emit('join-success', { name: name, ghost: ghost });

            // 2. Tell the game a player joined
            if (gameSocket) {
                gameSocket.emit('player-join', { ghost: ghost, name: name });
                gameSocket.emit('reset-ghost-score', ghost);
            }

            // 3. Tell all controllers about the new status
            io.emit('ghost-status', getPlayerStatus());

            // +++ MOVED CODE: Only start the timer if they successfully JOIN +++
            playerSessions[socket.id] = {
                startTime: Date.now(),
                name: data.name
            };
            console.log(`[START] Player ${data.name} joined at ${new Date().toLocaleTimeString()}`);
        }
    });
    // --- END: MODIFIED join-request ---

    socket.on('game-ready', () => {
        console.log(`Game client connected: ${socket.id}`);
        gameSocket = socket;
        // Tell the game about all controllers that are *already* connected
        for (const ghostName of GHOST_NAMES) {
            if (players[ghostName]) {
                console.log(`Notifying game of existing player: ${ghostName}`);
                // --- START OF MODIFICATION ---
                // Send player's name along with the ghost
                gameSocket.emit('player-join', { ghost: ghostName, name: players[ghostName].name });
                // --- END OF MODIFICATION ---
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

    // --- START: New Listeners for Exit Logic ---
    socket.on('client-leave-request', () => {
        const ghostName = socket.ghostName;
        if (!ghostName) {
            // This socket isn't a ghost, just disconnect them.
            socket.disconnect();
            return;
        }

        if (gameSocket) {
            // Ask the game for the final score
            console.log(`Requesting final score for ${ghostName} (${socket.id})`);
            gameSocket.emit('get-final-score', { socketId: socket.id, ghostName: ghostName });
        } else {
            // Game isn't running, just let them exit with score 0
            socket.emit('receive-exit-data', { score: 0 });
            // Manually trigger disconnect logic for this player
            handleDisconnect(socket); 
        }
    });

    socket.on('return-final-score', (data) => {
        const { socketId, score } = data;
        console.log(`Received final score ${score} for ${socketId}`);
        
        // Find the controller socket by its ID
        const controllerSocket = io.sockets.sockets.get(socketId);
        if (controllerSocket) {
            // Send them their score so they can show the exit screen
            controllerSocket.emit('receive-exit-data', { score: score });
            
            // Now, process their disconnection
            handleDisconnect(controllerSocket);
        }
    });
    // --- END: New Listeners for Exit Logic ---


    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Call the refactored function
        handleDisconnect(socket);
        // +++ NEW CODE: Calculate and log the duration
        if (playerSessions[socket.id]) {
            const session = playerSessions[socket.id];
            const endTime = Date.now();
            
            // Calculate duration in minutes and seconds
            const durationMs = endTime - session.startTime;
            const minutes = Math.floor(durationMs / 60000);
            const seconds = ((durationMs % 60000) / 1000).toFixed(0);

            console.log(`[END] Player ${session.name} disconnected.`);
            console.log(`      Disconnect Time: ${new Date().toLocaleTimeString()}`);
            console.log(`      ACTUAL DURATION: ${minutes}m ${seconds}s`);
            
            // Clear the memory
            delete playerSessions[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Cookie-Eater is running!`);
    console.log(`- Game: http://localhost:${PORT}`);
    console.log(`- Controller: http://localhost:${PORT}/join`);
});