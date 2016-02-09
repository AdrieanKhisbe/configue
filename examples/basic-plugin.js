'use strict';

const Hapi = require('hapi');
const Configue = require('configue');

const server = new Hapi.Server();
server.connection({port: 3000});

const configue = Configue()

// FIXME: TODO: automatic resolve if not done
configue.resolve((err) => {
    if (err) return console.error("Error resolving configue");

    server.register({register: configue.plugin()}, (err) => {
        if (err) return console.log("Error loading plugins");

        const who = server.configue('who', 'World');

        server.route({
            method: 'GET', path: '/', handler: function (request, reply) {
                reply("Hello " + who);
            }
        });

        server.start(function () {
            console.log('Server running at:', server.info.uri);
            console.log('With "who" as ' + who)
        });
    });
});
