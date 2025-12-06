//////////////////////////////////////////////////////////////////////////////////////
// create all the actors

var blinky = new Ghost();
blinky.name = "blinky";
blinky.color = "#FF0000";
blinky.pathColor = "rgba(255,0,0,0.8)";
blinky.isVisible = true;
blinky.speedLevel = 0;
blinky.playerName = null;

var pinky = new Ghost();
pinky.name = "pinky";
pinky.color = "#FFB8FF";
pinky.pathColor = "rgba(255,184,255,0.8)";
pinky.isVisible = true;
pinky.speedLevel = 0;
pinky.playerName = null;

var inky = new Ghost();
inky.name = "inky";
inky.color = "#00FFFF";
inky.pathColor = "rgba(0,255,255,0.8)";
inky.isVisible = true;
inky.speedLevel = 0;
inky.playerName = null;

var clyde = new Ghost();
clyde.name = "clyde";
clyde.color = "#FFB851";
clyde.pathColor = "rgba(255,184,81,0.8)";
clyde.isVisible = true;
clyde.speedLevel = 0;
clyde.playerName = null;

var pacman = new Player();
pacman.name = "pacman";
pacman.color = "#FFFF00";
pacman.pathColor = "rgba(255,255,0,0.8)";
pacman.isDrawTarget = true;
pacman.targetTiles = [];

// order at which they appear in original arcade memory
// (suggests drawing/update order)
var actors = [blinky, pinky, inky, clyde, pacman];
var ghosts = [blinky, pinky, inky, clyde];
