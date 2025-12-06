//////////////////////////////////////////////////////////////////////////////////////
// Ghost class

// modes representing the ghost's current state
var GHOST_OUTSIDE = 0;
var GHOST_EATEN = 1;
var GHOST_GOING_HOME = 2;
var GHOST_ENTERING_HOME = 3;
var GHOST_PACING_HOME = 4;
var GHOST_LEAVING_HOME = 5;

// Ghost constructor
var Ghost = function () {
  // inherit data from Actor
  Actor.apply(this);
  this.score = 0;
  this.randomScatter = false;
  this.faceDirEnum = this.dirEnum;

  this.slowTimer = 0;
  this.savedSlowTimer = {};
  
    this.ai = true; // Default to AI control
    this.inputDirEnum = undefined;
    this.nextDir = {};
    this.setNextDir(this.startDirEnum);
    this.stopped = false;
    this.savedStopped = {};
    this.score = 0;
};

// inherit functions from Actor class
Ghost.prototype = newChildObject(Actor.prototype);

Ghost.prototype.slowDown = function(duration) {
    this.slowTimer = duration;
};

// displacements for ghost bouncing
Ghost.prototype.getBounceY = (function () {
  // NOTE: The bounce animation assumes an actor is moving in straight
  // horizontal or vertical lines between the centers of each tile.
  //
  // When moving horizontal, bounce height is a function of x.
  // When moving vertical, bounce height is a function of y.

  var bounceY = {};

  // map y tile pixel to new y tile pixel
  bounceY[DIR_UP] = [-4, -2, 0, 2, 4, 3, 2, 3];
  bounceY[DIR_DOWN] = [3, 5, 7, 5, 4, 5, 7, 8];

  // map x tile pixel to y tile pixel
  bounceY[DIR_LEFT] = [2, 3, 3, 4, 3, 2, 2, 2];
  bounceY[DIR_RIGHT] = [2, 2, 3, 4, 3, 3, 2, 2];

  return function (px, py, dirEnum) {
    if (px == undefined) {
      px = this.pixel.x;
    }
    if (py == undefined) {
      py = this.pixel.y;
    }
    if (dirEnum == undefined) {
      dirEnum = this.dirEnum;
    }

    if (this.mode != GHOST_OUTSIDE || !this.scared || gameMode != GAME_COOKIE) {
      return py;
    }

    var tilePixel = this.getTilePixel({ x: px, y: py });
    var tileY = Math.floor(py / tileSize);
    var y = tileY * tileSize;

    if (dirEnum == DIR_UP || dirEnum == DIR_DOWN) {
      y += bounceY[dirEnum][tilePixel.y];
    } else {
      y += bounceY[dirEnum][tilePixel.x];
    }

    return y;
  };
})();

Ghost.prototype.getAnimFrame = function (frames) {
  if (frames == undefined) {
    frames = this.frames;
  }
  return Math.floor(frames / 8) % 2; // toggle frame every 8 ticks
};

// reset the state of the ghost on new level or level restart
Ghost.prototype.reset = function () {
  // signals
  this.sigReverse = false;
  this.sigLeaveHome = false;


  // modes
  this.mode = this.startMode;
  this.scared = false;
  this.stopped = false;
  this.ai = true;

  this.savedSigReverse = {};
  this.savedSigLeaveHome = {};
  this.savedMode = {};
  this.savedScared = {};
  this.savedElroy = {};
  this.savedFaceDirEnum = {};

  // call Actor's reset function to reset position and direction
  Actor.prototype.reset.apply(this);

  // faceDirEnum  = direction the ghost is facing
  // dirEnum      = direction the ghost is moving
  // (faceDirEnum represents what dirEnum will be once the ghost reaches the middle of the tile)
  this.faceDirEnum = this.dirEnum;
  this.slowTimer = 0;
};

Ghost.prototype.save = function (t) {
  this.savedSigReverse[t] = this.sigReverse;
  this.savedSigLeaveHome[t] = this.sigLeaveHome;
  this.savedMode[t] = this.mode;
  this.savedScared[t] = this.scared;
  if (this == blinky) {
    this.savedElroy[t] = this.elroy;
  }
  this.savedFaceDirEnum[t] = this.faceDirEnum;
  this.savedStopped[t] = this.stopped;
  this.savedSlowTimer[t] = this.slowTimer;
  Actor.prototype.save.call(this, t);
};

