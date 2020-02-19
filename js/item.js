Game.Item = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
};
Game.Item.extend(Game.Glyph);

Game.Item.prototype.describe = function() {
    return this._name;
};
Game.Item.prototype.describeA = function(capitalize) {
    let prefixes = capitalize ? ['A', 'An'] : ['a', 'an'];
    let string = this.describe();
    let firstLetter = string.charAt(0).toLowerCase();
    let prefix = 'aeiou'.indexOf(firstLetter) >= 0 ? 1 : 0;
    return prefixes[prefix] + ' ' + string;
};
