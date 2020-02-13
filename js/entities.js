// Create Mixins namespace
Game.Mixins = {};

// Define Moveable mixin
Game.Mixins.Moveable = {
    name: 'Moveable',
    tryMove: function (x, y, map) {
        let tile = map.getTile(x, y);
        let target = map.getEntityAt(x, y);
        // Check if can walk on the tile and if so simply walk into it
        if (target) {
            if (this.hasMixin('Attacker')) {
                this.attack.target;
                return true;
            } else {
                return false;
            }
        } else if (tile.isWalkable()) {
            // Update the object's position
            this._x = x;
            this._y = y;
            return true;
            // Check if the tile is diggable, and
            // if so try to dig it
        } else if (tile.isDiggable()) {
            map.dig(x, y);
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
        // Re-render screen
        Game.refresh();
        this.getMap().getEngine().lock();
    }
};

Game.Mixins.FungusActor = {
    name: 'FungusActor',
    group: 'Actor',
    init: function () {
        this._growthsRemaining = 5;
    },
    act: function () {
        if (this._growthsRemaining > 0) {
            if (Math.random() <= 0.02) {
                let xOffset = Math.floor(Math.random() * 3) - 1;
                let yOffset = Math.floor(Math.random() * 3) - 1;
                if (xOffset !== 0 || yOffset !== 0) {
                    if (this.getMap().isEmptyFloor(this.getX() + xOffset, this.getY() + yOffset)) {
                        let entity = new Game.Entity(Game.FungusTemplate);
                        entity.setX(this.getX() + xOffset);
                        entity.setY(this.getY() + yOffset);
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                    }
                }
            }
        }
    }
};

Game.Mixins.SimpleAttacker = {
    name: "SimpleAttacker",
    groupName: "Attacker",
    attack: function (target) {
        // Only remove the entity if they were attackable
        if (target.hasMixin('Destructible')) {
            target.takeDamage(this, 1);
        }
    }
};

// This mixin signifies an entity can take damage and be destroyed
Game.Mixins.Destructible = {
    name: "Destructible",
    init: function () {
        this._hp = 1;
    },
    takeDamage: function (attacker, damage) {
        this._hp -= damage;
        // if hp <= 0,remove from the map
        if (this._hp <= 0) {
            this.getMap().removeEntity(this);
        }
    }
};

Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    background: 'black',
    mixins: [Game.Mixins.Moveable, Game.Mixins.PlayerActor, Game.Mixins.SimpleAttacker, Game.Mixins.Destructible]
};

Game.FungusTemplate = {
    character: 'F',
    foreground: 'green',
    mixins: [Game.Mixins.Moveable, Game.Mixins.FungusActor, Game.Mixins.SimpleAttacker, Game.Mixins.Destructible]
};