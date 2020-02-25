Game.Map.BossCavern = function() {
    // Call the Map constructor
    Game.Map.call(this, this._generateTiles(80, 24));
    // Create the giant zombie
    this.addEntityAtRandomPosition(Game.EntityRepository.create('giant zombie'), 0);
};
Game.Map.BossCavern.extend(Game.Map);

Game.Map.BossCavern.prototype._fillCircle = function(tiles, centerX, centerY, radius, tile) {
    let x = radius;
    let y = 0;
    let xChange = 1 - (radius << 1);
    let yChange = 0;
    let radiusError = 0;

    while (x >= y) {
        for (let i = centerX - x; i <= centerX + x; i++) {
            tiles[i][centerY + y] = tile;
            tiles[i][centerY - y] = tile;
        }
        for (let i = centerX - y; i <= centerX + y; i++) {
            tiles[i][centerY + x] = tile;
            tiles[i][centerY - x] = tile;
        }

        y++;
        radiusError += yChange;
        yChange += 2;
        if (((radiusError << 1) + xChange) > 0) {
            x--;
            radiusError += xChange;
            xChange += 2;
        }
    }
};

Game.Map.BossCavern.prototype._generateTiles = function(width, height) {
    let tiles = new Array(width);
    for (let x = 0; x < width; x++) {
        tiles[x] = new Array(height);
        for (let y = 0; y < height; y++) {
            tiles[x][y] = Game.Tile.wallTile;
        }
    }
    let radius = (Math.min(width, height) - 2) / 2;
    this._fillCircle(tiles, width / 2, height / 2, radius, Game.Tile.floorTile);

    let lakes = Math.round(Math.random() * 3) + 3;
    let maxRadius = 2;
    for (let i = 0; i < lakes; i++) {
        let centerX = Math.floor(Math.random() * (width - (maxRadius * 2)));
        let centerY = Math.floor(Math.random() * (height - (maxRadius * 2)));
        centerX += maxRadius;
        centerY += maxRadius;
        let radius = Math.floor(Math.random() * maxRadius) + 1;
        this._fillCircle(tiles, centerX, centerY, radius, Game.Tile.waterTile);
    }

    return [tiles];
};

Game.Map.BossCavern.prototype.addEntity = function(entity) {
    Game.Map.prototype.addEntity.call(this, entity);
    // If it's a player, place at random position
    if (this.getPlayer() === entity) {
        let position = this.getRandomFloorPosition(0);
        entity.setPosition(position.x, position.y, 0);
        this.getEngine().start();
    }
};