Game.Entity = function(properties) {
    properties = properties || {};
    // Call the glyph's constructor
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
    this._x = properties['x'] || 0;
    this._y = properties['y'] || 0;
    this._attachedMixins = {};
    let mixins = properties['mixins'] || [];
    for (let i = 0; i < mixins.length; i++) {
        for (let key in mixins[i]) {
            if (key !== 'init' && key !== 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        this._attachedMixins[mixins[i].name] = true;
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};
Game.Entity.extend(Game.Glyph);
Game.Entity.prototype.hasMixin = function(obj) {
    // Allow passing the mixin itself or the name as a string
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[name];
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
Game.Entity.prototype.getName = function() {
    return this._name;
};
Game.Entity.prototype.getX = function() {
    return this._x;
};
Game.Entity.prototype.getY   = function() {
    return this._y;
};
