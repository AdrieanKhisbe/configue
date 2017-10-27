'use strict';

const Configue = require('configue');
const configue = Configue(require('./complex-configue'));

console.log(configue.t({who:'World'})`I will say ${'salute'} to ${'who'} ${'times'} times`);
