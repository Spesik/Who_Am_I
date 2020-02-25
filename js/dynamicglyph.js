Game.DynamicGlyph = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
    this._attachedMixins = {};
    this._attachedMixinGroups = {};
    this._listeners = {};
    let mixins = properties['mixins'] || [];
    for (let i = 0; i < mixins.length; i++) {
        for (let key in mixins[i]) {
            if (
                key !== 'init' &&
                key !== 'name' &&
                key !== 'listeners' &&
                !this.hasOwnProperty(key)
            ) {
                this[key] = mixins[i][key];
            }
        }
        this._attachedMixins[mixins[i].name] = true;
        if (mixins[i].groupName) {
            this._attachedMixinGroups[mixins[i].groupName] = true;
        }
        // Add all of our listeners
        if (mixins[i].listeners) {
            for (let key in mixins[i].listeners) {
                // If we don't already have a key for this event in our listeners
                // array, add it.
                if (!this._listeners[key]) {
                    this._listeners[key] = [];
                }
                // Add the listener.
                this._listeners[key].push(mixins[i].listeners[key]);
            }
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
Game.DynamicGlyph.prototype.raiseEvent = function(event) {
    // Make sure we have at least one listener, or else exit
    if (!this._listeners[event]) {
        return;
    }
    // Extract any arguments passed, removing the event name
    let args = Array.prototype.slice.call(arguments, 1);
    // Invoke each listener, with this entity as the context and the arguments
    for (let i = 0; i < this._listeners[event].length; i++) {
        this._listeners[event][i].apply(this, args);
    }
};
