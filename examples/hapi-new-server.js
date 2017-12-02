'use strict';

const Hapi = require('hapi');
const Configue = require('..');

const configue = new Configue({
    models: {connexion: {port: 'port'}},
    normalize: 'camelCase',
    defaults: {port: 3000}
});

const server = new Hapi.Server();
server.connection(configue._.connexion);

server.route({
    method: 'GET', path: '/', handler: function (request, reply) {
        const who = server.configue('who', 'World');
        const salute = request.configue('salute', 'hello');
        reply(`${salute} ${who}`);
    }
});

const start = async () => {

    try {
        await server.register(configue.plugin.new());
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log(`Server running at: ${server.info.uri}`);
    console.log(`With "who" as ${who}`);
};

start();