'use strict';

const Configue = require('../lib/configue');

const configueOptions = {
    async: true,
    disable: {env: true},
    shortstop: true,
    files: [
        {file: './config-with-shortstops.json'}
    ]
};

Configue.withOptions(configueOptions)
    .resolve().then(configue => {
    console.log(`Secret ${configue.get('salute', 'Hello')} to ${configue.get('who', 'World')}`);
});

