//////////////////////////////////////////////////////////////////////////////////////
// Energizer

// This handles how long the energizer lasts as well as how long the
// points will display after eating a ghost.

var energizer = (function() {

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
            return (i > 18) ? 0 : flashes[i-1];
        };
    })();

    // "The ghosts change colors every 14 game cycles when they start 'flashing'" -Jamey Pittman
    var flashInterval = 14;

    var count;  // how long in frames energizer has been active
    var active; // indicates if energizer is currently active
    var points; // points that the last eaten ghost was worth
    var pointsFramesLeft; // number of frames left to display points earned from eating ghost

    var savedCount = {};
    var savedActive = {};
    var savedPoints = {};
    var savedPointsFramesLeft = {};

    // save state at time t
    var save = function(t) {
        savedCount[t] = count;
        savedActive[t] = active;
        savedPoints[t] = points;
        savedPointsFramesLeft[t] = pointsFramesLeft;
    };

    // load state at time t
    var load = function(t) {
        count = savedCount[t];
        active = savedActive[t];
        points = savedPoints[t];
        pointsFramesLeft = savedPointsFramesLeft[t];
    };

    return {
        save: save,
        load: load,
        reset: function() {
            audio.stop('fright');    
            audio.play('siren', true);
            count = 0;
            active = false;
            points = 100;
            pointsFramesLeft = 0;
            for (i=0; i<4; i++)
                ghosts[i].scared = false;
        },
        update: function() {
            var i;
            if (active) {
                if (count == getDuration())
                    this.reset();
                else
                    count++;
            }
        },
        activate: function() { 
            audio.stop('siren');    
            audio.play('fright', true);
            active = true;
            count = 0;
            points = 100;
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
        addPoints: function() {
            addScore(points*=2);
            pointsFramesLeft = pointsDuration*60;
        },
        showingPoints: function() { return pointsFramesLeft > 0; },
        updatePointsTimer: function() { if (pointsFramesLeft > 0) pointsFramesLeft--; },
    };
})();
