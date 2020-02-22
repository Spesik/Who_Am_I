// Create Mixins namespace
Game.Mixins = {};

// Main player's actor mixin
Game.Mixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function () {
        if (this.getHp() < 1) {
            Game.Screen.playScreen.setGameEnded(true);
            // Send a last message to the player
            Game.sendMessage(this, 'You have died... Press [Enter] to continue!');
        }
        // Re-render screen
        Game.refresh();
        this.getMap().getEngine().lock();
        this.clearMessages();
    }
};

Game.Mixins.FungusActor = {
    name: 'FungusActor',
    groupName: 'Actor',
    init: function () {
        this._growthsRemaining = 5;
    },
    act: function () {
        if (this._growthsRemaining > 0) {
            if (Math.random() <= 0.02) {
                let xOffset = Math.floor(Math.random() * 3) - 1;
                let yOffset = Math.floor(Math.random() * 3) - 1;
                if (xOffset !== 0 || yOffset !== 0) {
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset,
                        this.getY() + yOffset,
                        this.getZ())) {
                        let entity = Game.EntityRepository.create('fungus');
                        entity.setPosition(this.getX() + xOffset, this.getY() + yOffset, this.getZ());
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                        // Send a message nearby
                        Game.sendMessageNearby(this.getMap(),
                            entity.getX(), entity.getY(), entity.getZ(),
                            'The Fungus is spending!')
                    }
                }
            }
        }
    }
};

Game.Mixins.WanderActor = {
    name: 'WanderActor',
    groupName: 'Actor',
    act: function () {
        let moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};

Game.Mixins.Attacker = {
    name: "Attacker",
    groupName: "Attacker",
    init: function (template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function () {
        return this._attackValue;
    },
    attack: function (target) {
        if (target.hasMixin('Destructible')) {
            let attack = this.getAttackValue();
            let defense = target.getDefenseValue();
            let max = Math.max(0, attack - defense);
            let damage = 1 + Math.floor(Math.random() * max);

            Game.sendMessage(this, 'You strike the %s for %d damage!',
                [target.getName(), damage]);
            Game.sendMessage(target, 'The %s strikes you for %d damage!',
                [this.getName(), damage]);
            target.takeDamage(this, damage);
        }
    }
};

// This mixin signifies an entity can take damage and be destroyed
Game.Mixins.Destructible = {
    name: "Destructible",
    init: function (template) {
        this._maxHp = template['maxHp'] || 10;
        this._hp = template['hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getDefenseValue: function () {
        return this._defenseValue;
    },
    getHp: function () {
        return this._hp;
    },
    getMaxHp: function () {
        return this._maxHp;
    },
    takeDamage: function (attacker, damage) {
        this._hp -= damage;
        // if hp <= 0,remove from the map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            if (this.hasMixin(Game.Mixins.PlayerActor)) {
                this.act();
            } else {
                this.getMap().removeEntity(this);
            }
        }
    }
};

Game.Mixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function (template) {
        this._messages = [];
    },
    receiveMessage: function (message) {
        this._messages.push(message)
    },
    getMessages: function () {
        return this._messages;
    },
    clearMessages: function () {
        this._messages = [];
    }
};

Game.Mixins.Sight = {
    name: 'Sight',
    groupName: 'Sight',
    init: function (template) {
        this._sightRadius = template['sightRadius'] || 5;
    },
    getSightRadius: function () {
        return this._sightRadius;
    }
};

Game.sendMessage = function (recipient, message, args) {
    if (recipient.hasMixin(Game.Mixins.MessageRecipient)) {
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
};

Game.sendMessageNearby = function (map, centerX, centerY, centerZ, message, args) {
    if (args) {
        message = vsprintf(message, args);
    }
    let entities = map.getEntitiesWithinRadius(centerX, centerY, centerZ, 5);
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin(Game.Mixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
};

Game.Mixins.InventoryHolder = {
    name: 'InventoryHolder',
    init: function(template) {
        // Default to 10 inventory slots.
        let inventorySlots = template['inventorySlots'] || 10;
        // Set up an empty inventory.
        this._items = new Array(inventorySlots);
    },
    getItems: function() {
        return this._items;
    },
    getItem: function(i) {
        return this._items[i];
    },
    addItem: function(item) {
        // Try to find a slot, returning true only if we could add the item.
        for (let i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function(i) {
        // Simply clear the inventory slot.
        this._items[i] = null;
    },
    canAddItem: function() {
        // Check if we have an empty slot.
        for (let i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                return true;
            }
        }
        return false;
    },
    pickupItems: function(indices) {
        // Allows the user to pick up items from the map, where indices is
        // the indices for the array returned by map.getItemsAt
        let mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        let added = 0;
        // Iterate through all indices.
        for (let i = 0; i < indices.length; i++) {
            // Try to add the item. If our inventory is not full, then splice the
            // item out of the list of items. In order to fetch the right item, we
            // have to offset the number of items already added.
            if (this.addItem(mapItems[indices[i]  - added])) {
                mapItems.splice(indices[i] - added, 1);
                added++;
            } else {
                // Inventory is full
                break;
            }
        }
        // Update the map items
        this._map.setItemsAt(this.getX(), this.getY(), this.getZ(), mapItems);
        // Return true only if we added all items
        return added === indices.length;
    },
    dropItem: function(i) {
        // Drops an item to the current map tile
        if (this._items[i]) {
            if (this._map) {
                this._map.addItem(this.getX(), this.getY(), this.getZ(), this._items[i]);
            }
            this.removeItem(i);
        }
    }
};