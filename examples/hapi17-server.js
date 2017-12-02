'use strict';

const Hapi = require('hapi');
const Configue = require('configue');

const configue = new Configue({
    models: {serverOptions: {host: 'host', port: 'port'}},
    normalize: 'camelCase',
    defaults: {host: 'localhost', port: 3000}
});

const server = new Hapi.Server(configue._.serverOptions);

server.route({
    method: 'GET', path: '/', handler(request) {
        const who = server.configue('who', 'World');
        const salute = request.configue('salute', 'hello');
        return `${salute} ${who}`;
    }
});

const start = async () => {
    try {
        await server.register(configue.plugin17());
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log(`Server running at: ${server.info.uri}`);
    console.log(configue.t`With "who" as ${'who'}`);
};

start();
