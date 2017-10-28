'use strict';

const _ = require('lodash/fp');

module.exports = function extendWithConfigueGetter(Configue) {
    Configue.prototype.get = get;
    Configue.prototype.getFirst = getFirst;
    Configue.prototype.getAll = getAll;
    Configue.prototype.template = template;
    Configue.prototype.t = template;
    Configue.prototype.getObject = getObject;
    Configue.prototype.load = load;
    return Configue;
}

function get(key, defaultValue) {
    const result = this.nconf.get(key);
    return result === undefined ? defaultValue : result;
}

function getFirst (keys) {
    // TODO refactor once es6 full support
    for(const key of (Array.isArray(keys)? keys : Array.from(arguments))) {
        const result = this.nconf.get(key);
        if (result !== undefined) return result;
    }
}

function getAll (keys) {
    return (Array.isArray(keys)? keys : Array.from(arguments))
        .map((key) => this.nconf.get(key));
}

const configueTemplate = (configue, defaults = {}) => (chains, ...keys) => {
    return _.reduce(_.zip(chains, keys),
        (acc, [chain, key]) => {
            const base = acc + chain;
            if (!key) return base;
            return base + configue.get(key, _.get(defaults, key));
        },
        '')
};

// TODO: cover with test!! and document!
 function template(defaultOrChain, ...keys){
    if(_.isPlainObject(defaultOrChain))
       return configueTemplate(this, defaultOrChain)
    else
        return configueTemplate(this)(defaultOrChain, ...keys)

}

function getObject (...args) {
    const keys = Array.isArray(_.first(args)) ? _.first(args): args;
    return _.reduce((key, memo) => ({...memo, [key]: this.get(key)}), {}, keys);
}

const getPaths = (obj, basePath = []) => _.reduce(
    (memo, path) => (_.isPlainObject(obj[path])) ?
        [...memo, ...getPaths(obj[path], [...basePath, path])]
        : [...memo, [...basePath, path]],
    [],
    _.keys(obj)
);

const populateObj = (configue, obj, paths) => _.reduce(
    (memo, path) => _.set(path, configue.getFirst(_.get(path, obj)), memo), {}, paths)

// FIXME TEST, List of key!! (filter)

function load(model) {
    return model ?
        populateObj(this, model, getPaths(model))
        : this.nconf.load();
}
