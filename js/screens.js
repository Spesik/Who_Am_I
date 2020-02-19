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
    _map: null,
    _player: null,
    _gameEnded: false,
    _subScreen: null,
    enter: function () {
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
    exit: function () {
        console.log("Exited play screen.");
    },
    render: function (display) {
        if (this._subScreen) {
            this._subScreen.render(display);
            return;
        }
        let screenWidth = Game.getScreenWidth();
        let screenHeight = Game.getScreenHeight();
        let topLeftX = Math.max(0, this._player.getX() - (screenWidth / 2));
        topLeftX = Math.min(topLeftX, this._map.getWidth() - screenWidth);
        let topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
        topLeftY = Math.min(topLeftY, this._map.getHeight() - screenHeight);
        let visibleCells = {};
        let map = this._map;
        let currentDepth = this._player.getZ();
        // Find all visible cells and update the object
        map.getFov(currentDepth).compute(
            this._player.getX(), this._player.getY(),
            this._player.getSightRadius(),
            function (x, y, radius, visibility) {
                visibleCells[x + "," + y] = true;
                map.setExplored(x, y, currentDepth, true)
            });
        for (let x = topLeftX; x < topLeftX + screenWidth; x++) {
            for (let y = topLeftY; y < topLeftY + screenHeight; y++) {
                if (map.isExplored(x, y, currentDepth)) {
                    let glyph = this._map.getTile(x, y, currentDepth);
                    let foreground = glyph.getForeground();
                    if (visibleCells[x + ',' + y]) {
                        let items = map.getItemsAt(x, y, currentDepth);
                        if (items) {
                            glyph = items[items.length - 1];
                        }
                        if (map.getEntityAt(x, y, currentDepth)) {
                            glyph = map.getEntityAt(x, y, currentDepth);
                        }
                        foreground = glyph.getForeground();
                    } else {
                        foreground = 'darkGray';
                    }
                    display.draw(
                        x - topLeftX,
                        y - topLeftY,
                        glyph.getChar(),
                        foreground,
                        glyph.getBackground());
                }
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
        if (this._gameEnded) {
            if (inputType === 'keydown' && inputData.keyCode === ROT.VK_RETURN) {
                Game.switchScreen(Game.Screen.loseScreen);
            }
            // Return to make sure the user can't still play
            return;
        }
        // Handle subscreen input if there is one
        if (this._subScreen) {
            this._subScreen.handleInput(inputType, inputData);
            return;
        }
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
                } else if (inputData.keyCode === ROT.VK_I) {
                    if (this._player.getItems().filter(function(x){return x;}).length === 0) {
                        // If the player has no items, send a message and don't take a turn
                        Game.sendMessage(this._player, "You are not carrying anything!");
                        Game.refresh();
                    } else {
                        // Show the inventory
                        Game.Screen.inventoryScreen.setup(this._player, this._player.getItems());
                        this.setSubScreen(Game.Screen.inventoryScreen);
                    }
                    return;
                } else if (inputData.keyCode === ROT.VK_D) {
                    if (this._player.getItems().filter(function(x){return x;}).length === 0) {
                        // If the player has no items, send a message and don't take a turn
                        Game.sendMessage(this._player, "You have nothing to drop!");
                        Game.refresh();
                    } else {
                        // Show the drop screen
                        Game.Screen.dropScreen.setup(this._player, this._player.getItems());
                        this.setSubScreen(Game.Screen.dropScreen);
                    }
                    return;
                } else if (inputData.keyCode === ROT.VK_COMMA) {
                    let items = this._map.getItemsAt(this._player.getX(), this._player.getY(), this._player.getZ());
                    // If there are no items, show a message
                    if (!items) {
                        Game.sendMessage(this._player, "There is nothing here to pick up.");
                    } else if (items.length === 1) {
                        // If only one item, try to pick it up
                        let item = items[0];
                        if (this._player.pickupItems([0])) {
                            Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
                        } else {
                            Game.sendMessage(this._player, "Your inventory is full! Nothing was picked up.");
                        }
                    } else {
                        // Show the pickup screen if there are any items
                        Game.Screen.pickupScreen.setup(this._player, items);
                        this.setSubScreen(Game.Screen.pickupScreen);
                        return;
                    }
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
    },
    setGameEnded: function (gameEnded) {
        this._gameEnded = gameEnded;
    },
    setSubScreen: function (subScreen) {
        this._subScreen = subScreen;
        // Refresh screen on changing the subscreen
        Game.refresh();
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

Game.Screen.ItemListScreen = function(template) {
    // Set up based on the template
    this._caption = template['caption'];
    this._okFunction = template['ok'];
    // Whether the user can select items at all.
    this._canSelectItem = template['canSelect'];
    // Whether the user can select multiple items.
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
};

Game.Screen.ItemListScreen.prototype.setup = function(player, items) {
    this._player = player;
    this._items = items;
    this._selectedIndices = {};
};

Game.Screen.ItemListScreen.prototype.render = function(display) {
    let letters = 'abcdefghijklmnopqrstuvwxyz';
    // Render the caption in the top row
    display.drawText(0, 0, this._caption);
    let row = 0;
    for (let i = 0; i < this._items.length; i++) {
        // If we have an item, we want to render it.
        if (this._items[i]) {
            // Get the letter matching the item's index
            let letter = letters.substring(i, i + 1);
            // If we have selected an item, show a +, else show a dash between
            // the letter and the item's name.
            let selectionState = (this._canSelectItem && this._canSelectMultipleItems &&
                this._selectedIndices[i]) ? '+' : '-';
            // Render at the correct row and add 2.
            display.drawText(0, 2 + row, letter + ' ' + selectionState + ' ' + this._items[i].describe());
            row++;
        }
    }
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function() {
    // Gather the selected items.
    let selectedItems = {};
    for (let key in this._selectedIndices) {
        selectedItems[key] = this._items[key];
    }
    // Switch back to the play screen.
    Game.Screen.playScreen.setSubScreen(undefined);
    if (this._okFunction(selectedItems)) {
        this._player.getMap().getEngine().unlock();
    }
};
Game.Screen.ItemListScreen.prototype.handleInput = function(inputType, inputData) {
    if (inputType === 'keydown') {
        if (inputData.keyCode === ROT.VK_ESCAPE ||
            (inputData.keyCode === ROT.VK_RETURN &&
                (!this._canSelectItem || Object.keys(this._selectedIndices).length === 0))) {
            Game.Screen.playScreen.setSubScreen(undefined);
        } else if (inputData.keyCode === ROT.VK_RETURN) {
            this.executeOkFunction();
        } else if (this._canSelectItem && inputData.keyCode >= ROT.VK_A &&
            inputData.keyCode <= ROT.VK_Z) {
            let index = inputData.keyCode - ROT.VK_A;
            if (this._items[index]) {
                if (this._canSelectMultipleItems) {
                    if (this._selectedIndices[index]) {
                        delete this._selectedIndices[index];
                    } else {
                        this._selectedIndices[index] = true;
                    }
                    // Redraw screen
                    Game.refresh();
                } else {
                    this._selectedIndices[index] = true;
                    this.executeOkFunction();
                }
            }
        }
    }
};

Game.Screen.inventoryScreen = new Game.Screen.ItemListScreen({
    caption: 'Inventory',
    canSelect: false
});

Game.Screen.pickupScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the items you wish to pickup',
    canSelect: true,
    canSelectMultipleItems: true,
    ok: function(selectedItems) {
        // Try to pick up all items, messaging the player if they couldn't all be
        // picked up.
        if (!this._player.pickupItems(Object.keys(selectedItems))) {
            Game.sendMessage(this._player, "Your inventory is full! Not all items were picked up.");
        }
        return true;
    }
});

Game.Screen.dropScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to drop',
    canSelect: true,
    canSelectMultipleItems: false,
    ok: function(selectedItems) {
        // Drop the selected item
        this._player.dropItem(Object.keys(selectedItems)[0]);
        return true;
    }
});