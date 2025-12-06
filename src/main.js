//////////////////////////////////////////////////////////////////////////////////////
// Entry Point

window.addEventListener("load", function() {
    loadHighScores();
    loadGhostHighScores();
	loadAISettings();
    initRenderer();
    atlas.create();
var audioUnlocked = false;
    function unlockAudio() {
        if (audioUnlocked) return;
        audio.init();
        audioUnlocked = true;
        // Remove listeners so they don't fire again
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        console.log("Audio unlocked by user interaction.");
    }
    // We must listen on 'click' AND 'touchstart' for mobile
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    //initSwipe();
	var anchor = window.location.hash.substring(1);
	if (anchor == "learn") {
		switchState(learnState);
	}
	else if (anchor == "cheat_pac" || anchor == "cheat_mspac") {
		gameMode = (anchor == "cheat_pac") ? GAME_PACMAN : GAME_MSPACMAN;
		practiceMode = true;
        switchState(newGameState);
		for (var i=0; i<4; i++) {
			ghosts[i].isDrawTarget = true;
			ghosts[i].isDrawPath = true;
		}
	}
	else {
		gameMode = GAME_MSPACMAN;
		switchState(newGameState);
	}
    executive.init();

	// Map controller strings to game direction enums
    var directionMap = {
        'up': DIR_UP,
        'left': DIR_LEFT,
        'down': DIR_DOWN,
        'right': DIR_RIGHT
    };

    // Map ghost names to their objects
    var ghostMap = {
        'blinky': blinky,
        'pinky': pinky,
        'inky': inky,
        'clyde': clyde
    };

    var socket = io();
	socket.emit('game-ready');

    // --- START OF MODIFICATION ---
    // All HTML panel update functions have been removed.
    // We will still store ghost names for the new UI.
    // --- END OF MODIFICATION ---

	// Global flags for player control
    window.player_controls_blinky = false;
    window.player_controls_pinky = false;
    window.player_controls_inky = false;
    window.player_controls_clyde = false;

    // --- START OF MODIFICATION ---
    // Updated to receive an object {ghost, name}
    socket.on('player-join', function(data) {
        var ghostName = data.ghost;
        var playerName = data.name;
        var ghost = ghostMap[ghostName];
        
        if (ghost) {
            ghost.playerName = playerName; // This is all we need to do now
            console.log('Player ' + playerName + ' took control of ' + ghostName);
            ghost.visible = true; 

            // --- FIX 2: "Exact Moment of Death" Reset ---
            if (ghost.mode === GHOST_EATEN) {
                console.log("Joined during death freeze. Forcing reset.");
                ghost.reset();          
                ghost.scared = false;   
                ghost.eaten = false;
                
                // --- CORRECTED LOGIC HERE ---
                // 1. We REMOVED the bad line: ghost.mode = GHOST_SCATTER;
                
                // 2. If the reset put the ghost inside the house (Pinky/Inky/Clyde),
                //    force them to leave immediately so the player doesn't wait.
                if (ghost.mode === GHOST_PACING_HOME || ghost.mode === GHOST_ENTERING_HOME) {
                    ghost.leaveHome(); 
                }
                
                // 3. If it is Blinky, he spawns outside, so ensure mode is correct.
                if (ghostName === 'blinky') {
                    ghost.mode = GHOST_OUTSIDE;
                }
            }
            
            // Check if ghost is outside the base.
            // If it's not (i.e., it's respawning), let the AI keep control.
            // The steering logic in Ghost.js will return control to the
            // player once the ghost exits the base.
            if (ghost.mode === GHOST_OUTSIDE) { //
                ghost.ai = false; //
            }
            
			if (ghostName === 'blinky') window.player_controls_blinky = true;
            if (ghostName === 'pinky') window.player_controls_pinky = true;
            if (ghostName === 'inky') window.player_controls_inky = true;
            if (ghostName === 'clyde') window.player_controls_clyde = true;

            // REMOVED: updatePlayerStatus(ghostName, playerName);
        }
    });

    socket.on('player-leave', function(ghostName) {
        var ghost = ghostMap[ghostName];
        if (ghost) {
            ghost.playerName = null; // This is all we need to do now
            console.log('AI took control of ' + ghostName);
            ghost.ai = true; //
			if (ghostName === 'blinky') window.player_controls_blinky = false;
            if (ghostName === 'pinky') window.player_controls_pinky = false;
            if (ghostName === 'inky') window.player_controls_inky = false;
            if (ghostName === 'clyde') window.player_controls_clyde = false;
            ghost.clearInputDir(); // Clear any lingering manual input
            // --- NEW: Reset score for AI ---
            ghost.score = 0;
            console.log('Score reset for AI on ' + ghostName);

            if (ghost.mode === GHOST_EATEN) {
                ghost.mode = GHOST_GOING_HOME;
                ghost.targetting = 'door';
            }
            // REMOVED: updatePlayerStatus(ghostName, GHOST_DEFAULTS[ghostName].name);
        }
    });
    // --- END OF MODIFICATION ---

    socket.on('game-control', function(data) {
        var ghost = ghostMap[data.ghost];
        var dirEnum = directionMap[data.direction];
        
        if (ghost && dirEnum !== undefined) {
            if (data.pressed) {
                ghost.setInputDir(dirEnum); //
            } else {
                // Note: The original `calvinjc` input logic clears
                // the direction on 'keyup'. Your controller only sends 'touchstart'.
                // You might want to adjust this, but for now, we'll just set the direction.
                // ghost.clearInputDir(dirEnum); 
            }
        }
    });

    // --- START: New Score Request Listener ---
    socket.on('get-final-score', function(data) {
        const { socketId, ghostName } = data;
        let finalScore = 0;
        
        const ghost = ghostMap[ghostName];
        if (ghost) {
            finalScore = ghost.score || 0;
            // --- NEW: Submit player's score to the leaderboard ---
            submitSingleGhostScore(ghost);
        }
        
        // Send the score back to the server, tagging it with the socket.id
        socket.emit('return-final-score', { socketId: socketId, score: finalScore });
    });
    // Reset score on player join
    socket.on('reset-ghost-score', function(ghostName) {
        var ghost = ghostMap[ghostName];
        if (ghost) {
            ghost.score = 0;
            console.log('Score reset for new player on ' + ghostName);
        }
    });
    // --- END: New Score Request Listener ---

	$("#startingLives").val(NumStartingLives);
	$("#extraLifeScore").val(ExtraLifeScore);

	$("#aiDepth").val(AIDepth);
	$("#showPacmanPath").prop('checked', ShowPacmanPath);
	$("#showGhostPaths").prop('checked', ShowGhostPaths);
	blinky.isDrawPath = ShowGhostPaths;
	pinky.isDrawPath = ShowGhostPaths;
	inky.isDrawPath = ShowGhostPaths;
	clyde.isDrawPath = ShowGhostPaths;
    $("#playManually").prop('checked', !AutoPilot);
	if (/Mobi/.test(navigator.userAgent)) {
		$("#play-manually-group").hide();
	}

	$("#aiDepth").change(function() {
		AIDepth = parseInt($("#aiDepth").val());
		saveAISettings();
	});

	$("#showPacmanPath").click(function() {
		ShowPacmanPath = $("#showPacmanPath").is(':checked');
		saveAISettings();
	});

	$("#showGhostPaths").click(function() {
		ShowGhostPaths = $("#showGhostPaths").is(':checked');
		saveAISettings();

		blinky.isDrawPath = ShowGhostPaths;
		pinky.isDrawPath = ShowGhostPaths;
		inky.isDrawPath = ShowGhostPaths;
		clyde.isDrawPath = ShowGhostPaths;
	});

	$("#playManually").click(function() {
		AutoPilot = !$("#playManually").is(':checked');
		saveAISettings();
	});

	$("#restartBtn").click(function() {
		saveAISettings();
		switchState(newGameState);
	});
});