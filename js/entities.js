// Create Mixins namespace
Game.Mixins = {};

// Define Moveable mixin
Game.Mixins.Moveable = {
    name: 'Moveable',
    tryMove: function (x, y, map) {
        let tile = map.getTile(x, y);
        let target = map.getEntityAt(x, y);
        // Check if can walk on the tile and if so simply walk into it
        if (target) {
            return false
        } else if (tile.isWalkable()) {
            // Update the object's position
            this._x = x;
            this._y = y;
            return true;
            // Check if the tile is diggable, and
            // if so try to dig it
        } else if (tile.isDiggable()) {
            map.dig(x, y);
            return true;
        }
        return false;
    }
};

// Main player's actor mixin
Game.Mixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function () {
        // Re-render screen
        Game.refresh();
        this.getMap().getEngine().lock();
    }
};

Game.Mixins.FungusActor = {
    name: 'FungusActor',
    group: 'Actor',
    act: function () {
        //TODO
    }
};

// Player template
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    background: 'black',
    mixins: [Game.Mixins.Moveable, Game.Mixins.PlayerActor]
};

Game.FungusTemplate = {
    character: 'F',
    foreground: 'green',
    mixins: [Game.Mixins.Moveable, Game.Mixins.FungusActor]
};