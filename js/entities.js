Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 10,
    inventorySlots: 24,
    EntityMixins: [
        Game.EntityMixins.PlayerActor,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.InventoryHolder,
        Game.EntityMixins.Sight,
        Game.EntityMixins.MessageRecipient
    ]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    EntityMixins: [
        Game.EntityMixins.FungusActor,
        Game.EntityMixins.Destructible
    ]
});

Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'B',
    foreground: 'magenta',
    maxHp: 5,
    attackValue: 4,
    EntityMixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
});

Game.EntityRepository.define('snake', {
    name: 'snake',
    character: 's',
    foreground: 'chartreuse',
    maxHp: 3,
    attackValue: 2,
    EntityMixins: [Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker, Game.EntityMixins.Destructible]
});