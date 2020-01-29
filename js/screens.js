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
    enter: function () {
        console.log("Entered play screen.");
    },
    exit: function () {
        console.log("Exited play screen.");
    },
    render: function (display) {
        display.drawText(3, 5, "%c{red}%b{white}This game is so much fun!");
        display.drawText(4, 6, "Press [Enter] to win, or [Esc] to lose!");
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