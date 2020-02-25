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

Game.EntityMixins.TaskActor = {
    name: 'TaskActor',
    groupName: 'Actor',
    init: function (template) {
        // Load tasks
        this._tasks = template['tasks'] || ['wander'];
    },
    act: function () {
        // Iterate through all our tasks
        for (let i = 0; i < this._tasks.length; i++) {
            if (this.canDoTask(this._tasks[i])) {
                // If we can perform the task, execute the function for it.
                this[this._tasks[i]]();
                return;
            }
        }
    },
    canDoTask: function (task) {
        if (task === 'hunt') {
            return this.hasMixin('Sight') && this.canSee(this.getMap().getPlayer());
        } else if (task === 'wander') {
            return true;
        } else {
            throw new Error('Tried to perform undefined task ' + task);
        }
    },
    hunt: function () {
        let player = this.getMap().getPlayer();

        // If we are adjacent to the player, then attack instead of hunting.
        let offsets = Math.abs(player.getX() - this.getX()) +
            Math.abs(player.getY() - this.getY());
        if (offsets === 1) {
            if (this.hasMixin('Attacker')) {
                this.attack(player);
                return;
            }
        }

        // Generate the path and move to the first tile.
        let source = this;
        let z = source.getZ();
        let path = new ROT.Path.AStar(player.getX(), player.getY(), function (x, y) {
            // If an entity is present at the tile, can't move there.
            let entity = source.getMap().getEntityAt(x, y, z);
            if (entity && entity !== player && entity !== source) {
                return false;
            }
            return source.getMap().getTile(x, y, z).isWalkable();
        }, {topology: 4});
        let count = 0;
        path.compute(source.getX(), source.getY(), function (x, y) {
            if (count === 1) {
                source.tryMove(x, y, z);
            }
            count++;
        });
    },
    wander: function () {
        let moveOffset = (Math.round(Math.random()) === 1) ? 1 : -1;
        if (Math.round(Math.random()) === 1) {
            this.tryMove(this.getX() + moveOffset, this.getY(), this.getZ());
        } else {
            this.tryMove(this.getX(), this.getY() + moveOffset, this.getZ());
        }
    }
};

