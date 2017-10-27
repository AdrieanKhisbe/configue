'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Async = require('async');
const _ = require('lodash');
const Promise = require('bluebird');


// TODO: maybe options
const Configue = module.exports = function Configue(options = {}) {
    if (!(this instanceof Configue)) {
        return new Configue(options);
    }

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];

    const nconf = this.nconf = require('nconf');
    const settings = this.settings = Hoek.cloneWithShallow(options, 'provider');
    this.resolved = false;

    const results = Joi.validate(settings, configueOptionsSchema);
    if (results.error) throw results.error;

    nconf.use('memory');
    nconf.clear();

    if (!options.defer) {
        this.resolve();
    }
};

// Fluent builder
Configue._options = {};
['files', 'defaults', 'disable', 'env', 'argv', 'customWorkflow', 'required', 'overrides', 'defer'].forEach((option) => {
    Configue[option] = (opt) => {
        Configue._options[option] = opt;
        return Configue;
    };
});
['first', 'overrides', 'argv', 'env', 'files', 'defaults'].forEach((hook) => {
    Configue[hook + 'Hook'] = (opt) => {
        _.set(Configue._options, `postHooks.${hook}`, opt);
        return Configue;
    };
});
Configue.get = () => {
    const c = new Configue(Configue._options);
    Configue._options = {};
    return c;
};


Configue.prototype.resolve = function ()  {
    if (this.resolved) return;

    if (this.settings.customWorkflow)
        this.settings.customWorkflow(this.nconf);
    else applyDefaultWorkflow(this.nconf, this.settings);
    this.resolved = true;
};

Configue.prototype.get = function get(key, defaultValue) {
    const result = this.nconf.get(key);
    return result === undefined ? defaultValue : result;
};

Configue.prototype.getFirst = function (keys) {
    // TODO refactor once es6 full support
    for(const key of (Array.isArray(keys)? keys : Array.from(arguments))) {
        const result = this.nconf.get(key);
        if (result !== undefined) return result;
    }
};

Configue.prototype.getAll = function (keys) {
    return (Array.isArray(keys)? keys : Array.from(arguments))
        .map((key) => this.nconf.get(key));
};

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
Configue.prototype.template = function(defaultOrChain, ...keys){
    if(_.isPlainObject(defaultOrChain))
       return configueTemplate(this, defaultOrChain)
    else
        return configueTemplate(this)(defaultOrChain, ...keys)

};

Configue.prototype.t = Configue.prototype.template;

Configue.prototype.getObject = function (...args) {
    const keys = Array.isArray(_.first(args)) ? _.first(args): args;
    return _.reduce(keys, (memo, key) => ({...memo, [key]: this.get(key)}), {});
};

/**
 * Register the <tt>Configue</tt> plugin and process the various steps and hooks
 * @param server - Hapi server to configure
 * @param options - options of the Configue Plugin
 * @param next - plugin continuation
 */
const hapiPlugin = Configue.prototype.plugin = function (decorateName) {
    const configue = this;
    const plugin = function plugin(server, options, next) {

        if (!configue.resolved) {
            try {
                configue.resolve();
            } catch (err) {
                return next(err);
            }
        }
        server.log(['plugin', 'info'], 'Registering the configue has decoration');
        const configGetter = configue.get.bind(configue);
        configGetter.get = configGetter;
        configGetter.getFirst  = configue.getFirst.bind(configue);
        configGetter.getAll  = configue.getAll.bind(configue);

        server.decorate('server', decorateName || 'configue', configGetter);
        server.decorate('request', decorateName || 'configue', configGetter);
        next();
    };
    plugin.attributes = hapiPlugin.attributes;
    return plugin;
};

hapiPlugin.attributes = {
    pkg: require('../package.json')
};


/**
 * Joi options schema
 */
const configueOptionsSchema = [
    Joi.object({defer: Joi.boolean(), customWorkflow: Joi.func()}),
    Joi.object().keys({
        defer: Joi.boolean(),
        disable: Joi.object({
            argv: Joi.boolean(),
            env: Joi.boolean()
        }),
        argv: [Joi.object()],
        env: [Joi.object(), Joi.array().items(Joi.string()), Joi.string()],

        files: [Joi.string(),
            Joi.array().items(Joi.object({
                file: Joi.string().required(),
                format: Joi.object({stringify: Joi.func(), parse: Joi.func()})
            })),
            Joi.array().items(Joi.string())],
        defaults: [Joi.object(),
            Joi.array().items(Joi.object())],
        overrides: Joi.object(),
        required: Joi.array().items(Joi.string()),
        postHooks: Joi.object({
            first: Joi.func(),
            overrides: Joi.func(),
            argv: Joi.func(),
            env: Joi.func(),
            files: Joi.func(),
            defaults: Joi.func()
        })
    })];

/**
 * Apply the Default Configuration Workflow
 * @param nconf - the nconf object
 * @param settings - plugin config
 */
const applyDefaultWorkflow = function applyDefaultWorkflow(nconf, settings) {

  // Load eventual overrides values and then iterates over the different steps (in order: argv, env, files, default)
  processHook(nconf, settings.postHooks, 'first');
  iterateSteps(nconf, STEPS, settings);
  checkRequired(nconf, settings);
};


/**
 * Iterate synchronously over the various steps
 * @param steps - list of configuration steps
 * @param settings - project settings
 * @returns {Function}
 */
const iterateSteps = (nconf, steps, settings) => {
    const hooks = settings.postHooks;
    for(const stepName of steps) {
        STEP_ACTIONS[stepName](nconf, settings);
        processHook(nconf, hooks, stepName);
    }
};

/**
 * Ordered list of configuration steps
 * @type {string[]}
 */
const STEPS = ['overrides', 'argv', 'env', 'files', 'defaults'];
// Definition of associated actions below

/**
 * Closure that takes the name of a nconf resource as a parameters and
 * loads it if it is not disabled in the plugin options
 *
 * @param resource - the ressource to be loaded. (argv, env, files...)
 * @returns {Function} (nconf, options)
 */
const load = resource => (nconf, options) => {
    if (!options.disable || !options.disable[resource]) {
        return nconf[resource](options[resource]);
    }
};

/**
 * Process the hook for a given step
 * @param hooks
 * @param stepName
 * @returns {Function}
 */
const processHook = (nconf, hooks, stepName) => {
    if (hooks && hooks[stepName])
        hooks[stepName](nconf);
};

const checkRequired = (nconf, options) => {
    if (options.required) {
        nconf.required(options.required);
    }
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options - plugin options
 */
const loadFiles = (nconf, options) => {
    const files = options.files;
    if (Array.isArray(files) && files.length) {
        files.forEach(file => nconf.file((typeof files[0] === 'string') ? file : file.file, file));
        // file(.file) is used as namespace for nconf
    } else if (typeof files === 'string' && files.length)
        nconf.file(files);
};

/**
 * Load the defaults in options using <tt>nconf.defaults</tt>
 * @param options - plugin options
 */
const loadDefaults = function loadDefaults(nconf, options) {
    const defaults = options.defaults;
    nconf.defaults(Array.isArray(defaults) ? _.defaults.apply({}, defaults) : defaults);
};


/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
const STEP_ACTIONS = {
    overrides: load('overrides'),
    argv: load('argv'),
    env: load('env'),
    files: loadFiles,
    defaults: loadDefaults
};
