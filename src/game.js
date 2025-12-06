//////////////////////////////////////////////////////////////////////////////////////
// Game

// game modes
var GAME_PACMAN = 0;
var GAME_MSPACMAN = 1;
var GAME_COOKIE = 2;
var GAME_OTTO = 3;

var practiceMode = false;
var turboMode = false;

// current game mode
var gameMode = GAME_PACMAN;
var getGameName = (function(){

    var names = ["PAC-MAN", "MS PAC-MAN", "COOKIE-MAN","CRAZY OTTO"];
    
    return function(mode) {
        if (mode == undefined) {
            mode = gameMode;
        }
        return names[mode];
    };
})();

var getGameDescription = (function(){

    var desc = [
        [
            "ORIGINAL ARCADE:",
            "NAMCO (C) 1980",
            "",
            "REVERSE-ENGINEERING:",
            "JAMEY PITTMAN",
            "",
            "REMAKE:",
            "SHAUN WILLIAMS",
        ],
        [
            "ORIGINAL ARCADE ADDON:",
            "MIDWAY/GCC (C) 1981",
            "",
            "REVERSE-ENGINEERING:",
            "BART GRANTHAM",
            "",
            "REMAKE:",
            "SHAUN WILLIAMS",
        ],
        [
            "A NEW PAC-MAN GAME",
            "WITH RANDOM MAZES:",
            "SHAUN WILLIAMS (C) 2012",
            "",
            "COOKIE MONSTER DESIGN:",
            "JIM HENSON",
            "",
            "PAC-MAN CROSSOVER CONCEPT:",
            "TANG YONGFA",
        ],
        [
            "THE UNRELEASED",
            "MS. PAC-MAN PROTOTYPE:",
            "GCC (C) 1981",
            "",
            "SPRITES REFERENCED FROM",
            "STEVE GOLSON'S",
            "CAX 2012 PRESENTATION",
            "",
            "REMAKE:",
            "SHAUN WILLIAMS",
        ],
    ];
    
    return function(mode) {
        if (mode == undefined) {
            mode = gameMode;
        }
        return desc[mode];
    };
})();

var getGhostNames = function(mode) {
    if (mode == undefined) {
        mode = gameMode;
    }
    if (mode == GAME_OTTO) {
        return ["plato","darwin","freud","newton"];
    }
    else if (mode == GAME_MSPACMAN) {
        return ["blinky","pinky","inky","clyde"];
    }
    else if (mode == GAME_PACMAN) {
        return ["blinky","pinky","inky","clyde"];
    }
    else if (mode == GAME_COOKIE) {
        return ["elmo","piggy","rosita","zoe"];
    }
};

var getGhostDrawFunc = function(mode) {
    if (mode == undefined) {
        mode = gameMode;
    }
    if (mode == GAME_OTTO) {
        return atlas.drawMonsterSprite;
    }
    else if (mode == GAME_COOKIE || mode == GAME_MSPACMAN) {
        return atlas.drawMuppetSprite;
    }
    else {
        return atlas.drawGhostSprite;
    }
};

var getPlayerDrawFunc = function(mode) {
    if (mode == undefined) {
        mode = gameMode;
    }
    if (mode == GAME_OTTO) {
        return atlas.drawOttoSprite;
    }
    else if (mode == GAME_PACMAN) {
        return atlas.drawPacmanSprite;
    }
    else if (mode == GAME_MSPACMAN) {
        // return atlas.drawMsPacmanSprite; //uncomment to use original ms pacman sprite.
        return drawCookiemanSprite;
    }
    else if (mode == GAME_COOKIE) {
        //return atlas.drawCookiemanSprite;
        return drawCookiemanSprite;
    }
};


// for clearing, backing up, and restoring cheat states (before and after cutscenes presently)
var clearCheats, backupCheats, restoreCheats;
(function(){
    clearCheats = function() {
        pacman.invincible = false;
        pacman.ai = true;
        for (i=0; i<5; i++) {
            actors[i].isDrawPath = false;
            actors[i].isDrawTarget = false;
        }
        pacman.isDrawTarget = true;
        executive.setUpdatesPerSecond(60);
    };

    var i, invincible, ai, isDrawPath, isDrawTarget;
    isDrawPath = {};
    isDrawTarget = {};
    backupCheats = function() {
        invincible = pacman.invincible;
        ai = pacman.ai;
        for (i=0; i<5; i++) {
            isDrawPath[i] = actors[i].isDrawPath;
            isDrawTarget[i] = actors[i].isDrawTarget;
        }
    };
    restoreCheats = function() {
        pacman.invincible = invincible;
        pacman.ai = ai;
        for (i=0; i<5; i++) {
            actors[i].isDrawPath = isDrawPath[i];
            actors[i].isDrawTarget = isDrawTarget[i];
        }
    };
})();

