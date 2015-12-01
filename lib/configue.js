'use strict';

const nconf = require('nconf');

exports.register = function register(server, options, next){
    plugin.log(['plugin', 'info'], "Registering the hapi-configue plugin");

    nconf.argv().env();
    if(options.files) loadFiles(options.files);
    server.handler('server', 'configue', getConfig);
    server.handler('request', 'configue', getConfig);
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


