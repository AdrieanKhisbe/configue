const Hapi = require('hapi');
const Configue = require('hapi-configue');

const server = new Hapi.Server();
server.connection({port: 3000});

const ConfigueOptions = {
    postHooks: {
        argv: function postArgv(nconf){
            console.log('post argv');
        }
    }
};

server.register({register: Configue, options: configueOptions}, (err) => {
    if (err) return console.log("Error loading plugins");

    const who = server.configue('who') || "World";

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