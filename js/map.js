Game.Map = function (tiles, player) {
    this._tiles = tiles;
    this._depth = tiles.length;
    this._width = tiles[0].length;
    this._height = tiles[0][0].length;
    this._fov = [];
    this.setupFov();
    this._entities = {};
    this._items = {};
    this._scheduler = new ROT.Scheduler.Simple();
    this._engine = new ROT.Engine(this._scheduler);
    this.addEntityAtRandomPosition(player, 0);
    for (let z = 0; z < this._depth; z++) {
        for (let i = 0; i < 15; i++) {
            this.addEntityAtRandomPosition(Game.EntityRepository.createRandom(), z);
        }
        for (let i = 0; i < 15; i++) {
            this.addItemAtRandomPosition(Game.ItemRepository.createRandom(), z);
        }
    }
// Add weapons and armor to the map in random positions and floors
    let templates = ['dagger', 'sword', 'staff',
        'tunic', 'chainmail', 'platemail'];
    for (let i = 0; i < templates.length; i++) {
        this.addItemAtRandomPosition(Game.ItemRepository.create(templates[i]),
            Math.floor(this._depth * Math.random()));
    }
    this._explored = new Array(this._depth);
    this._setupExploredArray();
};

Game.Map.prototype._setupExploredArray = function () {
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
Game.Map.prototype.getDepth = function () {
    return this._depth;
};
Game.Map.prototype.getWidth = function () {
    return this._width;
};
Game.Map.prototype.getHeight = function () {
    return this._height;
};

Game.Map.prototype.getTile = function (x, y, z) {
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

Game.Map.prototype.isEmptyFloor = function (x, y, z) {
    //check if the tile is empty
    return this.getTile(x, y, z) === Game.Tile.floorTile && !this.getEntityAt(x, y, z)
};

Game.Map.prototype.setExplored = function (x, y, z, state) {
    // Only update if the tile is within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        this._explored[z][x][y] = state;
    }
};

Game.Map.prototype.isExplored = function (x, y, z) {
    // Only return the value if within bounds
    if (this.getTile(x, y, z) !== Game.Tile.nullTile) {
        return this._explored[z][x][y];
    } else {
        return false;
    }
};

Game.Map.prototype.getRandomFloorPosition = function () {
    let x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._width);
    } while (!this.isEmptyFloor(x, y, z));
    return {x: x, y: y};
};

Game.Map.prototype.setupFov = function () {
    let map = this;
    for (let z = 0; z < this._depth; z++) {
        (function () {
            let depth = z;
            map._fov.push(
                new ROT.FOV.DiscreteShadowcasting(function (x, y) {
                    return !map.getTile(x, y, depth).isBlockingLight();
                }, {topology: 4}));
        })();
    }
};

Game.Map.prototype.getFov = function (depth) {
    return this._fov[depth];
};

Game.Map.prototype.getEngine = function () {
    return this._engine;
};

Game.Map.prototype.getEntities = function () {
    return this._entities;
};

Game.Map.prototype.getEntityAt = function (x, y, z) {
    return this._entities[x + ',' + y + ',' + z];
};

Game.Map.prototype.getEntitiesWithinRadius = function (centerX, centerY, centerZ, radius) {
    let results = [];
    // Determine bounds
    let leftX = centerX - radius;
    let rightX = centerX + radius;
    let topY = centerY - radius;
    let bottomY = centerY + radius;
    // Iterate through entities, adding any which are within the bounds
    for (let key in this._entities) {
        let entity = this._entities[key];
        if (entity.getX() >= leftX && entity.getX() <= rightX &&
            entity.getY() >= topY && entity.getY() <= bottomY &&
            entity.getZ() === centerZ) {
            results.push(entity);
        }
    }
    return results;
};

Game.Map.prototype.getRandomFloorPosition = function (z) {
    // Randomly generate a tile which is a floor
    let x, y;
    do {
        x = Math.floor(Math.random() * this._width);
        y = Math.floor(Math.random() * this._height);
    } while (!this.isEmptyFloor(x, y, z));
    return {x: x, y: y, z: z};
};

Game.Map.prototype.addEntityAtRandomPosition = function (entity, z) {
    let position = this.getRandomFloorPosition(z);
    entity.setX(position.x);
    entity.setY(position.y);
    entity.setZ(position.z);
    this.addEntity(entity);
};

Game.Map.prototype.addEntity = function (entity) {
    // Update the entity's map
    entity.setMap(this);
    // Update the map with the entity's position
    this.updateEntityPosition(entity);
    // Check if this entity is an actor, and if so add
    // them to the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.add(entity, true);
    }
};

Game.Map.prototype.removeEntity = function (entity) {
    // find the entity in the list of entities if it is present
    let key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    {
        if (this._entities[key] === entity) {
            delete this._entities[key];
        }
    }

    // if the entity is an actor, remove them from the scheduler
    if (entity.hasMixin('Actor')) {
        this._scheduler.remove(entity)
    }
};

Game.Map.prototype.updateEntityPosition = function (entity, oldX, oldY, oldZ) {
    if (typeof oldX === 'number') {
        let oldKey = oldX + ',' + oldY + ',' + oldZ;
        if (this._entities[oldKey] === entity) {
            delete this._entities[oldKey];
        }
    }
    if (entity.getX() < 0 || entity.getX() >= this._width ||
        entity.getY() < 0 || entity.getY() >= this._height ||
        entity.getZ() < 0 || entity.getZ() >= this._depth) {
        throw new Error("Entity's position is out of bounds.");
    }
    let key = entity.getX() + ',' + entity.getY() + ',' + entity.getZ();
    if (this._entities[key]) {
        throw new Error('Tried to add an entity at an occupied position.');
    }
    this._entities[key] = entity;
};

Game.Map.prototype.getItemsAt = function (x, y, z) {
    return this._items[x + ',' + y + ',' + z];
};

Game.Map.prototype.setItemsAt = function (x, y, z, items) {
    let key = x + ',' + y + ',' + z;
    if (items.length === 0) {
        if (this._items[key]) {
            delete this._items[key];
        }
    } else {
        // Simply update the items at that key
        this._items[key] = items;
    }
};

Game.Map.prototype.addItem = function (x, y, z, item) {
    let key = x + ',' + y + ',' + z;
    if (this._items[key]) {
        this._items[key].push(item);
    } else {
        this._items[key] = [item];
    }
};

Game.Map.prototype.addItemAtRandomPosition = function (item, z) {
    let position = this.getRandomFloorPosition(z);
    this.addItem(position.x, position.y, position.z, item);
};