Ghost.prototype.load = function (t) {
  this.sigReverse = this.savedSigReverse[t];
  this.sigLeaveHome = this.savedSigLeaveHome[t];
  this.mode = this.savedMode[t];
  this.scared = this.savedScared[t];
  if (this == blinky) {
    this.elroy = this.savedElroy[t];
  }
  this.faceDirEnum = this.savedFaceDirEnum[t];
  this.stopped = this.savedStopped[t];
  this.slowTimer = this.savedSlowTimer[t];
  Actor.prototype.load.call(this, t);
};

// indicates if we slow down in the tunnel
Ghost.prototype.isSlowInTunnel = function () {
  // special case for Ms. Pac-Man (slow down only for the first three levels)
  if (
    gameMode == GAME_MSPACMAN ||
    gameMode == GAME_OTTO ||
    gameMode == GAME_COOKIE
  )
    return level <= 3;
  else return true;
};

// gets the number of steps to move in this frame
Ghost.prototype.getNumSteps = function () {
    // NEW: Slow Ghost Power-Up
    if (this.slowTimer > 0) {
        // Use the same speed as a frightened ghost
        var pattern = STEP_GHOST_FRIGHT;
        return this.getStepSizeFromTable(level ? level : 1, pattern);
    }

  var pattern = STEP_GHOST;

  if (this.mode == GHOST_GOING_HOME || this.mode == GHOST_ENTERING_HOME)
    return 2;
  else if (this.mode == GHOST_LEAVING_HOME || this.mode == GHOST_PACING_HOME)
    return this.getStepSizeFromTable(1, STEP_GHOST_TUNNEL);
  else if (map.isTunnelTile(this.tile.x, this.tile.y) && this.isSlowInTunnel())
    pattern = STEP_GHOST_TUNNEL;
  else if (this.scared) pattern = STEP_GHOST_FRIGHT;
  else if (this.elroy == 1) pattern = STEP_ELROY1;
  else if (this.elroy == 2) pattern = STEP_ELROY2;
  // Get base steps from table and ensure it's a number
    var numSteps = parseInt(this.getStepSizeFromTable(level ? level : 1, pattern));

    // Apply speed level bonus if not scared, not in tunnel, and speedLevel > 0
    if (!this.scared && pattern != STEP_GHOST_TUNNEL && this.speedLevel > 0) {
        var bonus = 0;
        if (this.speedLevel == 1) { 
            bonus = (Math.random() < 0.2) ? 1 : 0; // 20% chance to add 1 step
        } else if (this.speedLevel == 2) { 
            bonus = (Math.random() < 0.4) ? 1 : 0; // 40% chance
        } else if (this.speedLevel == 3) { 
            bonus = (Math.random() < 0.6) ? 1 : 0; // 60% chance
        } else if (this.speedLevel == 4) { 
           bonus = (Math.random() < 0.80) ? 1 : 0;; // 80% chance (always add 1)
        }
        
        // Cap speed at 2 (the max sub-frames allowed by the engine)
        return Math.min(2, numSteps + bonus);
    }
    
    return numSteps;
};

// signal ghost to reverse direction after leaving current tile
Ghost.prototype.reverse = function () {
  this.sigReverse = true;
};

// signal ghost to go home
// It is useful to have this because as soon as the ghost gets eaten,
// we have to freeze all the actors for 3 seconds, except for the
// ones who are already traveling to the ghost home to be revived.
// We use this signal to change mode to GHOST_GOING_HOME, which will be
// set after the update() function is called so that we are still frozen
// for 3 seconds before traveling home uninterrupted.
Ghost.prototype.goHome = function () {
  this.mode = GHOST_EATEN;
};

// Following the pattern that state changes be made via signaling (e.g. reversing, going home)
// the ghost is commanded to leave home similarly.
// (not sure if this is correct yet)
Ghost.prototype.leaveHome = function () {
  this.sigLeaveHome = true;
};

// function called when pacman eats an energizer
Ghost.prototype.onEnergized = function () {
  this.reverse();

  // only scare me if not already going home
  if (this.mode != GHOST_GOING_HOME && this.mode != GHOST_ENTERING_HOME) {
    this.scared = true;
    this.targetting = undefined;
  }
};

