'use strict';

function makeConfigGetter(configue) {
    const configGetter = configue.get.bind(configue);
    configGetter.get = configGetter;
    configGetter.getFirst  = configue.getFirst.bind(configue);
    configGetter.getAll  = configue.getAll.bind(configue);
    configGetter.getObject  = configue.getObject.bind(configue);
    configGetter.load  = configue.load.bind(configue);
    configGetter.template  = configue.template.bind(configue);
    configGetter.t = configGetter.template;
    return configGetter;
}

const hapiPlugin = module.exports.hapiPlugin = function (decorateName) {
    const configue = this;
    /**
     * Register the <tt>Configue</tt> plugin and process the various steps and hooks
     * @param server - Hapi server to configure
     * @param options - options of the Configue Plugin
     * @param next - plugin continuation
     */
    const plugin = function plugin(server, options, next) {

        if (!configue.resolved) {
            try {
                configue.resolve();
            } catch (err) {
                return next(err);
            }
        }
        server.log(['plugin', 'info'], 'Registering the configue aas decoration');
        const configGetter = makeConfigGetter(configue);
        server.decorate('server', decorateName || 'configue', configGetter);
        server.decorate('request', decorateName || 'configue', configGetter);

        next();
    };
    plugin.attributes = hapiPlugin.attributes;
    return plugin;
};

hapiPlugin.attributes = {
    pkg: require('../package.json')
};

module.exports = {hapiPlugin};
