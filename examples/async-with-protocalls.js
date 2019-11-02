const Configue = require('configue');

const configueOptions = {
  async: true,
  disable: {env: true},
  protocall: true,
  files: [{file: './config-with-protocalls.json'}]
};

Configue.withOptions(configueOptions)
  .resolve()
  .then(configue => {
    console.log(`Secret ${configue.get('salute', 'Hello')} to ${configue.get('who', 'World')}`);
  });
