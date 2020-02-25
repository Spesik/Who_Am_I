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
    _player: null,
    _gameEnded: false,
    _subScreen: null,
    enter: function () {
        // Create a map based on parameters
        let width = 100;
        let height = 48;
        let depth = 6;
        // Create our map from the tiles and player
        this._player = new Game.Entity(Game.PlayerTemplate);
        let tiles = new Game.Builder(width, height, depth).getTiles();
        let map = new Game.Map.Cave(tiles, this._player);
        // Start the map's engine
        map.getEngine().start();
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
        topLeftX = Math.min(topLeftX, this._player.getMap().getWidth() - screenWidth);
        let topLeftY = Math.max(0, this._player.getY() - (screenHeight / 2));
        topLeftY = Math.min(topLeftY, this._player.getMap().getHeight() - screenHeight);
        let visibleCells = {};
        let map = this._player.getMap();
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
                    let glyph = map.getTile(x, y, currentDepth);
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
        // Render player stats
        let stats = '%c{white}%b{black}';
        stats += vsprintf('HP: %d/%d L: %d XP: %d',
            [this._player.getHp(), this._player.getMaxHp(),
                this._player.getLevel(), this._player.getExperience()]);
        display.drawText(0, screenHeight, stats);
        // Render hunger state
        let hungerState = this._player.getHungerState();
        display.drawText(screenWidth - hungerState.length, screenHeight, hungerState);
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
                // Show the inventory screen
                this.showItemsSubScreen(Game.Screen.inventoryScreen, this._player.getItems(),
                    'You are not carrying anything.');
                return;
            } else if (inputData.keyCode === ROT.VK_D) {
                // Show the drop screen
                this.showItemsSubScreen(Game.Screen.dropScreen, this._player.getItems(),
                    'You have nothing to drop.');
                return;
            } else if (inputData.keyCode === ROT.VK_E) {
                // Show the drop screen
                this.showItemsSubScreen(Game.Screen.eatScreen, this._player.getItems(),
                    'You have nothing to eat.');
                return;
            } else if (inputData.keyCode === ROT.VK_W) {
                if (inputData.shiftKey) {
                    // Show the wear screen
                    this.showItemsSubScreen(Game.Screen.wearScreen, this._player.getItems(),
                        'You have nothing to wear.');
                } else {
                    // Show the wield screen
                    this.showItemsSubScreen(Game.Screen.wieldScreen, this._player.getItems(),
                        'You have nothing to wield.');
                }
                return;
            } else if (inputData.keyCode === ROT.VK_R) {
                let items = this._player.getMap().getItemsAt(this._player.getX(),
                    this._player.getY(), this._player.getZ());
                // If there is only one item, directly pick it up
                if (items && items.length === 1) {
                    let item = items[0];
                    if (this._player.pickupItems([0])) {
                        Game.sendMessage(this._player, "You pick up %s.", [item.describeA()]);
                    } else {
                        Game.sendMessage(this._player, "Your inventory is full! Nothing was picked up.");
                    }
                } else {
                    this.showItemsSubScreen(Game.Screen.pickupScreen, items,
                        'There is nothing here to pick up.');
                }
            } else {
                // Not a valid key
                return;
            }
            // Unlock the engine
            this._player.getMap().getEngine().unlock();
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
            this._player.getMap().getEngine().unlock();
        }
    },
    move: function (dX, dY, dZ) {
        let newX = this._player.getX() + dX;
        let newY = this._player.getY() + dY;
        let newZ = this._player.getZ() + dZ;
        // Try to move to the new cell
        this._player.tryMove(newX, newY, newZ, this._player.getMap());
    },
    setGameEnded: function (gameEnded) {
        this._gameEnded = gameEnded;
    },
    setSubScreen: function (subScreen) {
        this._subScreen = subScreen;
        // Refresh screen on changing the subscreen
        Game.refresh();
    },
    showItemsSubScreen: function (subScreen, items, emptyMessage) {
        if (items && subScreen.setup(this._player, items) > 0) {
            this.setSubScreen(subScreen);
        } else {
            Game.sendMessage(this._player, emptyMessage);
            Game.refresh();
        }
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

Game.Screen.ItemListScreen = function (template) {
    // Set up based on the template
    this._caption = template['caption'];
    this._okFunction = template['ok'];
    this._isAcceptableFunction = template['isAcceptable'] || function (x) {
        return x;
    };
    // Whether the user can select items at all.
    this._canSelectItem = template['canSelect'];
    // Whether the user can select multiple items.
    this._canSelectMultipleItems = template['canSelectMultipleItems'];
    this._hasNoItemOption = template['hasNoItemOption'];
};

Game.Screen.ItemListScreen.prototype.setup = function (player, items) {
    this._player = player;
    let count = 0;
    // Iterate over each item, keeping only the acceptable ones and counting
    // the number of acceptable items.
    let that = this;
    this._items = items.map(function (item) {
        // Transform the item into null if it's not acceptable
        if (that._isAcceptableFunction(item)) {
            count++;
            return item;
        } else {
            return null;
        }
    });
    this._selectedIndices = {};
    return count;
};

Game.Screen.ItemListScreen.prototype.render = function (display) {
    let letters = 'abcdefghijklmnopqrstuvwxyz';
    // Render the caption in the top row
    display.drawText(0, 0, this._caption);
    if (this._hasNoItemOption) {
        display.drawText(0, 1, '0 - no item');
    }
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
            let suffix = '';
            if (this._items[i] === this._player.getArmor()) {
                suffix = ' (wearing)';
            } else if (this._items[i] === this._player.getWeapon()) {
                suffix = ' (wielding)';
            }
            // Render at the correct row and add 2.
            display.drawText(0, 2 + row, letter + ' ' + selectionState + ' ' +
                this._items[i].describe() + suffix);
            row++;
        }
    }
};

