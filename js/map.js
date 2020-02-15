Game.Map = function (tiles, player) {
    this._tiles = tiles;
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    this._fov = [];
    this.setupFov();
    this._entities = [];
    this._scheduler = new ROT.Scheduler.Simple();
    this._engine = new ROT.Engine(this._scheduler);
    this.addEntityAtRandomPosition(player, 0);
    for (let z = 0; z < this._depth; z++) {
        for (let i = 0; i < 25; i++) {
            this.addEntityAtRandomPosition(new Game.Entity(Game.FungusTemplate), z);
        }
    }
    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

Game.Map.prototype._setupExploredArray = function() {
    for (let z = 0; z < this._depth; z++) {
        this._explored[z] = new Array(this._width);
        for (let x = 0; x < this._width; x++) {
            this._explored[z][x] = new Array(this._height);
            for (let y = 0; y < this._height; y++) {
                this._explored[z][x][y] = false;
            }
        }
    }
};

// Standard getters
Game.Map.prototype.getDepth = function() {
    return this._depth;
};
Game.Map.prototype.getWidth = function() {
    return this._width;
};
Game.Map.prototype.getHeight = function() {
    return this._height;
};

Game.Map.prototype.getTile = function(x, y, z) {
    if (x < 0 || x >= this._width ||
        y < 0 || y >= this._height ||
        z < 0 || z >= this._depth) {
        return Game.Tile.nullTile;
    } else {
        return this._tiles[z][x][y] || Game.Tile.nullTile;
    }
};

Game.Map.prototype.dig = function (x, y, z) {
    if (this.getTile(x, y, z)) {
        this._tiles[z][x][y] = Game.Tile.floorTile;
    }
};

Game.Map.prototype.isEmptyFloor = function(x, y, z) {
    //check if the tile is empty
    return this.getTile(x, y, z) === Game.Tile.floorTile && !this.getEntityAt(x, y, z)
};

Game.Map.prototype.setExplored = function(x, y, z, state) {
    // Only update if the tile is within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        this._explored[z][x][y] = state;
    }
};

Game.Map.prototype.isExplored = function(x, y, z) {
    // Only return the value if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
};

Game.Map.prototype.getRandomFloorPosition = function() {
    let x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._width);
    } while (!this.isEmptyFloor(x, y, z));
    return {x: x, y: y};
};

Game.Map.prototype.setupFov = function() {
    let map = this;
    for (let z = 0; z < this._depth; z++) {
        (function() {
            let depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function(x, y) {
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, {topology: 4}));
        })();
    }
};

Game.Map.prototype.getFov = function(depth) {
    return this._fov[depth];
};

Game.Map.prototype.getEngine = function() {
    return this._engine;
};

Game.Map.prototype.getEntities = function() {
    return this._entities;
};

Game.Map.prototype.getEntityAt = function(x, y, z) {
    for (let i = 0; i < this._entities.length; i++) {
        if (this._entities[i].getX() === x &&
            this._entities[i].getY() === y &&
            this._entities[i].getZ() === z ) {
            return this._entities[i];
        }
    }
    return false;
};

Game.Map.prototype.getEntitiesWithinRadius = function(centerX, centerY, centerZ, radius) {
    let results = [];
    // Determine bounds
    let leftX = centerX - radius;
    let rightX = centerX + radius;
    let topY = centerY - radius;
    let bottomY = centerY + radius;
    // Iterate through entities, adding any which are within the bounds
    for (let i = 0; i < this._entities.length; i++) {
        if (this._entities[i].getX() >= leftX &&
            this._entities[i].getX() <= rightX &&
            this._entities[i].getY() >= topY &&
            this._entities[i].getY() <= bottomY &&
            this._entities[i].getZ() === centerZ) {
            results.push(this._entities[i])
        }
    }
    return results;
};

Game.Map.prototype.addEntity = function(entity) {
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error('Adding entity out of bounds.');
    }
    // Update the entity's map
    entity.setMap(this);
    this._entities.push(entity);
    if (entity.hasMixin('Actor')) {
        this._scheduler.add(entity, true);
    }
};

Game.Map.prototype.getRandomFloorPosition = function(z) {
    // Randomly generate a tile which is a floor
    let x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while(!this.isEmptyFloor(x, y, z));
    return {x: x, y: y, z: z};
};

Game.Map.prototype.addEntityAtRandomPosition = function(entity, z) {
    let position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
};

Game.Map.prototype.removeEntity = function(entity) {
    // find the entity in the list of entities if it is present
    for (let i = 0; i < this._entities.length; i++) {
        if (this._entities[i] === entity) {
            this._entities.splice(i, 1);
            break;
        }
    }

    // if the entity is an actor, remove them from the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.remove(entity)
    }
};