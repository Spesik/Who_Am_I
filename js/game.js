let Game = {
    _display: null,
    _currentScreen: null,
    _screenWidth: 80,
    _screenHeight: 24,
    init: function() {
        this._display = new ROT.Display({width: this._screenWidth,
                                            height: this._screenHeight + 1});
        let game = this;
        let bindEventToScreen = function(event) {
            window.addEventListener(event,  function(e) {
                if (game._currentScreen !== null) {
                    game._currentScreen.handleInput(event, e);
                }
            });
        };
        bindEventToScreen('keydown');
        // bindEventToScreen('keyup');
        bindEventToScreen('keypress');
    },
    getDisplay: function() {
        return this._display;
    },
    getScreenWidth: function() {
        return this._screenWidth;
    },
    getScreenHeight: function() {
        return this._screenHeight;
    },
    refresh: function() {
        this._display.clear();
        this._currentScreen.render(this._display);
    },
    switchScreen: function (screen) {
        if (this._currentScreen !== null) {
            this._currentScreen.exit();
        }
        this.getDisplay().clear();
        this._currentScreen = screen;
        if (!this._currentScreen !== null) {
            this._currentScreen.enter();
            this.refresh();
        }
    }
};

window.onload = function() {
    if (!ROT.isSupported()) {
        console.log("The rot.js library isn't supported by your browser.");
    } else {
        Game.init();
        document.body.appendChild(Game.getDisplay().getContainer());
        Game.switchScreen(Game.Screen.startScreen);
    }
};