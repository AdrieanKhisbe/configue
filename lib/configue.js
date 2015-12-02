'use strict';

const nconf = require('nconf');
const _ = require('lodash');

/**
 * Plugin Internals
 * @type {Object}
 */
const internals = {
    defaultConfig: require('./default')
};


/**
 * Register the <tt>Configue</tt> plugin and process the various steps and hooks
 * @param server
 * @param options
 * @param next
 * @returns {*}
 */
exports.register = function register(server, options, next){
    server.log(['plugin', 'info'], "Registering the hapi-configue plugin");
    const hooks = options.hooks;

    // Load eventual overrides values
    if(hooks && hooks.overrides) internals.processHook(hooks.overrides);

    // Iterate other the differents steps (in order: argv, env, files)
    internals.steps.forEach((stepName) => {
        const hook = hooks && hooks['post-' + stepName];
        // apply the step
        internals.stepActions[stepName](options);
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