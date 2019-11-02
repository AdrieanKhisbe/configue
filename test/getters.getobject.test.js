const test = require('ava');
const Configue = require('../lib/configue');

test('basic getObject', t => {
    const configue = Configue({defaults: {A: '2', B: 42}});
    t.deepEqual(configue.getObject('A', 'B'), {A: '2', B: 42});
});

test('basic getObject from array', t => {
    const configue = Configue({defaults: {A: '2', B: 42}});
    t.deepEqual(configue.getObject(['A', 'B']), {A: '2', B: 42});
});

test('basic getObject with rename', t => {
    const configue = Configue({defaults: {A: '2', B: 42}});
    t.deepEqual(configue.getObject(['A', 'a'], 'B'), {a: '2', B: 42});
});

test('complex getObject with rename', t => {
    const configue = Configue({defaults: {A: {alpha: 2, beta: 4}, B: 42}});
    t.deepEqual(configue.getObject(['A:alpha', 'alpha'], ['B', 'beta']), {alpha: 2, beta: 42});
});
