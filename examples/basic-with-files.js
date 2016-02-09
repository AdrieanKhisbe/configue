'use strict';

const Configue = require('configue');

const configueOptions = {
    disable: {argv: true},
    files: [
        {file: './config.json'},
        {
            file: './config.yaml',
            format: require('nconf-yaml')
        }
    ]
};

const configue = Configue(configueOptions)

configue.resolve((err) => {
    if (err) return console.error('Error loading plugins:\n %s', err);

    const salute = configue.get('salute', 'Hello');
    const who = configue.get('who', 'World');

    console.log('The Configue tell that "who" is ' + who + ' and "salute" is ' + salute);
});
