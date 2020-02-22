Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
    this._randomTemplates = {};
};

Game.Repository.prototype.define = function(name, template, options) {
    this._templates[name] = template;
    let disableRandomCreation = options && options['disableRandomCreation'];
    if (!disableRandomCreation) {
        this._randomTemplates[name] = template;
    }
};

Game.Repository.prototype.create = function(name, extraProperties) {
    if(!this._templates[name]) {
        throw new Error("No template named '" + name + "' in repository '" +
            this._name + "'");
    }

    // Copy the template
    let template = Object.create(this._templates[name]);
    // Apply any extra properties
    if (extraProperties) {
        for (let key in extraProperties) {
            template[key] = extraProperties[key];
        }
    }

    return new this._ctor(template);
};

Game.Repository.prototype.createRandom = function() {
    return this.create(Object.keys(this._randomTemplates).random());
};