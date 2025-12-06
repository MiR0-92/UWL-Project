NOTE: I did not create this game!
I have merely added on to the existing game and AI framework.
Major props to Shaun Williams for recreating the entire suite of Pac-Man games and CalvinJC for creating this Smart Pac-Man AI, as well as great practice tools. Thank you for publishing your source code! I highly recommend everyone check out his page and play the game for yourself at http://pacman.shaunew.com/ and http://pacman.calvinjc.com.

## 🎵 Audio Credits

This project uses music for educational and non-commercial purposes. All rights belong to the original artists.

### Background Music
**Artist:** HOME (Randy Goffe)
* **Album:** *Falling Into Place* (2016)
* **Tracks used:**
    * *Mainframe*
    * *Byzantium*
    * *Headcase*
    * *Carrier Wave*
    * *Hold*
* Support the artist: [HOME on Bandcamp](https://home96.bandcamp.com/)

### Gameplay/Theme Music
**Artist:** 8-Bit Universe
* **Track:** *Popcorn* (8-Bit Tribute to Hot Butter)
* Support the artist: [8 Bit Universe on YouTube](https://www.youtube.com/user/8BitUniverseMusic)



# Cookie-Eater (Multiplayer Pac-Man)

A dynamic multiplayer arcade game where players use their smartphones as controllers to play on a shared host screen. Built with Node.js, Socket.io, and HTML5 Canvas.
## Contribution
Added Multiplayer HUD that displays:

Ghost Sprites, Ghost/Player names, Scores: Speed Boost Bonus:
A dynamic QR code that updates depending on the host IP.
Power-ups Fruit HUD that displays each fruit and its corresponding power-ups accordingly.
Swapped the sprites of Ms. Pac-Man with Cookie-Monster, including cutscenes.
Usage of randomized levels after level 14.
Dynamic join/exit, where if the player joins takes over a ghost, if he leaves, the ghost AI takes over.
Pacman score multiplier, each level Pac-Man eats a dot score goes x10 up to level 20.
Killing streak from firstblood up to monsterkill, which gives Pac-Man extra life.
Dynamic speed boost for each ghost that catches Pac-Man. For each catch in a row goes +25% up to 100%; however, if Pac-Man catches you goes -25% for each time he eats you.
Each time Pac-Man is eaten, his points are transferred to the player/ghost who caught him, along with the speed boost.
When the player leaves, the score is sent to his phone and the leaderboard, and if it's within the scope of the top 10 will be saved. else discarded.
Added custom sounds and music for immersion. Thanks to Home and 8-bit universe for their amazing work. 
## 🎮 How to Play
1. **Host the Game:** Open the game on a desktop or laptop browser.
2. **Join via Mobile:** Scan the QR code or visit the URL on your phone.
3. **Control:** Use your phone's touch screen to control your ghost/character on the main screen.

## 🛠️ Tech Stack
* **Backend:** Node.js, Express
* **Real-time Communication:** Socket.io (WebSockets with polling fallback)
* **Frontend:** HTML5 Canvas, JavaScript, CSS3
* **Deployment:** Heroku

## 🚀 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/MiR0-92/UWL-Project.git](https://github.com/MiR0-92/UWL-Project.git)
    cd UWL-Project
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Locally**
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.


## 📄 License
This project is for educational purposes.
