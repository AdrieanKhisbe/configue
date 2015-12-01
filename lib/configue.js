'use strict';

const nconf = require('nconf');
const defaultConfig = require('./default');

exports.register = function register(server, options, next){
    server.log(['plugin', 'info'], "Registering the hapi-configue plugin");
    const disable = options.disable;

    if(!disable || !disable.argv) nconf.argv();

    if(!disable || !disable.env) nconf.env();

    if(options.files) loadFiles(options.files);
    nconf.defaults(defaultConfig);
    server.decorate('server', 'configue', getConfig);
    server.decorate('request', 'configue', getConfig);
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

function loadFiles(files){
    if(Array.isArray(files) && files.length) return files.forEach((file) => nconf.file(file));
    if(files.length) return nconf.file(files);
}

function getConfig(key){
    return nconf.get(key);
}


