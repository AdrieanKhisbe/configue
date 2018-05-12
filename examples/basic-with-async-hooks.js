'use strict';

const Configue = require('configue');

const configueOptions = {
    async: true,
    postHooks: {
        argv: function postArgv(nconf) {
            // Perform some async operation to fetch value on mongo, etcd, api or else
            return Promise.resolve('42')
                .then(apiValue => {
                    nconf.set('hook', `async post-argv hook:${apiValue}`);
                });
        }
    }
};

Configue.withOptions(configueOptions).resolve()
    .then(configue => {
    const who = configue('who', 'World');
    const hook = configue('hook', 'none');

    console.log(`Configue: {who: ${who}, hook: ${hook}}`);
});