// Default settings
var NumStartingLives = 3;
var ExtraLifeScore = 10000;
var ShowPacmanPath = false;
var ShowGhostPaths = false;
var AutoPilot = true;

// AI Settings
var AIDepth = 15;
var HuntDotsDistanceThreshold = 75;

// current level, lives, and score
var level = 1;
var extraLives = 0;

// VCR functions

var savedLevel = {};
var savedExtraLives = {};
var savedHighScore = {};
var ghostHighScores = [];
var savedScore = {};
var savedState = {};

var saveGame = function(t) {
    savedLevel[t] = level;
    savedExtraLives[t] = extraLives;
    savedHighScore[t] = getHighScore();
    savedScore[t] = getScore();
    savedState[t] = state;
};
var loadGame = function(t) {
    level = savedLevel[t];
    if (extraLives != savedExtraLives[t]) {
        extraLives = savedExtraLives[t];
        renderer.drawMap();
    }
    setHighScore(savedHighScore[t]);
    setScore(savedScore[t]);
    state = savedState[t];
};

/// SCORING
// (manages scores and high scores for each game type)

var scores = [
    0,0, // pacman
    0,0, // mspac
    0,0, // cookie
    0,0, // otto
    0 ];
var highScores = [
    10000,10000, // pacman
    10000,10000, // mspac
    10000,10000, // cookie
    10000,10000, // otto
    ];

var getScoreIndex = function() {
    if (practiceMode) {
        return 8;
    }
    return gameMode*2 + (turboMode ? 1 : 0);
};

// handle a score increment
var addScore = function(p) {

    // get current scores
    var score = getScore();

    // handle extra life at 10000 points
    if (score < ExtraLifeScore && score+p >= ExtraLifeScore) {
        extraLives++;
        renderer.drawMap();
    }

    score += p;
    setScore(score);

    if (!practiceMode) {
        if (score > getHighScore()) {
            setHighScore(score);
        }
    }
};

var getScore = function() {
    return scores[getScoreIndex()];
};
var setScore = function(score) {
    scores[getScoreIndex()] = score;
};

var getHighScore = function() {
    return highScores[getScoreIndex()];
};
var setHighScore = function(highScore) {
    highScores[getScoreIndex()] = highScore;
    saveHighScores();
};
// High Score Persistence

var loadHighScores = function() {
    var hs;
    var hslen;
    var i;
    if (localStorage && localStorage.highScores) {
        hs = JSON.parse(localStorage.highScores);
        hslen = hs.length;
        for (i=0; i<hslen; i++) {
            highScores[i] = Math.max(highScores[i],hs[i]);
        }
    }
};
var saveHighScores = function() {
    if (localStorage) {
        localStorage.highScores = JSON.stringify(highScores);
    }
};

var loadGhostHighScores = function() {
    if (localStorage && localStorage.ghostHighScores) {
        ghostHighScores = JSON.parse(localStorage.ghostHighScores);
    } else {
        // Initialize with empty or default scores if you like
        ghostHighScores = [];
    }
};

var saveGhostHighScores = function() {
    if (localStorage) {
        localStorage.ghostHighScores = JSON.stringify(ghostHighScores);
    }
};
/**
 * Checks current ghost scores against the high score list,
 * adds them, sorts, truncates, and saves.
 */

var checkGhostHighScores = function() {
    // Get default AI names for the current game mode
    var defaultNames = getGhostNames();
    var ghostNameMap = {
        'blinky': defaultNames[0].toUpperCase(),
        'pinky':  defaultNames[1].toUpperCase(),
        'inky':   defaultNames[2].toUpperCase(),
        'clyde':  defaultNames[3].toUpperCase()
    };

    var newEntries = 0;

    // Add current game scores to the persistent list
    for (var i = 0; i < ghosts.length; i++) {
        var g = ghosts[i];
        if (g.score > 0) { // Only add players who scored
            ghostHighScores.push({
                name: g.playerName ? g.playerName.toUpperCase() : ghostNameMap[g.name],
                score: g.score,
                ghost: g.name // Store 'blinky', 'pinky', etc. to know which sprite to draw
            });
            newEntries++;
        }
    }

    // Only sort and save if new scores were added
    if (newEntries > 0) {
        // Sort by score, descending
        ghostHighScores.sort(function(a, b) {
            return (b.score || 0) - (a.score || 0);
        });

        // Keep only the top 10
        if (ghostHighScores.length > 10) {
            ghostHighScores = ghostHighScores.slice(0, 10);
        }

        // Save the new list to local storage
        saveGhostHighScores();
    }
};
function updateGhostDisplay(ghost) {
 
}
/**
 * Submits a single player-controlled ghost's score to the leaderboard.
 * This is called when a player disconnects.
 * @param {Ghost} ghost - The ghost object for the disconnecting player.
 */
