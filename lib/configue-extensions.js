'use strict';

const {makeConfigGetter} = require('./configue-getters');

const rawHapiPlugin = function (configue, decorateName) {
    console.log('raw plugin called');
    console.log(configue)
    /**
     * Register the <tt>Configue</tt> plugin and process the various steps and hooks
     * @param server - Hapi server to configure
     * @param options - options of the Configue Plugin
     * @param next - plugin continuation
     */
    return function plugin(server, options, next) {
        console.log('plugin called');
        if (!configue.resolved) {
            try {
                configue.resolve();
            } catch (err) {
                return next(err);
            }
        }
        server.log(['plugin', 'info'], 'Registering the configue as decoration');
        const configGetter = makeConfigGetter(configue);
        server.decorate('server', decorateName || 'configue', configGetter);
        server.decorate('request', decorateName || 'configue', configGetter);

        next();
    };
};

const hapiPlugin = function (decorateName) {
    const configue = this;
    const plugin = rawHapiPlugin(configue, decorateName);
    plugin.attributes = hapiPlugin.attributes;
    return plugin;
};

hapiPlugin.attributes = {
    pkg: require('../package.json')
};

hapiPlugin.new = (decorateName) => {
    console.log('new plugin called!!')
    const configue = this;
    return {
        register: rawHapiPlugin(configue),
        pkg: require('../package.json')
    };
};

const expressMiddleware = function (decorateName) {
    const configue = this;
    const configGetter = makeConfigGetter(configue);
    const getterName = decorateName || 'configue';
    return (req, res, next) => {
        req[getterName] = configGetter;
        next();
    };
};

module.exports = {hapiPlugin, expressMiddleware};
