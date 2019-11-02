const Configue = require('configue');

Configue.disable({env: true})
  .files([
    {file: '../examples/config.json'},
    {
      file: '../examples/config.yaml',
      format: require('nconf-yaml')
    }
  ])
  .resolve()
  .then(configue => {
    const salute = configue.get('salute', 'Hello');
    const who = configue.get('who', 'World');

    console.log(`${salute} ${who}!`);
  });
