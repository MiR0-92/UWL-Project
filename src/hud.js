var hud = (function(){

    var on = false;
    // MODIFIED: Use the new 34-tile width. This MUST match src/renderers.js
    var panelWidth = 35 * tileSize; 

    // NEW FUNCTION 1: Draws the player status panel on the left
    var drawPlayerPanel = function(ctx) {
        // Our context (0,0) is the top-left corner of the playable map.
        
        // Start drawing from the far left edge of the canvas.
        var panelX_Left = -panelWidth; 
        
        // Position vertically, matching your screenshot
        var panelY_Start = 19 * tileSize; 

        ctx.save();
        ctx.font = "8px ArcadeR";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#ccc";
        ctx.textAlign = "center";

        // --- Headers ---
        var headerY = panelY_Start;
        var rowY = headerY + 2.2*tileSize; // 24px below header
        var rowHeight = 2.2*tileSize;      // 24px

        // Define X positions for columns based on your image
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
            var y = rowY + i * (rowHeight + tileSize); // 24px row + 8px gap

            // 1. Draw Icon
            var iconCenterX = panelX_Left + 7*tileSize; 
            var iconCenterY = y + (rowHeight / 1.5);
            atlas.drawGhostSprite(ctx, iconCenterX, iconCenterY, 0, DIR_RIGHT, false, false, false, ghost.color);

            // 2. Draw Name
            ctx.textAlign = "left";
            ctx.fillStyle = ghost.color;
            ctx.font = "10px ArcadeR";
            var name = ghost.playerName ? ghost.playerName.toUpperCase() : getGhostNames()[i].toUpperCase();
            ctx.fillText(name.substring(0, 10), nameX, y + 6); // Max 10 chars

            // 3. Draw Score
            ctx.fillStyle = "#fff700";
            ctx.textAlign = "left";
            ctx.fillText(ghost.score || 0, scoreX, y + 6);

            // 4. Draw Bonus
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center"; // Use left align as in your screenshot
            var bonusText = "0%";
            if (ghost.speedLevel === 1) bonusText = "+25%";
            else if (ghost.speedLevel === 2) bonusText = "+50%";
            else if (ghost.speedLevel === 3) bonusText = "+75%";
            else if (ghost.speedLevel === 4) bonusText = "+100%";
            ctx.fillText(bonusText, bonusX, y + 6);
        }
        ctx.restore();
    };

    // NEW FUNCTION 2: Draws the power-ups panel on the right
    var drawPowerUpPanel = function(ctx) {
        // (0,0) is top-left of map. Map width is 28 tiles.
        var panelX_Right = 28.5 * tileSize; // Start drawing at x=224 (right of map)
        var panelY_Start = 13 * tileSize; // Align with left panel

        ctx.save();
        ctx.font = "10px ArcadeR";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#FFFF00";
        ctx.textAlign = "left";

        // Title
        ctx.fillText("POWER UPS:", panelX_Right + 4*tileSize, panelY_Start);

        // List
        ctx.font = "7.3px ArcadeR";
        ctx.fillStyle = "#fff";
        var rowY = panelY_Start + 2*tileSize; // 24px below title
        var rowHeight = 2.5*tileSize; // 24px

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
            var y = rowY + i * (rowHeight + 2); // 24px row + 4px gap

            // 1. Draw Icon
            var iconCenterX = panelX_Right + 2*tileSize; 
            var iconCenterY = y + (rowHeight / 2);
            var scaleFactor = 1.2; // Double the 8px sprite size to 16px
            atlas.drawFruitSprite(ctx, iconCenterX, iconCenterY, fruit.name, scaleFactor);

            // 2. Draw Text
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
            //inGameMenu.draw(ctx); //enable-disable menu shown on the screen
            vcr.draw(ctx);
            
            // --- MODIFIED: ADD THESE TWO LINES ---
            drawPlayerPanel(ctx);
            drawPowerUpPanel(ctx);
            // -------------------------------------
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