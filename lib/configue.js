'use strict';

const nconf = require('nconf');
const Hoek = require('hoek');
const Joi = require('joi');

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
exports.register = function register(server, options, next){
    server.log(['plugin', 'info'], "Registering the hapi-configue plugin");
    let settings = Hoek.cloneWithShallow(options, 'provider');
    const hooks = settings.postHooks;

    // settings validation
    const results = Joi.validate(settings, internals.schema);
    if(results.error) return next(results.error);

    nconf.use('memory');
    
    // Load eventual overrides values
    if(hooks && hooks.overrides) internals.processHook(hooks.overrides);

    // Iterate other the differents steps (in order: argv, env, files)
    internals.steps.forEach((stepName) => {
        const hook = hooks && hooks[stepName];
        // apply the step
        internals.stepActions[stepName](settings);
        // process the eventual post-hook
        if(hook) internals.processHook(hook)
    });

    // Load defaults values
    nconf.defaults(internals.defaultConfig);
    // apply final default hook
    if(hooks && hooks.default) internals.processHook(hooks.default);

    // Load our config into hapi
    server.decorate('server', 'configue', internals.getConfig(nconf));
    server.decorate('request', 'configue', internals.getConfig(nconf));
    
    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

/**
 * Joi options schema
 */
internals.schema = Joi.object({
    disable: Joi.object({
        argv: Joi.boolean(),
        env: Joi.boolean()
    }),
    files: Joi.array().items(Joi.object({
        file: Joi.string().required(),
        format: Joi.object({stringify: Joi.func(), parse: Joi.func() })
    })),
    postHooks: Joi.object({
        argv: [Joi.func(), Joi.array().items(Joi.func())],
        env: [Joi.func(), Joi.array().items(Joi.func())],
        files: [Joi.func(), Joi.array().items(Joi.func())]
    })
});

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
internals.load = function load(resource){
    return function onResource(options){
        const disable = options.disable;
        if(!disable || !disable[resource])
            return nconf[resource]();
    }
};

/**
 * Process the hooks for a given step
 * @param hook - the hook to be processed
 * @returns {*}
 */
internals.processHook = function processHook(hook){
    if(!Array.isArray(hook) && typeof hook === 'function')
        return hook(nconf);
    else
        return hook.forEach((func) => func(nconf));
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options
 * @returns {*}
 */
internals.loadFiles = function loadFiles(options){
    const files = options.files;
    if(Array.isArray(files) && files.length)
        return files.forEach((file) => nconf.file(file));
    if(typeof files === 'string' && files.length)
        return nconf.file(files);
};

/**
 * Closure that stores the nconf object as to expose a read only interface to the user
 * @param nconf - the nconf config
 * @returns {Function} - config getter function
 */
internals.getConfig = function getConfig(nconf){
    return function onKey(key){
        return nconf.get(key);
    }
};

/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
internals.stepActions = {
    argv: internals.load('argv'),
    env: internals.load('argv'),
    files: internals.loadFiles
};