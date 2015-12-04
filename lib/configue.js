'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const async = require('neo-async');

/**
 * Plugin Internals
 * @type {Object}
 */
const internals = {
    defaultConfig: require('./default')
};


/**
 * Register the <tt>Configue</tt> plugin and process the various steps and hooks
 * @param server - Hapi server to configure
 * @param options - options of the Configue Plugin
 * @param next - plugin continuation
 * @returns {*}
 */
exports.register = function register(server, options, next) {
    server.log(['plugin', 'info'], "Registering the hapi-configue plugin");
    let settings = Hoek.cloneWithShallow(options, 'provider');

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];
    const nconf = require('nconf');
    const decorate = internals.decorate(server, nconf, next);
    internals.nconf = nconf;

    // settings validation
    const results = Joi.validate(settings, internals.schema);
    if (results.error) return next(results.error);

    nconf.use('memory');
    nconf.clear();

    if (settings.customWorkflow) return settings.customWorkflow(nconf, decorate);
    return internals.applyDefaultWorkflow(nconf, settings, decorate);
};

/**
 * Decorate the server & the request with the nconf getter
 * @param server
 * @param nconf
 * @param next
 * @returns {Function}
 */
internals.decorate = function decorate(server, nconf, next){
    return (err) => {
        if(err) return next(err);
        server.decorate('server', 'configue', internals.getConfig(nconf));
        server.decorate('request', 'configue', internals.getConfig(nconf));
        return next();
    };
};

exports.register.attributes = {
    pkg: require('../package.json')
};

/**
 * Joi options schema
 */
internals.schema = [
    Joi.object({customWorkflow: Joi.func()}),
    Joi.object({
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
        postHooks: Joi.object({
            argv: [Joi.func(), Joi.array().items(Joi.func())],
            env: [Joi.func(), Joi.array().items(Joi.func())],
            files: [Joi.func(), Joi.array().items(Joi.func())]
        })
    })];

/**
 * Apply the Default Configuration Workflow
 * @param nconf - the nconf object
 * @param settings - the config
 * @param next
 * @returns {*}
 */
internals.applyDefaultWorkflow = function applyDefaultWorkflow(nconf, settings, next) {
    const hooks = settings.postHooks;

    // Load eventual overrides values and then iterates over the different steps (in order: argv, env, files)
    return async.series([
        this.processHooks(hooks, 'overrides'),
        this.iterateSteps(this.steps, settings),
        (done) => {
            // Load defaults values
            nconf.defaults(internals.defaultConfig);
            return done();
        },
        this.processHooks(hooks, 'default')
    ], next);
};

/**
 * Iterate asynchronously over the various steps
 * @param steps
 * @param settings
 * @returns {Function}
 */
internals.iterateSteps = function iterateSteps(steps, settings){
    const hooks = settings.postHooks;
    return (next) => {
        return async.eachSeries(steps, (stepName, key, done) => {
            const hook = hooks && hooks[stepName];
            // apply the step
            this.stepActions[stepName](settings);
            // process the eventual post-hook
            if(hook) return this.executeHook(hook, done);
            return done();
        }, next)
    };
};

/**
 * Ordered list of configuration steps
 * @type {string[]}
 */
internals.steps = ['argv', 'env', 'files'];
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
 * Process the hooks for a given step
 * @param hooks
 * @param stepName
 * @returns {Function}
 */
internals.processHooks = function processHooks(hooks, stepName) {
    return (done) => {
        const hook = hooks && hooks[stepName];
        if(!hook) return done();
        return this.executeHook(hook, done);
    }
};

/**
 * Execute a hook
 * @param hook
 * @param done
 * @returns {*}
 */
internals.executeHook = function executeHook(hook, done){
    if (typeof hook !== 'function') return done(new Error('Hook must be a function'));
    return hook(internals.nconf, done);
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options
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
 * Closure that stores the nconf object as to expose a read only interface to the user
 * @param nconf - the nconf config
 * @returns {Function} - config getter function
 */
internals.getConfig = function getConfig(nconf) {
    return function onKey(key) {
        return nconf.get(key);
    }
};

/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
internals.stepActions = {
    argv: internals.load('argv'),
    env: internals.load('env'),
    files: internals.loadFiles
};