'use strict';

var nconf = require('nconf');

exports.register = function register(server, options, next){
    plugin.log(['plugin', 'info'], "Registering the 'config' plugin");

    nconf.argv().env();

    next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
