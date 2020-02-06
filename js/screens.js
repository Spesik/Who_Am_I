Game.Screen = {};

// Create start screen
Game.Screen.startScreen = {
    enter: function () {
        console.log("Entered start screen.");
    },
    exit: function () {
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
    _centerX: 0,
    _centerY: 0,
    enter: function () {
        let map = [];
        // Create a map based on parameters
        let mapWidth = 500;
        let mapHeight = 500;
        for (let x = 0; x < mapWidth; x++) {
            // Array for the y values
            map.push([]);
            // Add all the tiles
            for (let y = 0; y < mapHeight; y++) {
                map[x].push(Game.Tile.nullTile);
            }
        }
        // Map generator
        let generator = new ROT.Map.Cellular(mapWidth, mapHeight);
        generator.randomize(0.5);
        let totalIterations = 3;
        for (let i = 0; i < totalIterations - 1; i++) {
            generator.create();
        }
        generator.create(function (x, y, v) {
            if (v === 1) {
                map[x][y] = Game.Tile.floorTile;
            } else {
                map[x][y] = Game.Tile.wallTile;
            }
        });
        this._map = new Game.Map(map);
    },
    exit: function () {
        console.log("Exited play screen.");
    },
    render: function (display) {
        let screenWidth = Game.getScreenWidth();
        let screenHeight = Game.getScreenHeight();
        let topLeftX = Math.max(0, this._centerX - (screenWidth / 2));
        topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
        let topLeftY = Math.max(0, this._centerY - (screenHeight / 2));
        topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
        for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
            for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
                let glyph = this._map.getTile(x, y).getGlyph();
                display.draw(
                    x - topLeftX,
                    y - topLeftY,
                    glyph.getChar(),
                    glyph.getForeground(),
                    glyph.getBackground());
            }
        }
        // Render the Hero
        display.draw(
            this._centerX - topLeftX,
            this._centerY - topLeftY,
            '@',
            'white',
            'black');
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.winScreen);
            } else if (inputData.keyCode === ROT.VK_ESCAPE) {
                Game.switchScreen(Game.Screen.loseScreen);
            }
            // Movement
            if (inputData.keyCode === ROT.VK_LEFT) {
                this.move(-1, 0);
            } else if (inputData.keyCode === ROT.VK_RIGHT) {
                this.move(1, 0);
            } else if (inputData.keyCode === ROT.VK_UP) {
                this.move(0, -1);
            } else if (inputData.keyCode === ROT.VK_DOWN) {
                this.move(0, 1);
            }
        }
    },
    move: function (dX, dY) {
        this._centerX = Math.max(0,
            Math.min(this._map.getWidth() - 1, this._centerX + dX));
        this._centerY = Math.max(0,
            Math.min(this._map.getHeight() - 1, this._centerY + dY));
    }
};

// Create winning screen
Game.Screen.winScreen = {
    enter: function () {
        console.log("Entered win screen.");
    },
    exit: function () {
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
    handleInput: function (inputType, inputData) {
        // TODO
    }
};

// Create losing screen
Game.Screen.loseScreen = {
    enter: function () {
        console.log("Entered lose screen.");
    },
    exit: function () {
        console.log("Exited lose screen.");
    },
    render: function (display) {
        for (let i = 0; i < 22; i++) {
            display.drawText(2, i + 1, "%b{red}You lose! :(");
        }
    },
    handleInput: function (inputType, inputData) {
        // TODO
    }
};