Game.Screen.ItemListScreen.prototype.executeOkFunction = function () {
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
Game.Screen.ItemListScreen.prototype.handleInput = function (inputType, inputData) {
    if (inputType === 'keydown') {
        if (inputData.keyCode === ROT.VK_ESCAPE ||
            (inputData.keyCode === ROT.VK_RETURN &&
                (!this._canSelectItem || Object.keys(this._selectedIndices).length === 0))) {
            Game.Screen.playScreen.setSubScreen(undefined);
        } else if (inputData.keyCode === ROT.VK_RETURN) {
            this.executeOkFunction();
            // Handle pressing zero when 'no item' selection is enabled
        } else if (this._canSelectItem && this._hasNoItemOption && inputData.keyCode === ROT.VK_0) {
            this._selectedIndices = {};
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
    ok: function (selectedItems) {
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
    ok: function (selectedItems) {
        // Drop the selected item
        this._player.dropItem(Object.keys(selectedItems)[0]);
        return true;
    }
});

Game.Screen.eatScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to eat',
    canSelect: true,
    canSelectMultipleItems: false,
    isAcceptable: function (item) {
        return item && item.hasMixin('Edible');
    },
    ok: function (selectedItems) {
        // Eat the item, removing it if there are no consumptions remaining.
        let key = Object.keys(selectedItems)[0];
        let item = selectedItems[key];
        Game.sendMessage(this._player, "You eat %s.", [item.describeThe()]);
        item.eat(this._player);
        if (!item.hasRemainingConsumptions()) {
            this._player.removeItem(key);
        }
        return true;
    }
});

Game.Screen.wieldScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to wield',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: true,
    isAcceptable: function (item) {
        return item && item.hasMixin('Equippable') && item.isWieldable();
    },
    ok: function (selectedItems) {
        // Check if we selected 'no item'
        let keys = Object.keys(selectedItems);
        if (keys.length === 0) {
            this._player.unwield();
            Game.sendMessage(this._player, "You are empty handed.")
        } else {
            // Make sure to unequip the item first in case it is the armor.
            let item = selectedItems[keys[0]];
            this._player.unequip(item);
            this._player.wield(item);
            Game.sendMessage(this._player, "You are wielding %s.", [item.describeA()]);
        }
        return true;
    }
});

Game.Screen.wearScreen = new Game.Screen.ItemListScreen({
    caption: 'Choose the item you wish to wear',
    canSelect: true,
    canSelectMultipleItems: false,
    hasNoItemOption: true,
    isAcceptable: function (item) {
        return item && item.hasMixin('Equippable') && item.isWearable();
    },
    ok: function (selectedItems) {
        // Check if we selected 'no item'
        let keys = Object.keys(selectedItems);
        if (keys.length === 0) {
            this._player.unwield();
            Game.sendMessage(this._player, "You are not wearing anything.")
        } else {
            // Make sure to unequip the item first in case it is the weapon.
            let item = selectedItems[keys[0]];
            this._player.unequip(item);
            this._player.wear(item);
            Game.sendMessage(this._player, "You are wearing %s.", [item.describeA()]);
        }
        return true;
    }
});

Game.Screen.gainStatScreen = {
    setup: function (entity) {
        // Must be called before rendering.
        this._entity = entity;
        this._options = entity.getStatOptions();
    },
    render: function (display) {
        let letters = 'abcdefghijklmnopqrstuvwxyz';
        display.drawText(0, 0, 'Choose a stat to increase: ');

        // Iterate through each of our options
        for (let i = 0; i < this._options.length; i++) {
            display.drawText(0, 2 + i,
                letters.substring(i, i + 1) + ' - ' + this._options[i][0]);
        }

        // Render remaining stat points
        display.drawText(0, 4 + this._options.length,
            "Remaining points: " + this._entity.getStatPoints());
    },
    handleInput: function (inputType, inputData) {
        if (inputType === 'keydown') {
            // If a letter was pressed, check if it matches to a valid option.
            if (inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z) {
                // Check if it maps to a valid item by subtracting 'a' from the character
                // to know what letter of the alphabet we used.
                let index = inputData.keyCode - ROT.VK_A;
                if (this._options[index]) {
                    // Call the stat increasing function
                    this._options[index][1].call(this._entity);
                    // Decrease stat points
                    this._entity.setStatPoints(this._entity.getStatPoints() - 1);
                    // If we have no stat points left, exit the screen, else refresh
                    if (this._entity.getStatPoints() === 0) {
                        Game.Screen.playScreen.setSubScreen(undefined);
                    } else {
                        Game.refresh();
                    }
                }
            }
        }
    }
};