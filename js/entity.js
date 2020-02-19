Game.Entity = function(properties) {
    properties = properties || {};
    // Call the glyph's constructor
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._z = properties['z'] || 0;
    this._map = null;
    this._attachedMixins = {};
    this._attachedMixinsGroups = {};
    let mixins = properties['mixins'] || [];
    for (let i = 0; i < mixins.length; i++) {
        for (let key in mixins[i]) {
            if (key !== 'init' && key !== 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        this._attachedMixins[mixins[i].name] = true;
        if (mixins[i].groupName) {
            this._attachedMixinsGroups[mixins[i].groupName] = true;
        }
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};
Game.Entity.extend(Game.Glyph);
Game.Entity.prototype.hasMixin = function(obj) {
    // Allow passing the mixin itself or the name / group name as a string
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[obj] || this._attachedMixinsGroups[obj];
    }
};
Game.Entity.prototype.setName = function(name) {
    this._name = name;
};
Game.Entity.prototype.setX = function(x) {
    this._x = x;
};
Game.Entity.prototype.setY = function(y) {
    this._y = y;
};
Game.Entity.prototype.setZ = function(z) {
    this._z = z;
};
Game.Entity.prototype.setMap = function(map) {
    this._map = map;
};
Game.Entity.prototype.setPosition = function(x, y, z) {
    let oldX = this._x;
    let oldY = this._y;
    let oldZ = this._z;
    this._x = x;
    this._y = y;
    this._z = z;

    if (this._map) {
        this._map.updateEntityPosition(this, oldX, oldY, oldZ);
    }
};
Game.Entity.prototype.getName = function() {
    return this._name;
};
Game.Entity.prototype.getX = function() {
    return this._x;
};
Game.Entity.prototype.getY = function() {
    return this._y;
};
Game.Entity.prototype.getZ = function() {
    return this._z;
};
Game.Entity.prototype.getMap = function() {
    return this._map;
};

Game.Entity.prototype.tryMove = function(x, y, z, map) {
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
    } else if (target) {
        if (this.hasMixin('Attacker') &&
            (this.hasMixin(Game.Mixins.PlayerActor) ||
                target.hasMixin(Game.Mixins.PlayerActor))) {
            this.attack(target);
            return true;
        }
        return false;
    } else if (tile.walkable()) {
        this.setPosition(x, y, z);
        // Notify the entity that there are items at this position
        let items = this.getMap().getItemsAt(x, y, z);
        if (items) {
            if (items.length === 1) {
                Game.sendMessage(this, "You see %s.", [items[0].describeA()]);
            } else {
                Game.sendMessage(this, "There are several objects here.");
            }
        }
        return true;
    } else if (tile.diggable()) {
        if (this.hasMixin(Game.Mixins.PlayerActor)) {
            map.dig(x, y, z);
            return true;
        }
        return false;
    }
    return false;
};
