// Create Mixins namespace
Game.Mixins = {};

// Define Moveable mixin
Game.Mixins.Moveable = {
    name: 'Moveable',
    tryMove: function (x, y, z, map) {
        map = this.getMap();
        let tile = map.getTile(x, y, this.getZ());
        let target = map.getEntityAt(x, y, this.getZ());
        if (z < this.getZ()) {
            if (tile !== Game.Tile.stairsUpTile) {
                Game.sendMessage(this, "You can't go up here!");
            } else {
                Game.sendMessage(this, "You ascend to level %d!", [z + 1]);
                this.setPosition(x, y, z);
            }
        } else if (z > this.getZ()) {
            if (tile !== Game.Tile.stairsDownTile) {
                Game.sendMessage(this, "You can't go down here!");
            } else {
                this.setPosition(x, y, z);
                Game.sendMessage(this, "You descend to level %d!", [z + 1]);
            }
            // Check if can walk on the tile and if so simply walk into it
        } else if (target) {
            if (this.hasMixin('Attacker')) {
                this.attack(target);
                return true;
            } else {
                return false;
            }
        } else if (tile.walkable()) {
            // Update the object's position
            this.setPosition(x, y, z);
            return true;
            // Check if the tile is diggable, and
            // if so try to dig it
        } else if (tile.diggable()) {
            map.dig(x, y, z);
            return true;
        }
        return false;
    }
};

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
                        let entity = new Game.Entity(Game.FungusTemplate);
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

Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 10,
    mixins: [
        Game.Mixins.PlayerActor,
        Game.Mixins.Attacker,
        Game.Mixins.Destructible,
        Game.Mixins.Sight,
        Game.Mixins.MessageRecipient
    ]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    mixins: [
        Game.Mixins.FungusActor,
        Game.Mixins.Destructible
    ]
});

Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'B',
    foreground: 'magenta',
    maxHp: 5,
    attackValue: 4,
    mixins: [Game.Mixins.WanderActor,
        Game.Mixins.Attacker, Game.Mixins.Destructible]
});

Game.EntityRepository.define('snake', {
    name: 'snake',
    character: 's',
    foreground: 'chartreuse',
    maxHp: 3,
    attackValue: 2,
    mixins: [Game.Mixins.WanderActor,
        Game.Mixins.Attacker, Game.Mixins.Destructible]
});