const Hapi = require('hapi');
const Configue = require('configue');

const configue = new Configue({
  models: {connexion: {port: 'port'}},
  normalize: 'camelCase',
  defaults: {host: 'localhost', port: 3000}
});

const server = new Hapi.Server();
server.connection(configue._.connexion);

server.register({register: configue.plugin()}, err => {
  if (err) return console.log('Error loading plugins');

  const who = server.configue('who', 'World');

  server.route({
    method: 'GET',
    path: '/',
    handler(request, reply) {
      const salute = request.configue('salute', 'hello');
      reply(`${salute} ${who}`);
    }
  });

  server.start(function() {
    console.log(`Server running at: ${server.info.uri}`);
    console.log(`With "who" as ${who}`);
  });
});
