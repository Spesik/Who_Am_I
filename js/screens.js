Game.Screen = {};

// Create start screen
Game.Screen.startScreen = {
    enter: function() {
        console.log("Entered start screen.");
    },
    exit: function() {
        console.log("Exited start screen.");
    },
    render: function (display) {
        display.drawText(1, 1, "%c{red}Who Am I?");
        display.drawText(1, 2, "%c{yellow}Press [Enter] to start!");
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.playScreen);
            }
        }
    }
};

// Create playing screen
Game.Screen.playScreen = {
    _map: null,
    _player: null,
    enter: function() {
        // Create a map based on parameters
        let width = 100;
        let height = 48;
        let depth = 6;
        // Create our map from the tiles and player
        let tiles = new Game.Builder(width, height, depth).getTiles();
        // Create player and set the position
        this._player = new Game.Entity(Game.PlayerTemplate);
        this._map = new Game.Map(tiles, this._player);
        // Start the map's engine
        this._map.getEngine().start();
    },
    exit: function() {
        console.log("Exited play screen.");
    },
    render: function (display) {
        let screenWidth = Game.getScreenWidth();
        let screenHeight = Game.getScreenHeight();
        let topLeftX = Math.max(0, this._player.getX() - (screenWidth / 2));
        topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
        let topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
        topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
        for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
            for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
                let tile = this._map.getTile(x, y, this._player.getZ());
                display.draw(
                    x - topLeftX,
                    y - topLeftY,
                    tile.getChar(),
                    tile.getForeground(),
                    tile.getBackground());
            }
        }
        // Render the Hero
        let entities = this._map.getEntities();
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];
            if (entity.getX() >= topLeftX && entity.getY() >= topLeftY &&
                entity.getX() < topLeftX + screenWidth &&
                entity.getY() < topLeftY + screenHeight &&
                entity.getZ() === this._player.getZ()) {
                display.draw(
                    entity.getX() - topLeftX,
                    entity.getY() - topLeftY,
                    entity.getChar(),
                    entity.getForeground(),
                    entity.getBackground()
                );
            }
        }
        let messages = this._player.getMessages();
        let messageY = 0;
        for (let i = 0; i < messages.length; i++) {
            // Draw each messages
            messageY += display.drawText(
                0, messageY,
                '%c{white}%b{black}' + messages[i])
        }
        // Render player HP
        let stats = '%c{white}%b{black}';
        stats += vsprintf(' HP: %d/%d ', [this._player.getHp(), this._player.getMaxHp()]);
        display.drawText(0, screenHeight, stats);
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.winScreen);
            } else if (inputData.keyCode === ROT.VK_ESCAPE) {
                Game.switchScreen(Game.Screen.loseScreen);
            } else {
                // Movement
                if (inputData.keyCode === ROT.VK_LEFT) {
                    this.move(-1, 0, 0);
                } else if (inputData.keyCode === ROT.VK_RIGHT) {
                    this.move(1, 0, 0);
                } else if (inputData.keyCode === ROT.VK_UP) {
                    this.move(0, -1, 0);
                } else if (inputData.keyCode === ROT.VK_DOWN) {
                    this.move(0, 1, 0);
                } else {
                    return;
                }
                //Unlock the engine
                this._map.getEngine().unlock();
            }
        } else if (inputType === 'keypress') {
            let keyChar = String.fromCharCode(inputData.charCode);
            if (keyChar === '>') {
                this.move(0, 0, 1);
            } else if (keyChar === '<') {
                this.move(0, 0, -1);
            } else {
                // Not a valid key
                return;
            }
            // Unlock the engine
            this._map.getEngine().unlock();
        }
    },
    move: function (dX, dY, dZ) {
        let newX = this._player.getX() + dX;
        let newY = this._player.getY() + dY;
        let newZ = this._player.getZ() + dZ;
        // Try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._map);
    }
};

// Create winning screen
Game.Screen.winScreen = {
    enter: function() {
        console.log("Entered win screen.");
    },
    exit: function() {
        console.log("Exited win screen.");
    },
    render: function (display) {
        for (let i = 0; i < 22; i++) {
            // Generate random background colors
            let r = Math.round(Math.random() * 255);
            let g = Math.round(Math.random() * 255);
            let b = Math.round(Math.random() * 255);
            let background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i + 1, "%b{" + background + "}You win!");
        }
    },
    handleInput: function(inputType, inputData) {
        // TODO
    }
};

// Create losing screen
Game.Screen.loseScreen = {
    enter: function() {
        console.log("Entered lose screen.");
    },
    exit: function() {
        console.log("Exited lose screen.");
    },
    render: function(display) {
        for (let i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose! :(");
        }
    },
    handleInput: function(inputType, inputData) {
        // TODO
    }
};