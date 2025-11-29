# Pacman AI 

Special Thanks and credit to CalvinJC for providing this very smart Pac-Man AI.
Check it out at: http://pacman.calvinjc.com

#### NOTE: I did not create this game!

Major props to Shaun Williams for recreating the entire suite of Pac-Man games, as well as great practice tools. Thank you for publishing your source code! I highly recommend everyone check out his page and play the game for yourself at http://pacman.shaunew.com/.

I have merely added on to the existing game and AI framework, touched by both Calvin and Shaun, to add the additional multiplayer mechanics.

# Contribution

A Classic Pac-Man fork turned into a multiplayer game with dynamic join/exit, where you scan the QR code on the screen, and your phone serves as the controller, while playing the game on an external screen.

# Game Rules

Please enter a name: No special symbols or spaces allowed, up to 7 characters.

The goal is to catch Pac-Man, and when you do, you get his accumulated score.

If the player decides to exit the game early, an AI takes control over his ghost, whilst resetting the points back to 0, where the player's points are sent to the leaderboards and displayed on his phone.

Leaderboards are shown only when reaching the game-over state (get all Pac-Man lives).

# Twisting Mechanics

When you catch Pac-Man, you get a 25% speed boost for each time you catch him in a row, up to 100%.

If Pac-Man eats you while having the speed boost, your points remain, but your speed boost decreases by 25% each time eaten. (e.g., currently having 50% speed, eaten Pac-Man twice in a row, but now he eats you, you lose 25%).

**Pacman killstreak system:**

When Pac-Man eats a power pill and eats you four times in a row, he starts from FIRST-BLOOD! to ULTRA-KILL!

If he takes another power pill and eats you 4 more times (without dying), the streak continues from RAMPAGE! to MONSTER-KILL!

If Pac-Man reaches monster kill, he gets an extra life.

If not, the kill streak resets.

**Fruit System:**

Fruits in this fork do not provide only points, but also special power-ups:

- **Cherry:** Doubles the speed for 2 seconds.
- **Strawberry:** Doubles the speed for 4 seconds.
- **Orange:** Doubles the speed for 6 seconds.
- **Pretzel:** Slows the ghosts for 2 seconds.
- **Apple:** Slows the ghosts for 4 seconds.
- **Pear:** Adds invincibility for 2 seconds.
- **Banana:** Adds invincibility for 4 seconds.

**Dynamic Maze system:**

The game originally used MS_PACMAN mode, with 4 maze stages, where I decided to also add the original Pac-Man level(11 and randomly above) and some randomly generated levels after level 14 to make the game more dynamic.

Power pills originally stop working in level 21, where, in this fork of the game, power pills have a 3-second power effect after level 18.

# Dynamic QR Code

The QR code changes automatically based on your IP.
