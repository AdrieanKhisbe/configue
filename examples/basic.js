const Configue = require('configue');

const configue = new Configue();
const who = configue.get('who', 'World');
console.log('I know that "who" is ' + who);
