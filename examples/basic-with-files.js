const Configue = require('configue');

const configueOptions = {
    defer: true,
    disable: {argv: true},
    files: [
        {file: './config.json'},
        {
            file: './config.yaml',
            format: require('nconf-yaml')
        }
    ]
};

const configue = new Configue(configueOptions);

try {
    console.log(`Need to call resolve defer being true, so resolve is ${configue.resolved}`);
    configue.resolve();

    const salute = configue.get('salute', 'Hello');
    const who = configue.get('who', 'World');

    console.log('The Configue tell that "who" is ' + who + ' and "salute" is ' + salute);
} catch (err) {
    console.error('Error loading plugins:\n %s', err);
}
