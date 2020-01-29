let Game = {
    _display: null,
    _currentScreen: null,
    init: function () {
        this._display = new ROT.Display({width: 80, height: 24});
        let game = this;
        let BindEventToScreen = function (event) {
            window.addEventListener(event, function (e) {
                if (game._currentScreen !== null) {
                    game._currentScreen.handleInput(event, e)
                }
            });
        };
        // bindEventToScreen('keydown');
        // bindEventToScreen('keyup');
        // bindEventToScreen('keypress');
    },
    getDisplay: function () {
        return this._display;
    },
    switchScreen: function () {
        if (this._currentScreen !== null) {
            this._currentScreen.exit();
        }
        this.getDisplay().clear();
        this._currentScreen = screen;
        if (!this._currentScreen !== null) {
            this._currentScreen.enter();
            this._currentScreen.render(this._display);
        }
    }
};
window.onload = function () {
    if (!ROT.isSupported()) {
        console.log("Sorry, but something isn't working.");
    } else {
        console.log('All Ok, Game is started.');
        Game.init();
        document.body.appendChild(Game.getDisplay().getContainer());
        Game.switchScreen(Game.Screen.startScreen);
    }
};