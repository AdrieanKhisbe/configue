'use strict';

const Configue = require('configue');
const configue = new Configue(require('./complex-configue'));

console.log(configue._.hello);
console.log(configue._.bonjour);
console.log(configue.t({who:'World'})`I will say ${'salute'} to ${'who'} ${'times'} times`);
