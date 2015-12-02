'use strict';

const nconf = require('nconf');
const _ = require('lodash');

const defaultConfig = require('./default');

/**
 * Ordered list of configuration steps
 * @type {string[]}
 */
const steps = ['argv', 'env', 'files'];
/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
const stepActions = {
    argv: load('argv'),
    env: load('argv'),
    files: loadFiles
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
    if(hooks && hooks.overrides) processHook(hooks.overrides);

    // Iterate other the differents steps (in order: argv, env, files)
    steps.forEach((stepName) => {
        const hook = hooks && hooks['post-' + stepName];
        // apply the step
        stepActions[stepName](options);
        // process the eventual post-hook
        if(hook) processHook(hook)
    });

    // Load defaults values
    nconf.defaults(defaultConfig);
    // apply final default hook
    if(hooks && hooks.default) processHook(hooks.default);

    // Load our config into hapi
    server.decorate('server', 'configue', getConfig(nconf));
    server.decorate('request', 'configue', getConfig(nconf));
    
    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

/**
 * Closure that takes the name of a nconf resource as a parameters and
 * loads it if it is not disabled in the plugin options
 *
 * @param resource - the ressource to be loaded. (argv, env, files...)
 * @returns {Function}
 */
function load(resource){
    return function onResource(options){
        const disable = options.disable;
        if(!disable || !disable[resource])
            return nconf[resource]();
    }
}

/**
 * Process the hooks for a given step
 * @param hook - the hook to be processed
 * @returns {*}
 */
function processHook(hook){
    if(!Array.isArray(hook) && typeof hook === 'function')
        return hook(nconf);
    else
        return hook.forEach((func) => func(nconf));
}

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options
 * @returns {*}
 */
function loadFiles(options){
    const files = options.files;
    if(Array.isArray(files) && files.length)
        return files.forEach((file) => nconf.file(file));
    if(typeof files === 'string' && files.length)
        return nconf.file(files);
}

/**
 * Closure that stores the nconf object as to expose a read only interface to the user
 * @param nconf - the nconf config
 * @returns {Function} - config getter function
 */
function getConfig(nconf){
    return function onKey(key){
        return nconf.get(key);
    }
}
