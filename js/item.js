Game.Item = function(properties) {
    properties = properties || {};
    Game.DynamicGlyph.call(this, properties);
};
Game.Item.extend(Game.DynamicGlyph);