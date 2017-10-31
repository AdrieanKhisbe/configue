'use strict';

const Configue = require('configue');
const configue = new Configue();

try {
    const who = configue.get('who', 'World');
    console.log('I know that "who" is ' + who);
} catch (err) {
    console.error('Something bad happened\n%j', err);
}
