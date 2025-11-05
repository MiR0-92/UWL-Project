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
	// Global flags for player control
    window.player_controls_blinky = false;
    window.player_controls_pinky = false;
    window.player_controls_inky = false;
    window.player_controls_clyde = false;
    socket.on('player-join', function(ghostName) {
        var ghost = ghostMap[ghostName];
        if (ghost) {
            console.log('Player took control of ' + ghostName);
            
            // Check if ghost is outside the base.
            // If it's not (i.e., it's respawning), let the AI keep control.
            // The steering logic in Ghost.js will return control to the
            // player once the ghost exits the base.
            if (ghost.mode === GHOST_OUTSIDE) {
                ghost.ai = false;
            }
            
			if (ghostName === 'blinky') window.player_controls_blinky = true;
            if (ghostName === 'pinky') window.player_controls_pinky = true;
            if (ghostName === 'inky') window.player_controls_inky = true;
            if (ghostName === 'clyde') window.player_controls_clyde = true;
        }
    });

    socket.on('player-leave', function(ghostName) {
        var ghost = ghostMap[ghostName];
        if (ghost) {
            console.log('AI took control of ' + ghostName);
            ghost.ai = true;
			if (ghostName === 'blinky') window.player_controls_blinky = false;
            if (ghostName === 'pinky') window.player_controls_pinky = false;
            if (ghostName === 'inky') window.player_controls_inky = false;
            if (ghostName === 'clyde') window.player_controls_clyde = false;
            ghost.clearInputDir(); // Clear any lingering manual input
        }
    });

    socket.on('game-control', function(data) {
        var ghost = ghostMap[data.ghost];
        var dirEnum = directionMap[data.direction];
        
        if (ghost && dirEnum !== undefined) {
            if (data.pressed) {
                ghost.setInputDir(dirEnum);
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