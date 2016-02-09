'use strict';

const Configue = require('configue');

const configueOptions = {
    postHooks: {
        argv: function postArgv(nconf, done) {
            nconf.set('hook', 'post-argv hook');
            return done();
        }
    }
};

const configue = Configue(configueOptions)
configue.resolve((err) => {
    if (err) return console.error('Error resolving configue\n%j', err);

    const who = server.configue('who', 'World');
    const hook = server.configue('hook', 'none');

    console.log('Configue: {who: ' + who + ', hook: ' + hook + '}')
});
