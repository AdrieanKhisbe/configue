'use strict';

const Configue = require('./configue-core');
const addBuilder = require('./configue-builder');
const {get, getAsync, getFirst, getAll, template, getObject, load} = require('./configue-getters');
const {hapiPlugin, hapi17Plugin, expressMiddleware} = require('./configue-extensions');

addBuilder(Configue);

Configue.prototype.get = get;
Configue.prototype.getAsync = getAsync;
Configue.prototype.getFirst = getFirst;
Configue.prototype.getAll = getAll;
Configue.prototype.template = template;
Configue.prototype.t = template;
Configue.prototype.getObject = getObject;
Configue.prototype.load = load;

Configue.prototype.plugin = hapiPlugin;
Configue.prototype.plugin17 = hapi17Plugin;
Configue.prototype.middleware = expressMiddleware;

module.exports = Configue;
