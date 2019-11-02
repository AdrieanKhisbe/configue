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

Configue.withOptions(configueOptions).resolve(configue => {
    const who = configue.get('who', 'World');
    const hook = configue.get('hook', 'none');

    console.log(`Configue: {who: ${who}, hook: ${hook}}`);
});
