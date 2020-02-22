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
        Game.EntityMixins.Equipper,
        Game.EntityMixins.ExperienceGainer,
        Game.EntityMixins.PlayerStatGainer
    ]
};

Game.EntityRepository = new Game.Repository('entities', Game.Entity);

Game.EntityRepository.define('fungus', {
    name: 'fungus',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    speed: 250,
    mixins: [
        Game.EntityMixins.FungusActor,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper,
        Game.EntityMixins.ExperienceGainer,
        Game.EntityMixins.RandomStatGainer
    ]
});

Game.EntityRepository.define('bat', {
    name: 'bat',
    character: 'B',
    foreground: 'magenta',
    maxHp: 5,
    speed: 2000,
    attackValue: 4,
    mixins: [
        Game.EntityMixins.TaskActor,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper,
        Game.EntityMixins.ExperienceGainer,
        Game.EntityMixins.RandomStatGainer
    ]
});

Game.EntityRepository.define('snake', {
    name: 'snake',
    character: 's',
    foreground: 'chartreuse',
    maxHp: 3,
    attackValue: 2,
    mixins: [
        Game.EntityMixins.TaskActor,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper,
        Game.EntityMixins.ExperienceGainer,
        Game.EntityMixins.RandomStatGainer
    ]
});

Game.EntityRepository.define('kobold', {
    name: 'kobold',
    character: 'k',
    foreground: 'aqua',
    maxHp: 6,
    attackValue: 4,
    sightRadius: 5,
    tasks: ['hunt', 'wander'],
    mixins: [Game.EntityMixins.TaskActor,
        Game.EntityMixins.Sight,
        Game.EntityMixins.Attacker,
        Game.EntityMixins.Destructible,
        Game.EntityMixins.CorpseDropper,
        Game.EntityMixins.ExperienceGainer,
        Game.EntityMixins.RandomStatGainer
    ]
});