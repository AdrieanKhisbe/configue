'use strict';

const _ = require('lodash');

const optionKeys = ['files', 'defaults', 'disable', 'env', 'argv',
    'customWorkflow', 'required', 'overrides', 'defer',
    'parse', 'transform', 'normalize'];

module.exports = function extendWithFluentBuilder(Configue) {

    Configue._options = {};
    optionKeys.forEach((option) => {
        Configue[option] = (opt) => {
            Configue._options[option] = opt;
            return Configue;
        };
    });
    ['first', 'overrides', 'argv', 'env', 'files', 'defaults'].forEach((hook) => {
        Configue[hook + 'Hook'] = (opt) => {
            _.set(Configue._options, `postHooks.${hook}`, opt);
            return Configue;
        };
    });
    Configue.get = () => {
        const options = Configue._options;
        Configue._options = {};
        return new Configue(options);
    };
    return Configue;
};
