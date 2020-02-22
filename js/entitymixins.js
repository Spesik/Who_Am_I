// Create EntityMixins namespace
Game.EntityMixins = {};

// Main player's actor mixin
Game.EntityMixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function () {
        if (this._acting) {
            return;
        }
        this._acting = true;
        this.addTurnHunger();
        if (!this.isAlive()) {
            Game.Screen.playScreen.setGameEnded(true);
            // Send a last message to the player
            Game.sendMessage(this, 'You have died... Press [Enter] to continue!');
        }
        // Re-render screen
        Game.refresh();
        this.getMap().getEngine().lock();
        this.clearMessages();
        this._acting = false;
    }
};

Game.EntityMixins.FungusActor = {
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

Game.EntityMixins.WanderActor = {
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

Game.EntityMixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function (template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function () {
        let modifier = 0;
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getAttackValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor().getAttackValue();
            }
        }
        return this._attackValue + modifier;
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
Game.EntityMixins.Destructible = {
    name: 'Destructible',
    init: function (template) {
        this._maxHp = template['maxHp'] || 10;
        this._hp = template['hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getDefenseValue: function () {
        let modifier = 0;
        if (this.hasMixin(Game.EntityMixins.Equipper)) {
            if (this.getWeapon()) {
                modifier += this.getWeapon().getDefenseValue();
            }
            if (this.getArmor()) {
                modifier += this.getArmor().getDefenseValue();
            }
        }
        return this._defenseValue + modifier;
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
            if (this.hasMixin(Game.EntityMixins.CorpseDroper)) {
                this.tryDropCorpse();
            }
            this.kill();
        }
    }
};

Game.EntityMixins.MessageRecipient = {
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

Game.EntityMixins.Sight = {
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
    if (recipient.hasMixin(Game.EntityMixins.MessageRecipient)) {
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
        if (entities[i].hasMixin(Game.EntityMixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
};

Game.EntityMixins.InventoryHolder = {
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
        if (this._items[i] && this.hasMixin(Game.EntityMixins.Equipper)) {
            this.unequip(this._items[i]);
        }
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
Game.EntityMixins.FoodConsumer = {
    name: 'FoodConsumer',
    init: function(template) {
        this._maxFullness = template['maxFullness'] || 1000;
        // Start halfway to max fullness if no default value
        this._fullness = template['fullness'] || (this._maxFullness / 2);
        // Number of points to decrease fullness by every turn.
        this._fullnessDepletionRate = template['fullnessDepletionRate'] || 1;
    },
    addTurnHunger: function() {
        // Remove the standard depletion points
        this.modifyFullnessBy(-this._fullnessDepletionRate);
    },
    modifyFullnessBy: function(points) {
        this._fullness = this._fullness + points;
        if (this._fullness <= 0) {
            this.kill('You have died of starvation!');
        } else if (this._fullness > this._maxFullness) {
            this.kill('You choke and die!');
        }
    },
    getHungerState: function() {
        let perPercent = this._maxFullness / 100;
        if (this._fullness <= perPercent * 5) {
            return 'Starvation';
        } else if (this._fullness <= perPercent * 25) {
            return 'Hungry';
        } else if (this._fullness >= perPercent * 75) {
            return 'Full';
        } else if (this._fullness >= perPercent * 95) {
            return 'Overeat';
        } else {
            return 'Not Hungry';
        }
    }
};

Game.EntityMixins.CorpseDropper = {
    name: 'CorpseDropper',
    init: function(template) {
        // Chance to drop a corpse
        this._corpseDropRate = template['corpseDropRate'] || 100;
    },
    tryDropCorpse: function() {
        if (Math.round(Math.random() * 100) < this._corpseDropRate) {
            // Create a new corpse item and drop it.
            this._map.addItem(this.getX(), this.getY(), this.getZ(),
                Game.ItemRepository.create('corpse', {
                    name: this._name + ' corpse',
                    foreground: this._foreground
                }));
        }
    }
};

Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function(template) {
        this._weapon = null;
        this._armor = null;
    },
    wield: function(item) {
        this._weapon = item;
    },
    unwield: function() {
        this._weapon = null;
    },
    wear: function(item) {
        this._armor = item;
    },
    takeOff: function() {
        this._armor = null;
    },
    getWeapon: function() {
        return this._weapon;
    },
    getArmor: function() {
        return this._armor;
    },
    unequip: function(item) {
        // Helper function to be called before getting rid of an item.
        if (this._weapon === item) {
            this.unwield();
        }
        if (this._armor === item) {
            this.takeOff();
        }
    }
};