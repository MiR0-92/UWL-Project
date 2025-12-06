//////////////////////////////////////////////////////////////////////////////////////
// Energizer

// This handles how long the energizer lasts as well as how long the
// points will display after eating a ghost.

var energizer = (function() {

    // --- START OF MODIFICATION ---

    // Killstreak sound and text definitions
    const STREAK_SOUNDS = [
        'firstblood',   // 1
        'doublekill',   // 2
        'multikill',    // 3
        'ultrakill',    // 4
        'rampage',      // 5
        'unstoppable',  // 6
        'godlike',      // 7
        'monsterkill'   // 8
    ];
    const STREAK_TEXTS = [
        'FIRST-BLOOD!',
        'DOUBLE-KILL!',
        'MULTI-KILL!',
        'ULTRA-KILL!',
        'RAMPAGE!',
        'UNSTOPPABLE!',
        'GODLIKE!',
        'MONSTER-KILL!'
    ];

    // Timer durations in frames (60 frames = 1 second)
    const STREAK_TIMER_DURATION = 1800; // 30 seconds
    const STREAK_TEXT_DURATION = 120; // 2 seconds

    // --- END OF MODIFICATION ---

    // how many seconds to display points when ghost is eaten
    var pointsDuration = 1;

    // how long to stay energized based on current level
    var getDuration = (function(){
        // MODIFIED: New durations requested by user
        // Levels 1-18:
        var seconds = [
            6, // Level 1
            6,  // Level 2
            6,  // Level 3
            6,  // Level 4
            5,  // Level 5
            5,  // Level 6
            5,  // Level 7
            5,  // Level 8
            5,  // Level 9
            4,  // Level 10
            4,  // Level 11
            4,  // Level 12
            4,  // Level 13
            4,  // Level 14
            4,  // Level 15
            4,  // Level 16
            4,  // Level 17
            3   // Level 18
        ];
        return function() {
            var i = level;
            // MODIFIED: After level 18 (i.e., 19+), duration is 3 seconds
            if (i > 18) {
                return 60 * 3; 
            }
            // For levels 1-18, use the array
            return 60 * seconds[i-1];
        };
    })();

    // how many ghost flashes happen near the end of frightened mode based on current level
    var getFlashes = (function(){
        var flashes = [5,5,5,5,5,5,5,5,3,5,5,3,3,5,3,3,0,3];
        return function() {
            var i = level;
            return (i > 18) ? 5 : flashes[i-1];
        };
    })();

    // "The ghosts change colors every 14 game cycles when they start 'flashing'" -Jamey Pittman
    var flashInterval = 14;

    var count;  // how long in frames energizer has been active
    var active; // indicates if energizer is currently active
    var points; // points that the last eaten ghost was worth
    var pointsFramesLeft; // number of frames left to display points earned from eating ghost
    var flashing = false;
    var savedCount = {};
    var savedActive = {};
    var savedPoints = {};
    var savedPointsFramesLeft = {};
    var savedFlashing = {};
    // save state at time t
    var save = function(t) {
        savedCount[t] = count;
        savedActive[t] = active;
        savedPoints[t] = points;
        savedPointsFramesLeft[t] = pointsFramesLeft;
        savedFlashing[t] = flashing;
        // Note: We are not saving/loading killstreak state for the VCR
    };

    // load state at time t
    var load = function(t) {
        count = savedCount[t];
        active = savedActive[t];
        points = savedPoints[t];
        pointsFramesLeft = savedPointsFramesLeft[t];
        flashing = savedFlashing[t];
        // Note: We are not saving/loading killstreak state for the VCR
    };

    

    return {
        save: save,
        load: load,

        // --- START OF MODIFICATION ---
        // Killstreak properties
        killStreakCount: 0,     // Current number of ghosts in streak
        killStreakTimer: 0,     // 30-second timer
        killStreakText: "",     // Text to display
        killStreakTextTimer: 0, // Timer for displaying text
        // --- END OF MODIFICATION ---

reset: function() {
            audio.stop('fright');
            audio.stop('ms_fright_flash'); // <<< ADD THIS
            count = 0;
            active = false;
            flashing = false; // <<< ADD THIS
            points = 100;
            pointsFramesLeft = 0;
            for (i=0; i<4; i++)
                ghosts[i].scared = false;

            // --- START OF MODIFICATION ---
            // This function is now a "hard reset" called on new levels and deaths.
            // We can safely reset the killstreak here.
            this.killStreakCount = 0;
            this.killStreakTimer = 0;
            this.killStreakText = "";
            this.killStreakTextTimer = 0;
            // --- END OF MODIFICATION ---
        },
update: function() {
            var i;
            if (active) {
                // --- START OF MODIFICATION: Inlined reset() logic ---
                if (count == getDuration()) {
                    // this.reset(); // Don't call this, as it resets the killstreak timer!
                    
                    // Instead, do the "energizer end" logic manually:
                    audio.stop('fright');
                    audio.stop('ms_fright_flash'); // <<< ADD THIS
                    audio.play('siren', true);
                    count = 0;
                    active = false;
                    flashing = false; // <<< ADD THIS
                    points = 100; // Reset points for the *next* energizer
                    pointsFramesLeft = 0;
                    for (i=0; i<4; i++)
                        ghosts[i].scared = false;
                }
                // --- END OF MODIFICATION ---
                else {
                    count++;

                    // --- START: New flashing sound logic ---
                    if (getFlashes() > 0) { // Only check if this level has flashes
                        // Calculate total time flashing lasts
                        var flashThreshold = (2*getFlashes()-1) * flashInterval;
                        var timeLeft = getDuration() - count;
                        
                        if (timeLeft <= flashThreshold && !flashing) {
                            // This is the first frame of flashing
                            flashing = true; // Set the flag
                            audio.stop('fright'); // Stop the regular fright loop
                            audio.play('ms_fright_flash', true); // Start the flashing loop
                        }
                    }
                    // --- END: New flashing sound logic ---
                }
            }
            
            // --- START OF MODIFICATION ---
            // Update killstreak timers, regardless of energizer state
            if (this.killStreakTimer > 0) {
                this.killStreakTimer--;
                if (this.killStreakTimer === 0) {
                    this.killStreakCount = 0; // Reset streak
                }
            }
            if (this.killStreakTextTimer > 0) {
                this.killStreakTextTimer--;
                if (this.killStreakTextTimer === 0) {
                    this.killStreakText = ""; // Clear text
                }
            }
            // --- END OF MODIFICATION ---
        },
activate: function() { 
            audio.stop('siren');    
            audio.play('fright', true);
            active = true;
            count = 0;
            points = 100;
            flashing = false; // <<< ADD THIS
            for (i=0; i<4; i++) {
                ghosts[i].onEnergized();
            }
            if (getDuration() == 0) { // if no duration, then immediately reset
                this.reset();
            }
        },
        isActive: function() { return active; },
        isFlash: function() { 
            var i = Math.floor((getDuration()-count)/flashInterval);
            return (i<=2*getFlashes()-1) ? (i%2==0) : false;
        },

        getPoints: function() {
            return points;
        },
        
        // --- START OF MODIFICATION: Re-written addPoints function ---
addPoints: function() {
            // --- START OF NEW LOGIC ---

            var streakIndex; // 0-based index for arrays

            if (this.killStreakTimer > 0) {
                // We are in ROUND 2 (streak 5-8)
                // This code runs *only* if the 30-second timer is active.
                this.killStreakCount++; // Increment count (will be 5, 6, 7, or 8)
                streakIndex = this.killStreakCount - 1;

                if (streakIndex < STREAK_SOUNDS.length) {
                    audio.play(STREAK_SOUNDS[streakIndex]);
                    this.killStreakText = STREAK_TEXTS[streakIndex];
                    this.killStreakTextTimer = STREAK_TEXT_DURATION;

                    if (this.killStreakCount < 8) {
                        // 5th, 6th, 7th kills: Reset the 30-second timer
                        this.killStreakTimer = STREAK_TIMER_DURATION;
                    } else if (this.killStreakCount === 8) {
                        // 8th kill (Monsterkill): Reward extra life and reset
                        audio.play('extra_life');
                        extraLives++;
                        renderer.drawMap(); // Update lives display
                        this.killStreakTimer = 0; // Stop and reset streak
                        this.killStreakCount = 0;

                        // --- START: Manually handle 8th kill score and reset ---
                        addScore(points * 2); // Add score for this 8th kill
                        points = 100;         // Reset points for the 9th ghost
                        pointsFramesLeft = pointsDuration * 60;
                        return; // Exit function to prevent double-scoring
                        // --- END: Manually handle 8th kill score and reset ---
                    }
                }
            } else {
                // We are in ROUND 1 (streak 1-4)
                // We check 'points' *before* it gets multiplied
                if (points === 100) {       // 1st ghost
                    streakIndex = 0;
                    this.killStreakCount = 1;
                } else if (points === 200) { // 2nd ghost
                    streakIndex = 1;
                    this.killStreakCount = 2;
                } else if (points === 400) { // 3rd ghost
                    streakIndex = 2;
                    this.killStreakCount = 3;
                } else if (points === 800) { // 4th ghost
                    streakIndex = 3;
                    this.killStreakCount = 4;
                    // Start the 30-second timer
                    this.killStreakTimer = STREAK_TIMER_DURATION; 
                }

                if (streakIndex !== undefined) {
                    audio.play(STREAK_SOUNDS[streakIndex]);
                    this.killStreakText = STREAK_TEXTS[streakIndex];
                    this.killStreakTextTimer = STREAK_TEXT_DURATION;
                }
            }
            // --- END OF NEW LOGIC ---

            // Original logic (runs for kills 1-7 and 9+)
            addScore(points*=2);
            pointsFramesLeft = pointsDuration*60;
        },
        showingPoints: function() { return pointsFramesLeft > 0; },
        updatePointsTimer: function() { if (pointsFramesLeft > 0) pointsFramesLeft--; },
    };
})();