// function called when this ghost gets eaten
Ghost.prototype.onEaten = function () {
  this.goHome(); // go home
  this.scared = false; // turn off scared
  this.ai = true;
  if (this.tile) {
      this.pixel.x = (this.tile.x * tileSize) + midTile.x;
      this.pixel.y = (this.tile.y * tileSize) + midTile.y;
      this.commitPos(); // Update collision box and distance vars immediately
  }
  // Decrease ghost speed level, min of 0
  if (this.speedLevel > 0) {
      this.speedLevel--;
      console.log(this.name + " speed level decreased to: " + this.speedLevel);
  }
  updateGhostDisplay(this);
};

// move forward one step
Ghost.prototype.step = (function(){

    // return sign of a number
    var sign = function(x) {
        if (x<0) return -1;
        if (x>0) return 1;
        return 0;
    };

    return function() {

        // If AI is in control, use the simple, original ghost step
        if (this.ai) {
            this.setPos(this.pixel.x+this.dir.x, this.pixel.y+this.dir.y);
            return 1;
        }

        // If PLAYER is in control, use the Player's wall-checking step logic

        // just increment if we're not in a map
        if (!map) {
            this.setPos(this.pixel.x+this.dir.x, this.pixel.y+this.dir.y);
            return 1;
        }

        // identify the axes of motion
        var a = (this.dir.x != 0) ? 'x' : 'y'; // axis of motion
        var b = (this.dir.x != 0) ? 'y' : 'x'; // axis perpendicular to motion

        // Don't proceed past the middle of a tile if facing a wall
        this.stopped = this.stopped || (this.distToMid[a] == 0 && !isNextTileFloor(this.tile, this.dir));
        if (!this.stopped) {
            // Move in the direction of travel.
            this.pixel[a] += this.dir[a];

            // Drift toward the center of the track (a.k.a. cornering)
            this.pixel[b] += sign(this.distToMid[b]);
        }

        this.commitPos();
        return this.stopped ? 0 : 1;
    };
})();

// ghost home-specific path steering
Ghost.prototype.homeSteer = (function () {
  // steering functions to execute for each mode
  var steerFuncs = {};

  steerFuncs[GHOST_GOING_HOME] = function () {
    // at the doormat
    if (this.tile.x == map.doorTile.x && this.tile.y == map.doorTile.y) {
      this.faceDirEnum = DIR_DOWN;
      this.targetting = false;
      // walk to the door, or go through if already there
      if (this.pixel.x == map.doorPixel.x) {
        this.mode = GHOST_ENTERING_HOME;
        this.setDir(DIR_DOWN);
        this.faceDirEnum = this.dirEnum;
      } else {
        this.setDir(DIR_RIGHT);
        this.faceDirEnum = this.dirEnum;
      }
    }
  };

  steerFuncs[GHOST_ENTERING_HOME] = function () {
    if (this.pixel.y == map.homeBottomPixel) {
      // revive if reached its seat
      if (this.pixel.x == this.startPixel.x) {
        audio.stop('eyes');
        this.setDir(DIR_UP);
        this.mode = this.arriveHomeMode;
      }
      // sidestep to its seat
      else {
        this.setDir(this.startPixel.x < this.pixel.x ? DIR_LEFT : DIR_RIGHT);
      }
      this.faceDirEnum = this.dirEnum;
    }
  };

  steerFuncs[GHOST_PACING_HOME] = function () {
    // head for the door
    if (this.sigLeaveHome) {
      this.sigLeaveHome = false;
      this.mode = GHOST_LEAVING_HOME;
      if (this.pixel.x == map.doorPixel.x) this.setDir(DIR_UP);
      else this.setDir(this.pixel.x < map.doorPixel.x ? DIR_RIGHT : DIR_LEFT);
    }
    // pace back and forth
    else {
      if (this.pixel.y == map.homeTopPixel) this.setDir(DIR_DOWN);
      else if (this.pixel.y == map.homeBottomPixel) this.setDir(DIR_UP);
    }
    this.faceDirEnum = this.dirEnum;
  };

  steerFuncs[GHOST_LEAVING_HOME] = function () {
    if (this.pixel.x == map.doorPixel.x) {
      // reached door
      if (this.pixel.y == map.doorPixel.y) {
        this.mode = GHOST_OUTSIDE;
        this.setDir(DIR_LEFT); // always turn left at door?
      }
      // keep walking up to the door
      else {
        this.setDir(DIR_UP);
      }
      this.faceDirEnum = this.dirEnum;
    }
  };

  // return a function to execute appropriate steering function for a given ghost
  return function () {
    var f = steerFuncs[this.mode];
    if (f) f.apply(this);
  };
})();

