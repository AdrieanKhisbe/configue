'use strict';

const _ = require('lodash');

const optionKeys = [
  'files',
  'defaults',
  'disable',
  'env',
  'argv',
  'customWorkflow',
  'required',
  'overrides',
  'defer',
  'parse',
  'transform',
  'normalize',
  'separator',
  'async',
  'shortstop'
];

module.exports = function extendWithFluentBuilder(Configue) {
  Configue._options = {};
  optionKeys.forEach(option => {
    Configue[option] = opt => {
      Configue._options[option] = opt;
      return Configue;
    };
  });
  Configue.shortstop = opt => {
    Configue._options.shortstop = opt;
    if (opt) Configue._options.async = true;
    return Configue;
  };
  ['first', 'overrides', 'argv', 'env', 'files', 'defaults'].forEach(hook => {
    Configue[`${hook}Hook`] = opt => {
      _.set(Configue._options, `postHooks.${hook}`, opt);
      return Configue;
    };
  });
  Configue.withOptions = options => {
    _.assign(Configue._options, options);
    return Configue;
  };
  Configue.get = () => {
    const options = Configue._options;
    Configue._options = {};
    return new Configue(options);
  };
  Configue.resolve = configueContinuation => {
    Configue._options.async = true;
    const configue = Configue.get();
    if (configueContinuation) return configue.resolve().then(configueContinuation);
    return configue.resolve();
  };
  return Configue;
};
