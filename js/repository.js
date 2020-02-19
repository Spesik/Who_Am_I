Game.Repository = function(name, ctor) {
    this._name = name;
    this._templates = {};
    this._ctor = ctor;
};

Game.Repository.prototype.define = function(name, template) {
    this._templates[name] = template;
};


Game.Repository.prototype.create = function(name) {
    let template = this._templates[name];

    if (!template) {
        throw new Error("No template named '" + name + "' in repository '" +
            this._name + "'");
    }

    return new this._ctor(template);
};

Game.Repository.prototype.createRandom = function() {
    return this.create(Object.keys(this._templates).random());
};