Game.EntityMixins.GiantZombieActor = Game.extend(Game.EntityMixins.TaskActor, {
    init: function (template) {
        // Call the task actor init with the right tasks.
        Game.EntityMixins.TaskActor.init.call(this, Game.extend(template, {
            'tasks': ['growArm', 'spawnSkeletons', 'hunt', 'wander']
        }));
        this._hasGrownArm = false;
    },
    canDoTask: function (task) {
        // If we haven't already grown arm and HP <= 20, then we can grow.
        if (task === 'growArm') {
            return this.getHp() <= 20 && !this._hasGrownArm;
            // Spawn a skeleton only a 10% of turns.
        } else if (task === 'spawnSkeletons') {
            return Math.round(Math.random() * 100) <= 10;
            // Call parent canDoTask
        } else {
            return Game.EntityMixins.TaskActor.canDoTask.call(this, task);
        }
    },
    growArm: function () {
        this._hasGrownArm = true;
        this.increaseAttackValue(5);
        // Send a message saying the zombie grew an arm.
        Game.sendMessageNearby(this.getMap(),
            this.getX(), this.getY(), this.getZ(),
            'An extra arm appears on the giant zombie!');
    },
    spawnSkeletons: function () {
        // Generate a random position nearby.
        let xOffset = Math.floor(Math.random() * 3) - 1;
        let yOffset = Math.floor(Math.random() * 3) - 1;
        if (!this.getMap().isEmptyFloor(this.getX() + xOffset, this.getY() + yOffset,
            this.getZ())) {
            return;
        }
        // Create the entity
        let skeleton = Game.EntityRepository.create('skeleton');
        skeleton.setX(this.getX() + xOffset);
        skeleton.setY(this.getY() + yOffset);
        skeleton.setZ(this.getZ());
        this.getMap().addEntity(skeleton);
    },
    listeners: {
        onDeath: function (attacker) {
            // Switch to win screen when killed!
            Game.switchScreen(Game.Screen.winScreen);
        }
    }
});

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
    increaseAttackValue: function (value) {
        value = value || 2;
        this._attackValue += 2;
        Game.sendMessage(this, 'You look stronger!')
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
    setHp: function (hp) {
        this._hp = hp;
    },
    increaseDefenseValue: function (value) {
        value = value || 2;
        // Add to the defense value.
        this._defenseValue += 2;
        Game.sendMessage(this, "You look tougher!");
    },
    increaseMaxHp: function (value) {
        value = value || 10;
        // Add to both max HP and HP.
        this._maxHp += 10;
        this._hp += 10;
        Game.sendMessage(this, "You look healthier!");
    },
    takeDamage: function (attacker, damage) {
        this._hp -= damage;
        // if hp <= 0,remove from the map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            this.raiseEvent('onDeath', attacker);
            attacker.raiseEvent('onKill', this);
            this.kill();
        }
    },
    listeners: {
        onGainLevel: function () {
            // Heal the entity.
            this.setHp(this.getMaxHp());
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
    },
    increaseSightRadius: function (value) {
        value = value || 1;
        // Add to sight radius.
        this._sightRadius += 1;
        Game.sendMessage(this, "You are more aware of your surroundings!");
    },
    canSee: function (entity) {
        // If not on the same map or on different floors, then exit early
        if (!entity || this._map !== entity.getMap() || this._z !== entity.getZ()) {
            return false;
        }

        let otherX = entity.getX();
        let otherY = entity.getY();

        // If we're not in a square field of view, then we won't be in a real
        // field of view either.
        if ((otherX - this._x) * (otherX - this._x) +
            (otherY - this._y) * (otherY - this._y) >
            this._sightRadius * this._sightRadius) {
            return false;
        }

        // Compute the FOV and check if the coordinates are in there.
        let found = false;
        this.getMap().getFov(this.getZ()).compute(
            this.getX(), this.getY(),
            this.getSightRadius(),
            function (x, y, radius, visibility) {
                if (x === otherX && y === otherY) {
                    found = true;
                }
            });
        return found;
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
    init: function (template) {
        // Default to 10 inventory slots.
        let inventorySlots = template['inventorySlots'] || 10;
        // Set up an empty inventory.
        this._items = new Array(inventorySlots);
    },
    getItems: function () {
        return this._items;
    },
    getItem: function (i) {
        return this._items[i];
    },
    addItem: function (item) {
        // Try to find a slot, returning true only if we could add the item.
        for (let i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                this._items[i] = item;
                return true;
            }
        }
        return false;
    },
    removeItem: function (i) {
        if (this._items[i] && this.hasMixin(Game.EntityMixins.Equipper)) {
            this.unequip(this._items[i]);
        }
        // Simply clear the inventory slot.
        this._items[i] = null;
    },
    canAddItem: function () {
        // Check if we have an empty slot.
        for (let i = 0; i < this._items.length; i++) {
            if (!this._items[i]) {
                return true;
            }
        }
        return false;
    },
    pickupItems: function (indices) {
        // Allows the user to pick up items from the map, where indices is
        // the indices for the array returned by map.getItemsAt
        let mapItems = this._map.getItemsAt(this.getX(), this.getY(), this.getZ());
        let added = 0;
        // Iterate through all indices.
        for (let i = 0; i < indices.length; i++) {
            // Try to add the item. If our inventory is not full, then splice the
            // item out of the list of items. In order to fetch the right item, we
            // have to offset the number of items already added.
            if (this.addItem(mapItems[indices[i] - added])) {
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
    dropItem: function (i) {
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
    init: function (template) {
        this._maxFullness = template['maxFullness'] || 1000;
        // Start halfway to max fullness if no default value
        this._fullness = template['fullness'] || (this._maxFullness / 2);
        // Number of points to decrease fullness by every turn.
        this._fullnessDepletionRate = template['fullnessDepletionRate'] || 1;
    },
    addTurnHunger: function () {
        // Remove the standard depletion points
        this.modifyFullnessBy(-this._fullnessDepletionRate);
    },
    modifyFullnessBy: function (points) {
        this._fullness = this._fullness + points;
        if (this._fullness <= 0) {
            this.kill('You have died of starvation!');
        } else if (this._fullness > this._maxFullness) {
            this.kill('You choke and die!');
        }
    },
    getHungerState: function () {
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
    init: function (template) {
        // Chance to drop a corpse
        this._corpseDropRate = template['corpseDropRate'] || 100;
    },
    listeners: {
        onDeath: function (attacker) {
            // Check if we should drop a corpse.
            if (Math.round(Math.random() * 100) <= this._corpseDropRate) {
                // Create a new corpse item and drop it.
                this._map.addItem(this.getX(), this.getY(), this.getZ(),
                    Game.ItemRepository.create('corpse', {
                        name: this._name + ' corpse',
                        foreground: this._foreground
                    }));
            }
        }
    }
};

Game.EntityMixins.Equipper = {
    name: 'Equipper',
    init: function (template) {
        this._weapon = null;
        this._armor = null;
    },
    wield: function (item) {
        this._weapon = item;
    },
    unwield: function () {
        this._weapon = null;
    },
    wear: function (item) {
        this._armor = item;
    },
    takeOff: function () {
        this._armor = null;
    },
    getWeapon: function () {
        return this._weapon;
    },
    getArmor: function () {
        return this._armor;
    },
    unequip: function (item) {
        // Helper function to be called before getting rid of an item.
        if (this._weapon === item) {
            this.unwield();
        }
        if (this._armor === item) {
            this.takeOff();
        }
    }
};

Game.EntityMixins.ExperienceGainer = {
    name: 'ExperienceGainer',
    init: function (template) {
        this._level = template['level'] || 1;
        this._experience = template['experience'] || 0;
        this._statPointsPerLevel = template['statPointsPerLevel'] || 1;
        this._statPoints = 0;
        // Determine what stats can be levelled up.
        this._statOptions = [];
        if (this.hasMixin('Attacker')) {
            this._statOptions.push(['Increase attack value', this.increaseAttackValue]);
        }
        if (this.hasMixin('Destructible')) {
            this._statOptions.push(['Increase defense value', this.increaseDefenseValue]);
            this._statOptions.push(['Increase max health', this.increaseMaxHp]);
        }
        if (this.hasMixin('Sight')) {
            this._statOptions.push(['Increase sight range', this.increaseSightRadius]);
        }
    },
    getLevel: function () {
        return this._level;
    },
    getExperience: function () {
        return this._experience;
    },
    getNextLevelExperience: function () {
        return (this._level * this._level) * 10;
    },
    getStatPoints: function () {
        return this._statPoints;
    },
    setStatPoints: function (statPoints) {
        this._statPoints = statPoints;
    },
    getStatOptions: function () {
        return this._statOptions;
    },
    giveExperience: function (points) {
        let statPointsGained = 0;
        let levelsGained = 0;
        // Loop until we've allocated all points.
        while (points > 0) {
            // Check if adding in the points will surpass the level threshold.
            if (this._experience + points >= this.getNextLevelExperience()) {
                // Fill our experience till the next threshold.
                let usedPoints = this.getNextLevelExperience() - this._experience;
                points -= usedPoints;
                this._experience += usedPoints;
                // Level up our entity!
                this._level++;
                levelsGained++;
                this._statPoints += this._statPointsPerLevel;
                statPointsGained += this._statPointsPerLevel;
            } else {
                // Simple case - just give the experience.
                this._experience += points;
                points = 0;
            }
        }
        // Check if we gained at least one level.
        if (levelsGained > 0) {
            Game.sendMessage(this, "You advance to level %d.", [this._level]);
            this.raiseEvent('onGainLevel');
        }
    },
    listeners: {
        onKill: function (victim) {
            let exp = victim.getMaxHp() + victim.getDefenseValue();
            if (victim.hasMixin('Attacker')) {
                exp += victim.getAttackValue();
            }
            // Account for level differences
            if (victim.hasMixin('ExperienceGainer')) {
                exp -= (this.getLevel() - victim.getLevel()) * 3;
            }
            // Only give experience if more than 0.
            if (exp > 0) {
                this.giveExperience(exp);
            }
        }
    }
};

Game.EntityMixins.RandomStatGainer = {
    name: 'RandomStatGainer',
    groupName: 'StatGainer',
    listeners: {
        onGainLevel: function () {
            let statOptions = this.getStatOptions();
            // Randomly select a stat option and execute the callback for each
            // stat point.
            while (this.getStatPoints() > 0) {
                // Call the stat increasing function with this as the context.
                statOptions.random()[1].call(this);
                this.setStatPoints(this.getStatPoints() - 1);
            }
        }
    }
};

Game.EntityMixins.PlayerStatGainer = {
    name: 'PlayerStatGainer',
    groupName: 'StatGainer',
    listeners: {
        onGainLevel: function () {
            // Setup the gain stat screen and show it.
            Game.Screen.gainStatScreen.setup(this);
            Game.Screen.playScreen.setSubScreen(Game.Screen.gainStatScreen);
        }
    }
};