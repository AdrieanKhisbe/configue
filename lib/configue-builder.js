'use strict';

const _ = require('lodash');

module.exports = function extendWithFluentBuilder(Configue) {

    Configue._options = {};
    ['files', 'defaults', 'disable', 'env', 'argv', 'customWorkflow', 'required', 'overrides', 'defer'].forEach((option) => {
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
        const c = new Configue(Configue._options);
        Configue._options = {};
        return c;
    };
    return Configue;
};