// special case for Ms. Pac-Man game that randomly chooses a corner for blinky and pinky when scattering
Ghost.prototype.isScatterBrain = function () {
  var scatter = false;
  if (ghostCommander.getCommand() == GHOST_CMD_SCATTER) {
    if (gameMode == GAME_MSPACMAN || gameMode == GAME_COOKIE) {
      scatter = this == blinky || this == pinky;
    } else if (gameMode == GAME_OTTO) {
      scatter = true;
    }
  }
  return scatter;
};

// determine direction
Ghost.prototype.steer = function() {

    if (this.ai) {
        
        // --- AI CONTROL ---

        // 1. Run home-related logic first (e.g., leaving house, entering house)
        this.homeSteer(); 

        var oppDirEnum = rotateAboutFace(this.dirEnum); 

        // 2. Check if we should exit early (This is the original game's logic)
        //    This allows GHOST_OUTSIDE and GHOST_GOING_HOME to continue to pathfinding.
        //    It causes GHOST_PACING_HOME and GHOST_LEAVING_HOME to exit here (which is correct).
        if (this.mode != GHOST_OUTSIDE && this.mode != GHOST_GOING_HOME) {
            this.targetting = false;
            return;
        }

        // 3. NEW: Check if we should hand control to a player
        //    This only happens if the ghost is GHOST_OUTSIDE.
            if (this.mode == GHOST_OUTSIDE) {
            var shouldBePlayerControlled = false;
            if (this === blinky && window.player_controls_blinky) {
                shouldBePlayerControlled = true;
            }
            // (add else-ifs for pinky, inky, clyde here later) <-- We are doing this now!
            else if (this === pinky && window.player_controls_pinky) {
                shouldBePlayerControlled = true;
            }
            else if (this === inky && window.player_controls_inky) {
                shouldBePlayerControlled = true;
            }
            else if (this === clyde && window.player_controls_clyde) {
                shouldBePlayerControlled = true;
            }
            // (add else-ifs for pinky, inky, clyde here later)
    
            if (shouldBePlayerControlled) {
                this.ai = false; // Give control back to player
                //this.clearInputDir();
                this.steer(); // Run the 'else' block immediately
                return;
            }
        }
        
        // 4. Original AI Pathfinding/Targeting Logic
        //    This now runs for GHOST_OUTSIDE (if AI) and GHOST_GOING_HOME (for all ghosts).
        var dirEnum;
        var openTiles;
        var actor;

        // AT MID-TILE (update movement direction)
        if (this.distToMid.x == 0 && this.distToMid.y == 0) {
            if (this.sigReverse) {
                this.faceDirEnum = oppDirEnum;
                this.sigReverse = false;
            }
            this.setDir(this.faceDirEnum);
        }
        // JUST PASSED MID-TILE (update face direction)
        else if (
                this.dirEnum == DIR_RIGHT && this.tilePixel.x == midTile.x+1 ||
                this.dirEnum == DIR_LEFT  && this.tilePixel.x == midTile.x-1 ||
                this.dirEnum == DIR_UP    && this.tilePixel.y == midTile.y-1 ||
                this.dirEnum == DIR_DOWN  && this.tilePixel.y == midTile.y+1) {
    
            var nextTile = { x: this.tile.x + this.dir.x, y: this.tile.y + this.dir.y };
            openTiles = getOpenTiles(nextTile, this.dirEnum);
    
            if (this.scared) {
                // choose a random turn
                dirEnum = Math.floor(Math.random()*4);
                while (!openTiles[dirEnum])
                    dirEnum = (dirEnum+1)%4;
                this.targetting = false;
            }
            else {
                /* SET TARGET */
                if (this.mode == GHOST_GOING_HOME) {
                    this.targetTile.x = map.doorTile.x;
                    this.targetTile.y = map.doorTile.y;
                    this.targetting = 'door'; // for path drawing
                }
                else if (!this.elroy && ghostCommander.getCommand() == GHOST_CMD_SCATTER) {
                    // target corner when scattering
                    actor = this.isScatterBrain() ? actors[Math.floor(Math.random()*4)] : this;
                    this.targetTile.x = actor.cornerTile.x;
                    this.targetTile.y = actor.cornerTile.y;
                    this.targetting = 'corner';
                }
                else {
                    // use custom function for each ghost when in attack mode
                    this.setTarget();
                }
    
                /* CHOOSE TURN */
                var dirDecided = false;
                if (this.mode == GHOST_GOING_HOME && map.getExitDir) {
                    var exitDir = map.getExitDir(nextTile.x,nextTile.y);
                    if (exitDir != undefined && exitDir != oppDirEnum) {
                        dirDecided = true;
                        dirEnum = exitDir;
                    }
                }
    
                if (!dirDecided) {
                    if (this.mode != GHOST_GOING_HOME) {
                        if (map.constrainGhostTurns) {
                            map.constrainGhostTurns(nextTile, openTiles, this.dirEnum);
                        }
                    }
                    // choose direction that minimizes distance to target
                    dirEnum = getTurnClosestToTarget(nextTile, this.targetTile, openTiles);
                }
            }
            this.faceDirEnum = dirEnum;
        }
    } 
    else {
        
        // --- MANUAL (PLAYER) CONTROL ---
        // This part is fine.
    
        if (this.inputDirEnum == undefined) {
            if (this.stopped) {
                this.setDir(this.nextDirEnum);
            }
        }
        else {
            // Determine if input direction is open.
            var inputDir = getDirFromEnum(this.inputDirEnum);
            var inputDirOpen = isNextTileFloor(this.tile, inputDir);
    
            if (inputDirOpen) {
                this.setDir(this.inputDirEnum);
                this.setNextDir(this.inputDirEnum);
                this.stopped = false;
            }
            else {
                if (!this.stopped) {
                    this.setNextDir(this.inputDirEnum);
                }
            }
        }
        if (this.nextDirEnum !== undefined) {
             this.faceDirEnum = this.nextDirEnum;
        } else {
             this.faceDirEnum = this.dirEnum;
        }
    }
    
};

