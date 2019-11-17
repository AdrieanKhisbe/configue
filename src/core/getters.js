const _ = require('lodash/fp');
const Promise = require('bluebird');
const {getPaths} = require('./utils');

/**
 * Format the key to a nconf compatible format
 * @param key the key as array or string
 * @returns string formated to be accepted by nconf
 */
function formatKey(key) {
  if (_.isArray(key)) return key.join(':');
  else if (key.includes('.') && !key.includes(':')) return key.replace('.', ':');
  return key;
}

/**
 * Get a value from the configue
 * @param key queried key
 * @param defaultValue default value if key not present
 * @returns {*} value or default
 */
function get(key, defaultValue) {
  const result = this.nconf.get(formatKey(key));
  return result === undefined ? defaultValue : result;
}

/**
 * Get asynchronously a value from the configue
 *
 * Support callback or promise api depending if the last arg
 *
 * @param key queried key
 * @param defaultOrCallback callback or optional default value for promise mode
 * @returns {*} A promise if no callback given
 */
function getAsync(key, defaultOrCallback) {
  if (typeof defaultOrCallback === 'function') {
    this.nconf.get(formatKey(key), defaultOrCallback);
  } else {
    return Promise.fromCallback(cb =>
      this.nconf.get(formatKey(key), (err, res) => cb(err, res || defaultOrCallback))
    );
  }
}

/**
 * Get first defined value from configue
 *
 * Keys can be given as spread argument, in that case it's not possible
 * to give a default value
 *
 * @param keys list of keys
 * @param defaultValue default value
 * @returns {*} first defined value
 */
function getFirst(keys, defaultValue, ...rest) {
  const hasDefault = _.isArray(keys) && _.isEmpty(rest);
  for (const key of hasDefault ? keys : [keys, defaultValue, ...rest]) {
    const result = this.nconf.get(formatKey(key));
    if (result !== undefined) return result;
  }
  return hasDefault ? defaultValue : undefined;
}

/**
 * Get all keys from config
 *
 *  Keys can be given as spread argument
 *
 * @param keys all keys that are to be fetched
 * @returns {Array} array of fetched values
 */
function getAll(...keys) {
  return (Array.isArray(_.head(keys)) ? _.head(keys) : keys).map(key =>
    this.nconf.get(formatKey(key))
  );
}

const configueTemplate = (configue, defaults = {}) => (chains, ...keys) => {
  return _.reduce(
    (acc, [chain, key]) => {
      const base = acc + chain;
      if (!key) return base;
      return base + configue.get(formatKey(key), _.get(key, defaults));
    },
    '',
    _.zip(chains, keys)
  );
};

/**
 * Template string function, that populate the interpolated keys by they configue value
 *
 * ex: <code>configue.template`my template string ${mykey}`</code>
 *
 * The function can be called with a dict of default values, and will return the actual
 * template string function
 *
 * ex:<code>configue.template`my template string ${mykey}`</code>
 *
 * @param defaultOrChain the default object or the template chains
 * @param keys the keys of the template string
 * @returns {Function|string} The template string populated or the function with default to serve as template string function
 */
function template(defaultOrChain, ...keys) {
  return _.isPlainObject(defaultOrChain)
    ? configueTemplate(this, defaultOrChain)
    : configueTemplate(this)(defaultOrChain, ...keys);
}

/**
 * Get an object with {key: configueValue(key)}
 * @param args the keys to form object with
 * @returns {object} the forged object
 */
function getObject(...args) {
  const keys = args.length === 1 && Array.isArray(_.first(args)) ? _.first(args) : args;
  return _.reduce(
    (memo, key) => {
      const [fromKey, toKey] = Array.isArray(key) ? key : [key, key];
      return _.set(toKey, this.get(fromKey), memo);
    },
    {},
    keys
  );
}

const populateObj = (configue, obj, paths) =>
  _.reduce((memo, path) => _.set(path, configue.getFirst(_.get(path, obj)), memo), {}, paths);

// TODO (maybe) List of key!! (filter) -> its a getALL!!
/**
 * Load the configue into one object, eventually based on a model
 *
 * "model" is either:
 * - a (nested) object whose leafes are keys to be replaced by their associated value
 * - a function taking a config getter as argument and returning the object
 *
 * @param model eventual model to load
 * @returns {*} all the config or a partial model
 */
function load(model) {
  return model
    ? _.isFunction(model)
      ? model(makeConfigGetter(this))
      : populateObj(this, model, getPaths(model))
    : this.nconf.load();
}

function makeConfigGetter(configue) {
  const configGetter = configue.get.bind(configue);
  configGetter.get = configGetter;
  configGetter.getFirst = configue.getFirst.bind(configue);
  configGetter.getAll = configue.getAll.bind(configue);
  configGetter.getObject = configue.getObject.bind(configue);
  configGetter.load = configue.load.bind(configue);
  configGetter.template = configue.template.bind(configue);
  configGetter.t = configGetter.template;
  return configGetter;
}

module.exports = {
  formatKey,
  get,
  getAsync,
  getFirst,
  getAll,
  template,
  getObject,
  load,
  makeConfigGetter
};
