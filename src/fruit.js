//////////////////////////////////////////////////////////////////////////////////////
// Fruit

var BaseFruit = function() {
    // pixel
    this.pixel = {x:0, y:0};

    this.fruitHistory = {};

    this.scoreDuration = 2; // number of seconds that the fruit score is on the screen
    this.scoreFramesLeft; // frames left until the picked-up fruit score is off the screen
    this.savedScoreFramesLeft = {};
};

BaseFruit.prototype = {
    isScorePresent: function() {
        return this.scoreFramesLeft > 0;
    },
    onNewLevel: function() {
        this.buildFruitHistory();
    },
    setCurrentFruit: function(i) {
        this.currentFruitIndex = i;
    },
    onDotEat: function() {
        if (!this.isPresent() && (map.dotsEaten == this.dotLimit1 || map.dotsEaten == this.dotLimit2)) {
            this.initiate();
        }
    },
    save: function(t) {
        this.savedScoreFramesLeft[t] = this.scoreFramesLeft;
    },
    load: function(t) {
        this.scoreFramesLeft = this.savedScoreFramesLeft[t];
    },
    reset: function() {
        this.scoreFramesLeft = 0;
    },
    getCurrentFruit: function() {
        return this.fruits[this.currentFruitIndex];
    },
    getPoints: function() {
        return this.getCurrentFruit().points;
    },
    update: function() {
        if (this.scoreFramesLeft > 0)
            this.scoreFramesLeft--;
    },
    isCollide: function() {
        return Math.abs(pacman.pixel.y - this.pixel.y) <= midTile.y && Math.abs(pacman.pixel.x - this.pixel.x) <= midTile.x;
    },
testCollide: function() {
        if (this.isPresent() && this.isCollide()) {
            var fruit = this.getCurrentFruit(); // Get the fruit object
            
            addScore(fruit.points);
            
            // NEW: Activate the power-up
            if (fruit.effect) {
                pacman.activatePowerup(fruit.effect, fruit.duration);
            }
            if (fruit.effect === 'slow') {
                    // We use 'true' as the second argument to enable looping.
                    audio.play('slow_power', true);
                }
            
            this.reset();
            this.scoreFramesLeft = this.scoreDuration*60;
        }
    },
};

// PAC-MAN FRUIT

var PacFruit = function() {
    BaseFruit.call(this);
this.fruits = [
        {name:'cherry',     points:100,  effect: 'speed',      duration: 2 * 60},
        {name:'strawberry', points:300,  effect: 'speed',      duration: 4 * 60},
        {name:'orange',     points:500,  effect: 'speed',      duration: 6 * 60},
        {name:'apple',      points:700,  effect: 'slow',       duration: 4 * 60},
        {name:'pretzel',    points:700,  effect: 'slow',       duration: 2 * 60},
        {name:'pear',       points:2000, effect: 'invincible', duration: 2 * 60},
        {name:'banana',     points:5000, effect: 'invincible', duration: 4 * 60},
        {name:'banana',     points:5000, effect: 'invincible', duration: 4 * 60}, // Kept your 'key' replacement
    ];

    this.order = [
        0,  // level 1
        1,  // level 2 
        2,  // level 3
        2,  // level 4
        3,  // level 5
        3,  // level 6
        4,  // level 7
        4,  // level 8
        5,  // level 9
        5,  // level 10
        6,  // level 11
        6,  // level 12
        7]; // level 13+

    this.dotLimit1 = 70;
    this.dotLimit2 = 170;

    this.duration = 9; // number of seconds that the fruit is on the screen
    this.framesLeft; // frames left until fruit is off the screen

    this.savedFramesLeft = {};
};

