Cookie-Eater (Multiplayer Pac-Man)

    ⚠️ Attribution & Disclaimer

    I did not create the core engine of this game. This project is built upon the existing game and AI framework created by others.

        Core Game: Major props to Shaun Williams for recreating the entire suite of Pac-Man games. ()

        AI Framework: Huge thanks to CalvinJC for creating the Smart Pac-Man AI and practice tools. ()

    I have merely added multiplayer functionality, new assets, and modified gameplay logic. Please check out the original creators!

A dynamic multiplayer arcade game where players use their smartphones as controllers to play on a shared host screen. Built with Node.js, Socket.io, and HTML5 Canvas.
✨ Features & Contributions

I have expanded the original codebase with the following multiplayer and gameplay enhancements:
🎮 Gameplay & Mechanics

    Role Swapping: Players control the Ghosts. If a player leaves, the AI takes over instantly. If a player joins, they assume control of an existing Ghost.

    Dynamic Speed Boost:

        Catching Pac-Man: Grants a +25% speed boost (stacks up to 100% for consecutive catches).

        Getting Eaten: Reduces speed by 25%.

    Scoring System:

        Score Transfer: When Pac-Man is eaten, his points are transferred to the player/ghost who caught him.

        Multipliers: Pac-Man's score multiplier increases by x10 per level (up to level 20).

        Kill Streaks: Ranges from "First Blood" to "Monster Kill," granting Pac-Man extra lives.

    Randomized Levels: Level generation becomes randomized after Level 14.

🖥️ Interface (HUD) & Visuals

    Multiplayer HUD: Displays Ghost sprites, player names, current scores, and speed boost bonuses.

    Power-ups Display: A Fruit HUD shows active fruits and their corresponding power-ups.

    Reskin: Swapped Ms. Pac-Man sprites with Cookie Monster, including custom cutscenes.

    Connectivity: A dynamic QR code on the host screen updates automatically based on the host IP address.

💾 Persistence

    Leaderboard: When a player leaves, their score is sent to their phone and the global leaderboard. Top 10 scores are saved persistently.

🎮 How to Play

    Host the Game: Open the game on a desktop or laptop browser.

    Join via Mobile: Scan the dynamic QR code or visit the URL displayed on the host screen using your smartphone.

    Control: Use your phone's touch screen to control your ghost/character on the main screen.

🛠️ Tech Stack

    Backend: Node.js, Express

    Real-time Communication: Socket.io (WebSockets with polling fallback)

    Frontend: HTML5 Canvas, JavaScript, CSS3

    Deployment: Heroku

🚀 Installation & Setup

    Clone the repository

    Install Dependencies

    Run Locally

    Open http://localhost:3000 to view the game in your browser.

🎵 Audio Credits

This project uses music for educational and non-commercial purposes. All rights belong to the original artists.
Background Music

Artist: HOME (Randy Goffe)

    Album: Falling Into Place (2016)

    Tracks used: Mainframe, Byzantium, Headcase, Carrier Wave, Hold

    Support: 

Gameplay/Theme Music

Artist: 8-Bit Universe

    Track: Popcorn (8-Bit Tribute to Hot Butter)

    Support: 

📄 License

This project is for educational purposes.
