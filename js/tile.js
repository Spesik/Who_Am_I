Game.Tile = function(properties) {
    properties = properties || {};
    Game.Glyph.call(this, properties);
    this._isWalkable = properties['isWalkable'] || false;
    this._isDiggable = properties['isDiggable'] || false;
};
Game.Tile.extend(Game.Glyph);

Game.Tile.prototype.isWalkable = function() {
    return this._isWalkable;
};
Game.Tile.prototype.isDiggable = function() {
    return this._isDiggable;
};

Game.Tile.nullTile = new Game.Tile({});
Game.Tile.floorTile = new Game.Tile({
    character: '.',
    isWalkable: true
});
Game.Tile.wallTile = new Game.Tile({
    character: '#',
    foreground: 'goldenrod',
    isDiggable: true
});
Game.Tile.stairsUpTile = new Game.Tile({
    character: '<',
    foreground: 'white',
    isWalkable: true
});
Game.Tile.stairsDownTile = new Game.Tile({
    character: '>',
    foreground: 'white',
    isWalkable: true
});

// Helper function
Game.getNeighborPositions = function(x, y) {
    let tiles = [];
    // Generate all possible offsets
    for (let dX = -1; dX < 2; dX ++) {
        for (let dY = -1; dY < 2; dY++) {
            // Make sure it isn't the same tile
            if (dX === 0 && dY === 0) {
                continue;
            }
            tiles.push({x: x + dX, y: y + dY});
        }
    }
    return tiles.randomize();
};