var submitSingleGhostScore = function(ghost) {
    // Only submit if it's a player, they have a name, and score is positive
    if (!ghost || !ghost.playerName || ghost.score <= 0) {
        return; 
    }

    // Add this single score
    ghostHighScores.push({
        name: ghost.playerName.toUpperCase(),
        score: ghost.score,
        ghost: ghost.name
    });

    // Sort by score, descending
    ghostHighScores.sort(function(a, b) {
        return (b.score || 0) - (a.score || 0);
    });

    // Keep only the top 10
    if (ghostHighScores.length > 10) {
        ghostHighScores = ghostHighScores.slice(0, 10);
    }

    // Save the new list to local storage
    saveGhostHighScores();
    
    console.log("Submitted single score for " + ghost.playerName + ": " + ghost.score);
};

var loadAISettings = function() {
    if (localStorage && localStorage.AISettings) {
        var settings = JSON.parse(localStorage.AISettings);
        if (settings.numStartingLives) NumStartingLives = settings.numStartingLives;
        if (settings.extraLifeScore) ExtraLifeScore = settings.extraLifeScore;
        if (settings.aiDepth) AIDepth = settings.aiDepth;
        if (settings.showPacmanPath !== undefined) ShowPacmanPath = settings.showPacmanPath;
        if (settings.showGhostPaths !== undefined) ShowGhostPaths = settings.showGhostPaths;
        if (settings.autoPilot !== undefined) AutoPilot = settings.autoPilot;
    }

    blinky.isDrawPath = ShowGhostPaths;
    pinky.isDrawPath = ShowGhostPaths;
    inky.isDrawPath = ShowGhostPaths;
    clyde.isDrawPath = ShowGhostPaths;
};
var saveAISettings = function() {
    if (localStorage) {
        var newSettings = {
            numStartingLives: parseInt($("#startingLives").val()),
            extraLifeScore: parseInt($("#extraLifeScore").val()),
            aiDepth: parseInt($("#aiDepth").val()),
            showPacmanPath: $("#showPacmanPath").is(':checked'),
            showGhostPaths: $("#showGhostPaths").is(':checked'),
            autoPilot: !$("#playManually").is(':checked')
        };
        localStorage.AISettings = JSON.stringify(newSettings);
    }
};

function playLevelMusic(levelNum) {
    var trackName = null;

    // --- Song logic based on level number (from previous fix) ---
    if (levelNum >= 1 && levelNum <= 2) {
        trackName = 'music_lvl1';
    } else if (levelNum >= 3 && levelNum <= 5) {
        trackName = 'music_lvl2';
    } else if (levelNum >= 6 && levelNum <= 9) {
        trackName = 'music_lvl3';
    } else if (levelNum == 10) {
        trackName = 'music_lvl4';
    } else if (levelNum == 11) {
        trackName = 'music_lvl5';
    } else if (levelNum == 12) {
        trackName = 'music_random';
    } else if (levelNum > 12) {
        var tracks = ['music_lvl1', 'music_lvl2', 'music_lvl3', 'music_lvl4', 'music_lvl5', 'music_random'];
        var randomIndex = Math.floor(Math.random() * tracks.length);
        trackName = tracks[randomIndex];
    }
    // --- END: Song logic ---

    if (trackName) {
        
        // --- START OF NEW FIX ---
        // Check which song to play.
        // Only level1 and random are allowed to overlap with ms_start.
        if (trackName === 'music_lvl1' || trackName === 'music_random' || trackName === 'music_lvl5') {
            // Play these tracks immediately.
            audio.playMusic(trackName);
        } else {
            // Delay all other tracks to let 'ms_start' finish.
            setTimeout(function() {
                audio.playMusic(trackName);
            }, 2500); // 2.5-second delay
        }
        // --- END OF NEW FIX ---

    } else {
        // Stop music if no track is selected (e.g., in cutscenes)
        audio.stopMusic();
    }
}