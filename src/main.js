//////////////////////////////////////////////////////////////////////////////////////
// Entry Point

window.addEventListener("load", function() {
    loadHighScores();
	loadAISettings();
    initRenderer();
    atlas.create();
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

    var GHOST_DEFAULTS = {};

    /**
     * Updates the player status panel with the correct name and color.
     * @param {string} ghostName - The internal name ('blinky', 'pinky', etc.)
     * @param {string} displayName - The name to display.
     */
    function updatePlayerStatus(ghostName, displayName) {
        const rowElement = document.getElementById('status-' + ghostName);
        if (rowElement) {
            const nameElement = rowElement.querySelector('.player-name');
            nameElement.textContent = displayName.toUpperCase();
            
            const defaultInfo = GHOST_DEFAULTS[ghostName];
            if (displayName.toUpperCase() === defaultInfo.name) {
                // It's an AI, use the ghost's color
                nameElement.style.color = defaultInfo.color;
            } else {
                // It's a human player, use white
                nameElement.style.color = defaultInfo.color;
            }
        }
    }

    /**
     * Initializes the player status panel with the correct default names
     * for the current game mode.
     */
    function initializePlayerStatusPanel() {
        const names = getGhostNames(); // Get names for current gameMode
        
        // Use data from actors.js for colors
        GHOST_DEFAULTS = {
            'blinky': { name: names[0].toUpperCase(), color: blinky.color },
            'pinky':  { name: names[1].toUpperCase(), color: pinky.color },
            'inky':   { name: names[2].toUpperCase(), color: inky.color },
            'clyde':  { name: "CLYDE", color: clyde.color }
        };

        // Set initial text and colors for all ghosts
        for (const ghostName in GHOST_DEFAULTS) {
            updatePlayerStatus(ghostName, GHOST_DEFAULTS[ghostName].name);
        }
    }
    
    // Initialize the panel right after setting the game state
    initializePlayerStatusPanel();

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
            console.log('Player ' + playerName + ' took control of ' + ghostName);
            
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

            // Update the status panel
            updatePlayerStatus(ghostName, playerName);
        }
    });

    socket.on('player-leave', function(ghostName) {
        var ghost = ghostMap[ghostName];
        if (ghost) {
            console.log('AI took control of ' + ghostName);
            ghost.ai = true; //
			if (ghostName === 'blinky') window.player_controls_blinky = false;
            if (ghostName === 'pinky') window.player_controls_pinky = false;
            if (ghostName === 'inky') window.player_controls_inky = false;
            if (ghostName === 'clyde') window.player_controls_clyde = false;
            ghost.clearInputDir(); // Clear any lingering manual input

            // Revert status panel to AI default
            updatePlayerStatus(ghostName, GHOST_DEFAULTS[ghostName].name);
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