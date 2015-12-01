'use strict';

const nconf = require('nconf');
const _ = require('lodash');
const defaultConfig = require('./default');

const steps = ['argv', 'env', 'files'];
const stepActions = {
    argv: {
        handler: load('argv'),
        optionKey: 'disable'
    },
    env: {
        handler: load('env'),
        optionKey: 'disable'
    },
    files: {
        handler: loadFiles,
        optionKey: 'files'
    }
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
        const stepAction = stepActions[stepName];
        // apply the step
        stepAction.handler(options[stepAction.optionKey]);
        // process the eventual post-hook
        if(hook) processHook(hook)
    });

    // Load defaults values
    nconf.defaults(defaultConfig);
    // apply final default hook
    if(hooks && hooks.default) processHook(hooks.default);

    // Load our config into hapi
    server.decorate('server', 'configue', getConfig);
    server.decorate('request', 'configue', getConfig);
    
    return next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

function load(resource){
    return function onResource(disable){
        if(!disable || !disable[resource]) return nconf[resource]();
    }
}

function processHook(hook){
    if(!Array.isArray(hook) && typeof hook === 'function') return hook(nconf);
    return hook.forEach((func) => func(nconf));
}

function loadFiles(files){
    if(Array.isArray(files) && files.length) return files.forEach((file) => nconf.file(file));
    if(typeof files === 'string' && files.length) return nconf.file(files);
}

function getConfig(key){
    return nconf.get(key);
}


