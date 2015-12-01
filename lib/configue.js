'use strict';

const nconf = require('nconf');
const _ = require('lodash');
const defaultConfig = require('./default');

const steps = {
    argv: {
        handler: load('argv'),
        dataKey: 'disable'
    },
    env: {
        handler: load('env'),
        dataKey: 'disable'
    },
    files: {
        handler: loadFiles,
        dataKey: 'files'
    }
};

exports.register = function register(server, options, next){
    server.log(['plugin', 'info'], "Registering the hapi-configue plugin");
    const hooks = options.hooks;

    if(hooks && hooks.overrides) processHook(hooks.overrides);

    _.forEach(steps, (step, stepName) => {
        const hook = hooks && hooks['post-' + stepName];
        const data = options[step.dataKey];
        if(data) step.handler(data);
        if(hook) processHook(hook)
    });

    if(hooks && hooks.default) processHook(hooks.default);

    server.decorate('server', 'configue', getConfig);
    server.decorate('request', 'configue', getConfig);
    next();
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
    if(files.length) return nconf.file(files);
}

function getConfig(key){
    return nconf.get(key);
}


