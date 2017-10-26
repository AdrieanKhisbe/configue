'use strict';

const Configue = require('configue');

const configueOptions = {
    postHooks: {
        argv: function postArgv(nconf) {
            nconf.set('hook', 'post-argv hook');
        }
    }
};

const configue = Configue(configueOptions);
try {
    configue.resolve();
    const who = configue('who', 'World');
    const hook = configue('hook', 'none');

    console.log('Configue: {who: ' + who + ', hook: ' + hook + '}');
} catch (err) {
    console.error('Error resolving configue\n%j', err);
}
