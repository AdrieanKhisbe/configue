'use strict';

const Hapi = require('hapi');
const Configue = require('configue');

const server = new Hapi.Server();
server.connection({port: 3000});

const configue = Configue();

server.register({register: configue.plugin()}, (err) => {
    if (err) return console.log('Error loading plugins');

    const who = server.configue('who', 'World');

    server.route({
        method: 'GET', path: '/', handler: function (request, reply) {
            reply('Hello ' + who);
        }
    });

    server.start(function () {
        console.log('Server running at:', server.info.uri);
        console.log('With "who" as ' + who);
    });
});
