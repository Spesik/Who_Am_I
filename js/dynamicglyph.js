Game.DynamicGlyph = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
    this._attachedMixins = {};
    this._attachedMixinGroups = {};
    let mixins = properties['mixins'] || [];
    for (let i = 0; i < mixins.length; i++) {
        for (let key in mixins[i]) {
            if (key != 'init' && key != 'name' && !this.hasOwnProperty(key)) {
                this[key] = mixins[i][key];
            }
        }
        this._attachedMixins[mixins[i].name] = true;
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        if (mixins[i].init) {
            mixins[i].init.call(this, properties);
        }
    }
};
Game.DynamicGlyph.extend(Game.Glyph);

Game.DynamicGlyph.prototype.hasMixin = function(obj) {
    if (typeof obj === 'object') {
        return this._attachedMixins[obj.name];
    } else {
        return this._attachedMixins[obj] || this._attachedMixinGroups[obj];
    }
};

Game.DynamicGlyph.prototype.setName = function(name) {
    this._name = name;
};

Game.DynamicGlyph.prototype.getName = function() {
    return this._name;
};

Game.DynamicGlyph.prototype.describe = function() {
    return this._name;
};
Game.DynamicGlyph.prototype.describeA = function(capitalize) {
    let prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    let string = this.describe();
    let firstLetter = string.charAt(0).toLowerCase();
    let prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;

    return prefixes[prefix] + ' ' + string;
};
Game.DynamicGlyph.prototype.describeThe = function(capitalize) {
    let prefix = capitalize ? 'The' : 'the';
    return prefix + ' ' + this.describe();
};
