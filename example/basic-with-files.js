const Hapi = require('hapi');
const Configue = require('hapi-configue');

const server = new Hapi.Server();
server.connection({port: 3000});

const ConfigueOptions = {
    disable: {argv: true},
    files: [
        {file: './config.json'},
        {
            file: './confige.yaml',
            format: require('nconf-yaml')
        }
    ]
};

server.register({register: Configue, options: ConfigueOptions}, (err) => {
    if (err) return console.log('Error loading plugins:\n %s', err);

    const salute = server.configue('salute') || 'Hello';
    const who = server.configue('who') || 'World';

    server.route({
        method: 'GET', path: '/', handler: function (request, reply) {
            reply(salute + ' ' + who);
        }
    });

    server.start(function () {
        console.log('Server running at:', server.info.uri);
        console.log('With "who" as ' + who + ' and "salute" as ' + salute);
    });
});