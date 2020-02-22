Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    sightRadius: 10,
    inventorySlots: 24,
    mixins: [
        Game.EntityMixins.PlayerActor,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.InventoryHolder,
        Game.EntityMixins.FoodConsumer,
        Game.EntityMixins.Sight,
        Game.EntityMixins.MessageRecipient,
        Game.EntityMixins.Equipper
    ]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    mixins: [
        Game.EntityMixins.FungusActor,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper
    ]
});

Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'B',
    foreground: 'magenta',
    maxHp: 5,
    attackValue: 4,
    mixins: [
        Game.EntityMixins.WanderActor,
        Game.EntityMixins.CorpseDropper,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper
    ]
});

Game.EntityRepository.define('snake', {
    name: 'snake',
    character: 's',
    foreground: 'chartreuse',
    maxHp: 3,
    attackValue: 2,
    mixins: [
        Game.EntityMixins.WanderActor,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper
    ]
});