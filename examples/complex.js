'use strict';

const Configue = require('configue');
const configue = Configue(require('./complex-configue'));

const who = configue.get('who', 'World');
const salute = configue.get('salute');
const times = configue.get('times');

console.log(`I will say ${salute} to ${who} ${times} times`);
