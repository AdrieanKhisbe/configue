const {makeConfigGetter} = require('./core/getters');

const rawHapiPlugin = function(configue, decorateName = 'configue') {
  /**
   * Register the <tt>Configue</tt> plugin and process the various steps and hooks
   * @param server - Hapi server to configure
   * @param options - options of the Configue Plugin
   * @param next - plugin continuation
   */
  return function plugin(server, options, next) {
    if (!configue.resolved) {
      try {
        configue.resolve();
      } catch (err) {
        if (next) return next(err);
        else throw err;
      }
    }
    server.log(['plugin', 'info'], 'Registering the configue as decoration');
    const configGetter = makeConfigGetter(configue);
    server.decorate('server', decorateName, configGetter);
    server.decorate('request', decorateName, configGetter);

    if (next) next();
  };
};

const hapi17Plugin = function(decorateName) {
  const configue = this;
  return {
    register: rawHapiPlugin(configue, decorateName),
    pkg: require('../package.json')
  };
};

const hapiPlugin = function(decorateName) {
  const configue = this;
  const plugin = rawHapiPlugin(configue, decorateName);
  plugin.attributes = {
    pkg: require('../package.json')
  };
  return plugin;
};

const expressMiddleware = function(decorateName) {
  const configue = this;
  const configGetter = makeConfigGetter(configue);
  const getterName = decorateName || 'configue';
  return (req, res, next) => {
    req[getterName] = configGetter;
    next();
  };
};

module.exports = {hapiPlugin, hapi17Plugin, expressMiddleware};
