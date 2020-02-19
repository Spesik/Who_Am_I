Game.Item = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);
    this._name = properties['name'] || '';
};
Game.Item.extend(Game.Glyph);
