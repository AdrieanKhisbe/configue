'use strict';

const Hapi = require('hapi');
const Configue = require('configue');

const configue = new Configue({models: {connexion: {port: 'PORT'}}});

const server = new Hapi.Server();
server.connection(configue._.connexion);

server.register({register: configue.plugin()}, (err) => {
    if (err) return console.log('Error loading plugins');

    const who = server.configue('who', 'World');

    server.route({
        method: 'GET', path: '/', handler: function (request, reply) {
            const salute = request.configue('salute', 'hello');
            reply(`${salute} ${who}`);
        }
    });

    server.start(function () {
        console.log(`Server running at: ${server.info.uri}`);
        console.log(`With "who" as ${who}`);
    });
});