PacFruit.prototype = newChildObject(BaseFruit.prototype, {

    onNewLevel: function() {
        this.setCurrentFruit(this.getFruitIndexFromLevel(level));
        BaseFruit.prototype.onNewLevel.call(this);
    },

    getFruitFromLevel: function(i) {
        return this.fruits[this.getFruitIndexFromLevel(i)];
    },

    getFruitIndexFromLevel: function(i) {
        if (i > 13) {
            i = 13;
        }
        return this.order[i-1];
    },

    buildFruitHistory: function() {
        this.fruitHistory = {};
        var i;
        for (i=1; i<= level; i++) {
            this.fruitHistory[i] = this.fruits[this.getFruitIndexFromLevel(i)];
        }
    },

    initiate: function() {
        var x = 13;
        var y = 20;
        this.pixel.x = tileSize*(1+x)-1;
        this.pixel.y = tileSize*y + midTile.y;
        this.framesLeft = 60*this.duration;
    },

    isPresent: function() {
        return this.framesLeft > 0;
    },

    reset: function() {
        BaseFruit.prototype.reset.call(this);

        this.framesLeft = 0;
    },

    update: function() {
        BaseFruit.prototype.update.call(this);

        if (this.framesLeft > 0)
            this.framesLeft--;
    },

    save: function(t) {
        BaseFruit.prototype.save.call(this,t);
        this.savedFramesLeft[t] = this.framesLeft;
    },
    load: function(t) {
        BaseFruit.prototype.load.call(this,t);
        this.framesLeft = this.savedFramesLeft[t];
    },
});

// MS. PAC-MAN FRUIT

var PATH_ENTER = 0;
var PATH_PEN = 1;
var PATH_EXIT = 2;

var MsPacFruit = function() {
    BaseFruit.call(this);
this.fruits = [
        {name: 'cherry',     points: 100,  effect: 'speed',      duration: 2 * 60}, // 2 sec @ 60fps
        {name: 'strawberry', points: 200,  effect: 'speed',      duration: 4 * 60}, // 4 sec
        {name: 'orange',     points: 500,  effect: 'speed',      duration: 6 * 60}, // 6 sec
        {name: 'pretzel',    points: 700,  effect: 'slow',       duration: 2 * 60}, // 2 sec
        {name: 'apple',      points: 1000, effect: 'slow',       duration: 4 * 60}, // 4 sec
        {name: 'pear',       points: 2000, effect: 'invincible', duration: 2 * 60}, // 2 sec
        {name: 'banana',     points: 5000, effect: 'invincible', duration: 4 * 60}, // 4 sec
    ];

    this.dotLimit1 = 64;
    this.dotLimit2 = 176;

    this.pen_path = "<<<<<<^^^^^^>>>>>>>>>vvvvvv<<";

    this.savedIsPresent = {};
    this.savedPixel = {};
    this.savedPathMode = {};
    this.savedFrame = {};
    this.savedNumFrames = {};
    this.savedPath = {};
    this.savedIsStatic = {};
    this.savedFramesLeft = {};
};