// update this frame
Ghost.prototype.update = function(j) {

    // get number of steps to advance in this frame
    var numSteps = this.getNumSteps();
    if (j >= numSteps) 
        return;

    // update timers (only on the last step of the frame)
    if (j == numSteps - 1) { // Only decrement once per game frame
        if (this.slowTimer > 0) {
            this.slowTimer--;

            // If the timer just reached zero, stop the looping sound.
            if (this.slowTimer === 0) {
                audio.stop('slow_power');
            }
        }
    }
    
    // call super function to update position and direction
    Actor.prototype.update.call(this,j);
};

Ghost.prototype.getPathDistLeft = function (fromPixel, dirEnum) {
  var distLeft = tileSize;
  var pixel = this.getTargetPixel();
  if (this.targetting == "pacman") {
    if (dirEnum == DIR_UP || dirEnum == DIR_DOWN)
      distLeft = Math.abs(fromPixel.y - pixel.y);
    else {
      distLeft = Math.abs(fromPixel.x - pixel.x);
    }
  }
  return distLeft;
};

Ghost.prototype.setTarget = function () {
  // This sets the target tile when in chase mode.
  // The "target" is always Pac-Man when in this mode,
  // except for Clyde.  He runs away back home sometimes,
  // so the "targetting" parameter is set in getTargetTile
  // for Clyde only.

  this.targetTile = this.getTargetTile();

  if (this != clyde) {
    this.targetting = "pacman";
  }
};
// sets the next direction and updates its dependent variables
    Ghost.prototype.setNextDir = function(nextDirEnum) {
        setDirFromEnum(this.nextDir, nextDirEnum);
        this.nextDirEnum = nextDirEnum;
    };
    
    Ghost.prototype.setInputDir = function(dirEnum) {
        this.inputDirEnum = dirEnum;
    };
    
    Ghost.prototype.clearInputDir = function(dirEnum) {
        if (dirEnum == undefined || this.inputDirEnum == dirEnum) {
            this.inputDirEnum = undefined;
        }
    };