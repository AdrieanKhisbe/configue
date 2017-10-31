'use strict';

const _ = require('lodash/fp');
const Promise = require('bluebird');

function get(key, defaultValue) {
    const result = this.nconf.get(key);
    return result === undefined ? defaultValue : result;
}

function getAsync(key, defaultOrCallback) {
    if(typeof defaultOrCallback === 'function') {
        return this.nconf.get(key, defaultOrCallback);
    } else {
        return Promise.fromCallback(cb => this.nconf.get(key, (err, res) => cb(err, res|| defaultOrCallback)));
    }
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
    return _.reduce(
        (acc, [chain, key]) => {
            const base = acc + chain;
            if (!key) return base;
            return base + configue.get(key, _.get(key, defaults));
        },
        '',
        _.zip(chains, keys));
};

function template(defaultOrChain, ...keys) {
    return _.isPlainObject(defaultOrChain)
        ? configueTemplate(this, defaultOrChain)
        : configueTemplate(this)(defaultOrChain, ...keys);
}

function getObject (...args) {
    const keys = args.length === 1 && Array.isArray(_.first(args)) ? _.first(args): args;
    return _.reduce((memo, key) => {
        const [fromKey, toKey] = Array.isArray(key)? key : [key, key];
        return _.set(toKey, this.get(fromKey), memo);
    }, {}, keys);
}

const getPaths = (obj, basePath = []) => _.reduce(
    (memo, path) => (_.isPlainObject(obj[path])) ?
        [...memo, ...getPaths(obj[path], [...basePath, path])]
        : [...memo, [...basePath, path]],
    [],
    _.keys(obj)
);

const populateObj = (configue, obj, paths) => _.reduce(
    (memo, path) => _.set(path, configue.getFirst(_.get(path, obj)), memo), {}, paths);

// FIXME TEST, List of key!! (filter)
// TODO DOC
function load(model) {
    return model ?
        _.isFunction(model)? model(this.get.bind(this)): populateObj(this, model, getPaths(model))
        : this.nconf.load();
}

module.exports = {get, getAsync, getFirst, getAll, template, getObject, load};