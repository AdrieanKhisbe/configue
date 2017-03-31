'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Async = require('neo-async');
const _ = require('lodash');
const Promise = require('bluebird');

/**
 * Plugin Internals
 * @type {Object}
 */
const internals = {};

// TODO: maybe options
internals.Configue = module.exports = function Configue (options) {
    if (!(this instanceof Configue)) {
        return new Configue(options);
    }

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];

    const nconf = internals.nconf = this.nconf = require('nconf');
    const settings = this.settings = Hoek.cloneWithShallow(options, 'provider') || {};

    const results = Joi.validate(settings, internals.schema);
    if (results.error) throw results.error;

    nconf.use('memory');
    nconf.clear();
}

const _resolve = (self, callback) => {
    if (self.settings.customWorkflow)
        self.settings.customWorkflow(self.nconf, callback);
    else internals.applyDefaultWorkflow(self.nconf, self.settings, callback);
}

internals.Configue.prototype.resolve = function (callback) {
    if(callback === undefined){
        return Promise.fromCallback(callback => _resolve(this, callback))
    }
    _resolve(this, callback)
    // TODO: resolve marqueur!!
}

internals.Configue.prototype.get = function get(key, defaultValue) {
    const result = this.nconf.get(key);
    return result === undefined ? defaultValue : result;
}

/**
 * Register the <tt>Configue</tt> plugin and process the various steps and hooks
 * @param server - Hapi server to configure
 * @param options - options of the Configue Plugin
 * @param next - plugin continuation
 */
const hapiPlugin = internals.Configue.prototype.plugin = function () {
    const configue = this;
    const plugin = function plugin(server, options, next) {
        server.log(['plugin', 'info'], "Registering the configue has decoration");
        server.decorate('server', 'configue', configue.get);
        server.decorate('request', 'configue', configue.get);
        return next();
    }
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
    Joi.object({customWorkflow: Joi.func()}),
    Joi.object().keys({
        disable: Joi.object({
            argv: Joi.boolean(),
            env: Joi.boolean()
        }),
        files: [Joi.string(),
            Joi.array().items(Joi.object({
                file: Joi.string().required(),
                format: Joi.object({stringify: Joi.func(), parse: Joi.func()})
            })),
            Joi.array().items(Joi.string())],
        defaults: [Joi.object(),
            Joi.array().items(Joi.object())],
        postHooks: Joi.object({
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
 * @param next - callback
 */
internals.applyDefaultWorkflow = function applyDefaultWorkflow(nconf, settings, next) {
    const hooks = settings.postHooks;

    // Load eventual overrides values and then iterates over the different steps (in order: argv, env, files)
    return Async.series([
        this.processHook(hooks, 'overrides'),
        this.iterateSteps(this.steps, settings)
    ], next);
};

/**
 * Iterate asynchronously over the various steps
 * @param steps - list of configuration steps
 * @param settings - project settings
 * @returns {Function}
 */
internals.iterateSteps = function iterateSteps(steps, settings) {
    const hooks = settings.postHooks;
    return (next) => {
        return Async.eachSeries(steps, (stepName, key, done) => {
            this.stepActions[stepName](settings);
            if (hooks && hooks[stepName])
                this.executePostHook(hooks[stepName], done);
            else done();
        }, next)
    };
};

/**
 * Ordered list of configuration steps
 * @type {string[]}
 */
internals.steps = ['argv', 'env', 'files', 'defaults'];
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
        const disable = options.disable;
        if (!disable || !disable[resource])
            return internals.nconf[resource]();
    }
};

/**
 * Process the hook for a given step
 * @param hooks
 * @param stepName
 * @returns {Function}
 */
internals.processHook = function processHook(hooks, stepName) {
    return (done) => {
        if (hooks && hooks[stepName])
            this.executePostHook(hooks[stepName], done);
        else  done();
    };
};

/**
 * Execute a hook
 * @param hook - a post step hook
 * @param done - callback
 */
internals.executePostHook = function executeHook(hook, done) {
    return hook(internals.nconf, done);
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options - plugin options
 */
internals.loadFiles = function loadFiles(options) {
    const files = options.files;
    if (Array.isArray(files) && files.length) {
        if (typeof files[0] === 'string')
            files.forEach((file) => internals.nconf.file(file, file));
        else
        // file.file is used as namespace for nconf
            files.forEach((file) => internals.nconf.file(file.file, file));
    } else if (typeof files === 'string' && files.length)
        internals.nconf.file(files);
};

/**
 * Load the defaults in options using <tt>nconf.defaults</tt>
 * @param options - plugin options
 */
internals.loadDefaults = function loadDefaults(options) {
    const defaults = options.defaults;
    if (Array.isArray(defaults)) {
        internals.nconf.defaults(_.defaults.apply({}, defaults));
    } else {
        internals.nconf.defaults(defaults);
    }
};

/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
internals.stepActions = {
    argv: internals.load('argv'),
    env: internals.load('env'),
    files: internals.loadFiles,
    defaults: internals.loadDefaults
};