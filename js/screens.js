Game.Screen = {};

Game.Screen.startScreen = {
    enter: function () {
        console.log("Entered start screen.");
    },
    exit: function () {
        console.log("Exited start screen.");
    },
    render: function (display) {
        display.drawText(1, 1, "%c{yellow}Who Am I?");
        display.drawText(1, 2, "Press [Enter] to start!");
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.playScreen);
            }
        }
    }
};

Game.Screen.playScreen = {
    _map: null,
    enter: function() {
        let map = [];
        for (let x = 0; x < 80; x++) {
            map.push([]);
            for (let y = 0; y < 24; y++) {
                map[x].push(Game.Tile.nullTile);
            }
        }
        let generator = new ROT.Map.Cellular(80, 24);
        generator.randomize(0.5);
        let totalIterations = 3;
        for (let i = 0; i < totalIterations - 1; i++) {
            generator.create();
        }
        generator.create(function(x,y,v) {
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
        for (let x = 0; x < this._map.getWidth(); x++) {
            for (let y = 0; y < this._map.getHeight(); y++) {
                let glyph = this._map.getTile(x, y).getGlyph();
                display.draw(x, y,
                    glyph.getChar(),
                    glyph.getForeground(),
                    glyph.getBackground());
            }
        }
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            if (inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.winScreen);
            } else if (inputData.keyCode === ROT.VK_ESCAPE) {
                Game.switchScreen(Game.Screen.loseScreen);
            }
        }
    }
};

Game.Screen.winScreen = {
    enter: function () {
        console.log("Entered win screen.");
    },
    exit: function () {
        console.log("Exited win screen.");
    },
    render: function (display) {
        for (let i = 0; i < 22; i++) {
            let r = Math.round(Math.random() * 255);
            let g = Math.round(Math.random() * 255);
            let b = Math.round(Math.random() * 255);
            let background = ROT.Color.toRGB([r, g, b]);
            display.drawText(2, i + 1, "%b{" + background + "}You win!");
        }
    },
    handleInput: function (inputType, inputData) {
        // TODO Win Screen
    }
};

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
        // TODO: Lose Screen
    }
};