'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Async = require('async');
const _ = require('lodash');
const Promise = require('bluebird');

/**
 * Plugin Internals
 * @type {Object}
 */
const internals = {};

// TODO: maybe options
internals.Configue = module.exports = function Configue(options = {}) {
    if (!(this instanceof Configue)) {
        return new Configue(options);
    }

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];

    const nconf = internals.nconf = this.nconf = require('nconf');
    const settings = this.settings = Hoek.cloneWithShallow(options, 'provider');
    this.resolved = false;

    const results = Joi.validate(settings, internals.schema);
    if (results.error) throw results.error;

    nconf.use('memory');
    nconf.clear();

    if (!options.defer) {
        this.resolve();
    }
};

// Fluent builder
const Configue = internals.Configue;
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


internals.Configue.prototype.resolve = function ()  {
    if (this.resolved) return;

    if (this.settings.customWorkflow)
        this.settings.customWorkflow(this.nconf);
    else internals.applyDefaultWorkflow(this.nconf, this.settings);
    this.resolved = true;
};

internals.Configue.prototype.get = function get(key, defaultValue) {
    const result = this.nconf.get(key);
    return result === undefined ? defaultValue : result;
};

internals.Configue.prototype.getFirst = function (keys) {
    // TODO refactor once es6 full support
    for(let key of (Array.isArray(keys)? keys : Array.from(arguments))) {
        const result = this.nconf.get(key);
        if (result !== undefined) return result;
    }
};

internals.Configue.prototype.getAll = function (keys) {
    return (Array.isArray(keys)? keys : Array.from(arguments))
        .map((key) => this.nconf.get(key));
};

/**
 * Register the <tt>Configue</tt> plugin and process the various steps and hooks
 * @param server - Hapi server to configure
 * @param options - options of the Configue Plugin
 * @param next - plugin continuation
 */
const hapiPlugin = internals.Configue.prototype.plugin = function (decorateName) {
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
internals.schema = [
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
internals.applyDefaultWorkflow = function applyDefaultWorkflow(nconf, settings) {

  // Load eventual overrides values and then iterates over the different steps (in order: argv, env, files, default)
  this.processHook(settings.postHooks, 'first');
  this.iterateSteps(this.steps, settings);
  this.checkRequired(settings);
};


/**
 * Iterate synchronously over the various steps
 * @param steps - list of configuration steps
 * @param settings - project settings
 * @returns {Function}
 */
internals.iterateSteps = function iterateSteps(steps, settings) {
    const hooks = settings.postHooks;
    for(const stepName of steps) {
        this.stepActions[stepName](settings);
        if (hooks && hooks[stepName])
            this.executePostHook(hooks[stepName]);
    }
};

/**
 * Ordered list of configuration steps
 * @type {string[]}
 */
internals.steps = ['overrides', 'argv', 'env', 'files', 'defaults'];
// Definition of associated actions below

/**
 * Closure that takes the name of a nconf resource as a parameters and
 * loads it if it is not disabled in the plugin options
 *
 * @param resource - the ressource to be loaded. (argv, env, files...)
 * @returns {Function}
 */
internals.load = function load(resource) {
    return function onResource(options) {
        if (!options.disable || !options.disable[resource]) {
            return internals.nconf[resource](options[resource]);
        }
    };
};

/**
 * Process the hook for a given step
 * @param hooks
 * @param stepName
 * @returns {Function}
 */
internals.processHook = function processHook(hooks, stepName) {
    if (hooks && hooks[stepName])
        this.executePostHook(hooks[stepName]);
};

/**
 * Execute a hook
 * @param hook - a post step hook
 */
internals.executePostHook = function executeHook(hook) {
    return hook(internals.nconf);
};


internals.checkRequired = function (options) {
    if (options.required) {
        this.nconf.required(options.required);
    }
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options - plugin options
 */
internals.loadFiles = function loadFiles(options) {
    const files = options.files;
    if (Array.isArray(files) && files.length) {
        files.forEach((file) => internals.nconf.file((typeof files[0] === 'string') ? file : file.file, file));
        // file(.file) is used as namespace for nconf
    } else if (typeof files === 'string' && files.length)
        internals.nconf.file(files);
};

/**
 * Load the defaults in options using <tt>nconf.defaults</tt>
 * @param options - plugin options
 */
internals.loadDefaults = function loadDefaults(options) {
    const defaults = options.defaults;
    internals.nconf.defaults(Array.isArray(defaults) ? _.defaults.apply({}, defaults) : defaults);
};


/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
internals.stepActions = {
    overrides: internals.load('overrides'),
    argv: internals.load('argv'),
    env: internals.load('env'),
    files: internals.loadFiles,
    defaults: internals.loadDefaults
};