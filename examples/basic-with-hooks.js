const Hapi = require('hapi');
const Configue = require('configue');

const server = new Hapi.Server();
server.connection({port: 3000});

const configueOptions = {
    postHooks: {
        argv: function postArgv(nconf, done){
            nconf.set('hook', 'post-argv hook');
            return done();
        }
    }
};

server.register({register: Configue, options: configueOptions}, (err) => {
    if (err) return console.log('Error loading plugins');

    const who = server.configue('who') || 'World';
    const hook = server.configue('hook') || 'none';
    server.route({
        method: 'GET', path: '/', handler: function (request, reply) {
            reply('Hello ' + who);
        }
    });

    server.start(function () {
        console.log('Server running at:', server.info.uri);
        console.log('With "who" as ' + who + ' and "hook" as ' + hook)
    });
});