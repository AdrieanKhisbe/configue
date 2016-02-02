'use strict';

const Configue = require('configue');
const configue = Configue()

configue.resolve((err) => {
    if (err) return console.error('Something bad happened\n%j', err);

    const who = configue.get('who') || "World";
    console.log('I know thath "who" is ' + who);
});