MsPacFruit.prototype = newChildObject(BaseFruit.prototype, {

    shouldRandomizeFruit: function() {
        return level > 7;
    },

    getFruitFromLevel: function(i) {
        if (i <= 7) {
            return this.fruits[i-1];
        }
        else {
            return undefined;
        }
    },

    onNewLevel: function() {
        if (!this.shouldRandomizeFruit()) {
            this.setCurrentFruit(level-1);
        }
        else {
            this.setCurrentFruit(0);
        }
        BaseFruit.prototype.onNewLevel.call(this);
    },

    buildFruitHistory: function() {
        this.fruitHistory = {};
        var i;
        for (i=1; i<= Math.max(level,7); i++) {
            this.fruitHistory[i] = this.fruits[i-1];
        }
    },

    reset: function() {
        BaseFruit.prototype.reset.call(this);

        this.frame = 0;
        this.numFrames = 0;
        this.path = undefined;
        this.isStatic = false;
        this.framesLeft = 0;
    },

    initiatePath: function(p) {
        this.frame = 0;
        this.numFrames = p.length*16;
        this.path = p;
    },

    initiate: function() {
        if (this.shouldRandomizeFruit()) {
            this.setCurrentFruit(getRandomInt(0,6));
        }
        if (map.name === "Pac-Man") {
            this.isStatic = true;
            
            // Spawn exactly where it does in Pac-Man (13, 20)
            var x = 13;
            var y = 20;
            this.pixel.x = tileSize*(1+x)-1;
            this.pixel.y = tileSize*y + midTile.y;
            
            // Set duration to roughly 9 seconds (standard Pac-Man duration)
            this.framesLeft = 60 * 9; 
            return;
        }
        this.isStatic = false;
        var entrances = map.fruitPaths.entrances;
        var e = entrances[getRandomInt(0,entrances.length-1)];
        this.initiatePath(e.path);
        this.pathMode = PATH_ENTER;
        this.pixel.x = e.start.x;
        this.pixel.y = e.start.y;
    },

    isPresent: function() {
        if (this.isStatic) {
            return this.framesLeft > 0;
        }
        return this.frame < this.numFrames;
    },

    bounceFrames: (function(){
        var U = { dx:0, dy:-1 };
        var D = { dx:0, dy:1 };
        var L = { dx:-1, dy:0 };
        var R = { dx:1, dy:0 };
        var UL = { dx:-1, dy:-1 };
        var UR = { dx:1, dy:-1 };
        var DL = { dx:-1, dy:1 };
        var DR = { dx:1, dy:1 };
        var Z = { dx:0, dy:0 };

        // A 16-frame animation for moving 8 pixels either up, down, left, or right.
        return {
            '^': [U, U, U, U, U, U, U, U, U, Z, U, Z, Z, D, Z, D],
            '>': [Z, UR,Z, R, Z, UR,Z, R, Z, R, Z, R, Z, DR,DR,Z],
            '<': [Z, Z, UL,Z, L, Z, UL,Z, L, Z, L, Z, L, Z, DL,DL],
            'v': [Z, D, D, D, D, D, D, D, D, D, D, D, U, U, Z, U],
        };
    })(),

    move: function() {
        if (this.frame % 16 == 0) {
            audio.play('fruit_bounce');
        }
        var p = this.path[Math.floor(this.frame/16)]; // get current path frame
        var b = this.bounceFrames[p][this.frame%16]; // get current bounce animation frame
        this.pixel.x += b.dx;
        this.pixel.y += b.dy;
        this.frame++;
    },

    setNextPath: function() {
        if (this.pathMode == PATH_ENTER) {
            this.pathMode = PATH_PEN;
// 1. Check if the map has a custom path defined (e.g. from mapgen)
            var customPath = (map.fruitPaths && map.fruitPaths.pen_path);
            
            if (customPath) {
                this.initiatePath(customPath);
            } 
            // 2. Only force "safe mode" for Random Maps.
            // We removed "Pac-Man" from here so it falls through to the standard loop below.
            else if (map.name === "Random Map") {
                this.initiatePath("><><><><><><><><><><><><><><><><><><><><><><><><><><");
            } 
            // 3. Standard Maps (Ms. Pac-Man 1-4 AND Pac-Man) use the classic loop.
            // Since Level 11 (Pac-Man) works with this, we let it use the default behavior.
            else {
                this.initiatePath(this.pen_path);
            }
        }
        
        else if (this.pathMode == PATH_PEN) {
            this.pathMode = PATH_EXIT;
            var exits = map.fruitPaths.exits;
            var e = exits[getRandomInt(0,exits.length-1)];
            this.initiatePath(e.path);
        }
        else if (this.pathMode == PATH_EXIT) {
            this.reset();
        }
    },

    update: function() {
        BaseFruit.prototype.update.call(this);
        if (this.isStatic) {
            if (this.framesLeft > 0) {
                this.framesLeft--;
            }
            return; // Do not move if static
        }
        if (this.isPresent()) {
            this.move();
            if (this.frame == this.numFrames) {
                this.setNextPath();
            }
        }
    },

    save: function(t) {
        BaseFruit.prototype.save.call(this,t);

        this.savedPixel[t] =        this.isPresent() ? {x:this.pixel.x, y:this.pixel.y} : undefined;
        this.savedPathMode[t] =     this.pathMode;
        this.savedFrame[t] =        this.frame;
        this.savedNumFrames[t] =    this.numFrames;
        this.savedPath[t] =         this.path;
        this.savedIsStatic[t] =     this.isStatic;
        this.savedFramesLeft[t] =   this.framesLeft;
    },

    load: function(t) {
        BaseFruit.prototype.load.call(this,t);

        if (this.savedPixel[t]) {
            this.pixel.x =      this.savedPixel[t].x;
            this.pixel.y =      this.savedPixel[t].y;
        }
        this.pathMode =     this.savedPathMode[t];
        this.frame =        this.savedFrame[t];
        this.numFrames =    this.savedNumFrames[t]; 
        this.path =         this.savedPath[t];
        this.isStatic =     this.savedIsStatic[t];
        this.framesLeft =   this.savedFramesLeft[t];
    },
});

var fruit;
    var pacfruit = new PacFruit();
    var mspacfruit = new MsPacFruit();
var setFruitFromGameMode = (function() {

    fruit = pacfruit;
    return function() {
        if (gameMode == GAME_PACMAN) {
            fruit = pacfruit;
        }
        else {
            fruit = mspacfruit;
        }
    };
})();
