'use strict';

const nconf = require('nconf');

exports.register = function register(server, options, next){
    plugin.log(['plugin', 'info'], "Registering the hapi-configue plugin");

    nconf.argv().env();
    server.handler('server', 'configue', getConfig);
    server.handler('request', 'configue', getConfig);
    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};

function getConfig(key){
    return nconf.get(key);
}


