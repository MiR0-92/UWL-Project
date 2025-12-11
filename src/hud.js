var hud = (function(){

    var on = false;
    var panelWidth = 35 * tileSize; 

    // --- QR Code Variables ---
    var qrCanvas = document.createElement('canvas'); 
    var qrGenerated = false;

    // Helper to generate the QR code once
    function generateQR() {
        var joinUrl = window.location.origin + "/join";
        
        var qr = new QRious({
            element: qrCanvas,
            value: joinUrl,
            size: 130,           // Size of the QR code
            level: 'M',
            backgroundAlpha: 0,  // Transparent background
            foreground: '#ffffffff' // Pac-Man Yellow Color
        });
        qrGenerated = true;
    }
    // -------------------------

    // Draws the Left Panel (QR Code + Player List)
    var drawPlayerPanel = function(ctx) {
        // --- 1. Draw the QR Code Section (Top Left) ---
        if (!qrGenerated) generateQR();

        // Position for QR Panel
        var qrX = -panelWidth + 14 * tileSize; 
        var qrY = -3 * tileSize; 

        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFFF00"; // Pac-Man Yellow
        ctx.font = "12px ArcadeR";

        // Draw "SCAN:"
        ctx.fillText("SCAN:", qrX + 15, qrY + 5);

        // --- NEW: Draw White Border around QR Code ---
        var qrSize = 120;
        var padding = 2;       // Space between QR code and border
        var borderThick = 2;   // Thickness of the white line

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = borderThick;
        ctx.strokeRect(
            qrX - 50 - padding, 
            qrY + 20 - padding, 
            qrSize + (padding * 2), 
            qrSize + (padding * 2)
        );
        // Draw QR Image (Centered below text)
        // We offset x by half the size (55) to center it since drawImage uses top-left
        ctx.drawImage(qrCanvas, qrX - 55, qrY + 15);

        // Draw "TO JOIN" (Below Image)
   
        ctx.fillText("TO JOIN", qrX -10, qrY + 25 + 100 + 20);
        ctx.restore();


        // --- 2. Draw the Player List (Below QR Code) ---
        // (Existing logic, just shifted Y slightly if needed)
        
        var panelX_Left = -panelWidth; 
        var panelY_Start = 19 * tileSize; 

        ctx.save();
        ctx.font = "8px ArcadeR";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ccc";
        ctx.textAlign = "center";

        // --- Headers ---
        var headerY = panelY_Start;
        var rowY = headerY + 2.2*tileSize; 
        var rowHeight = 2.2*tileSize;      

        var nameX = panelX_Left + 9*tileSize;   
        var scoreX = panelX_Left + 18*tileSize; 
        var bonusX = panelX_Left + 29*tileSize; 
        
        ctx.fillText("NICKNAME", nameX, headerY);
        ctx.fillText("SCORE", scoreX, headerY);
        ctx.fillText("BONUS SPEED", bonusX, headerY);

        // --- Ghost Rows ---
        var ghosts = [blinky, pinky, inky, clyde];
        for (var i = 0; i < ghosts.length; i++) {
            var ghost = ghosts[i];
            var y = rowY + i * (rowHeight + tileSize); 

            // Icon
            var iconCenterX = panelX_Left + 7*tileSize; 
            var iconCenterY = y + (rowHeight / 1.5);
            atlas.drawGhostSprite(ctx, iconCenterX, iconCenterY, 0, DIR_RIGHT, false, false, false, ghost.color);

            // Name
            ctx.textAlign = "left";
            ctx.fillStyle = ghost.color;
            ctx.font = "10px ArcadeR";
            var name = ghost.playerName ? ghost.playerName.toUpperCase() : getGhostNames()[i].toUpperCase();
            ctx.fillText(name.substring(0, 10), nameX, y + 6); 

            // Score
            ctx.fillStyle = "#fff700";
            ctx.textAlign = "left";
            ctx.fillText(ghost.score || 0, scoreX, y + 6);

            // Bonus
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center"; 
            var bonusText = "0%";
            if (ghost.speedLevel === 1) bonusText = "+25%";
            else if (ghost.speedLevel === 2) bonusText = "+50%";
            else if (ghost.speedLevel === 3) bonusText = "+75%";
            else if (ghost.speedLevel === 4) bonusText = "+100%";
            ctx.fillText(bonusText, bonusX, y + 6);
        }
        ctx.restore();
    };

    var drawPowerUpPanel = function(ctx) {
        var panelX_Right = 28.5 * tileSize; 
        var panelY_Start = 13 * tileSize; 

        ctx.save();
        ctx.font = "10px ArcadeR";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#FFFF00";
        ctx.textAlign = "left";

        ctx.fillText("POWER UPS:", panelX_Right + 4*tileSize, panelY_Start);

        ctx.font = "7.3px ArcadeR";
        ctx.fillStyle = "#fff";
        var rowY = panelY_Start + 2*tileSize; 
        var rowHeight = 2.5*tileSize; 

        var fruits = [
            { name: 'cherry', text: 'CHERRY - SPEED UP 2 SEC.' },
            { name: 'strawberry', text: 'STRAWBERRY - SPEED UP 4 SEC.' },
            { name: 'orange', text: 'ORANGE - SPEED UP 6 SEC.' },
            { name: 'pretzel', text: 'PRETZEL - SLOW GHOSTS 2 SEC.' },
            { name: 'apple', text: 'APPLE - SLOW GHOSTS 4 SEC.' },
            { name: 'pear', text: 'PEAR - INVINCIBILITY 2 SEC.' },
            { name: 'banana', text: 'BANANA - INVINCIBILITY 4 SEC.' }
        ];

        for (var i = 0; i < fruits.length; i++) {
            var fruit = fruits[i];
            var y = rowY + i * (rowHeight + 2); 

            var iconCenterX = panelX_Right + 2*tileSize; 
            var iconCenterY = y + (rowHeight / 2);
            var scaleFactor = 1.2; 
            atlas.drawFruitSprite(ctx, iconCenterX, iconCenterY, fruit.name, scaleFactor);

            ctx.textAlign = "left";
            ctx.fillStyle = "#fff";
            ctx.fillText(fruit.text, panelX_Right + 4*tileSize, y + 7); 
        }
        ctx.restore();
    };


    return {

        update: function() {
            var valid = this.isValidState();
            if (valid != on) {
                on = valid;
                if (on) {
                    inGameMenu.onHudEnable();
                    vcr.onHudEnable();
                }
                else {
                    inGameMenu.onHudDisable();
                    vcr.onHudDisable();
                }
            }
        },
        draw: function(ctx) {
            vcr.draw(ctx);
            drawPlayerPanel(ctx);
            drawPowerUpPanel(ctx);
        },
        isValidState: function() {
            return (
                state == playState ||
                state == newGameState ||
                state == readyNewState ||
                state == readyRestartState ||
                state == finishState ||
                state == deadState ||
                state == overState);
        },
    };

})();