const test = require('ava');
const Configue = require('../src/configue');

test('get value', t => {
    const configue = Configue({defaults: {A: '2', B: 42}});

    // NOTE: code is interpreted from command line: -a !! (-a code, param of lab)
    t.is(configue.get('A'), '2');
    t.is(configue.get('B'), 42);
});

test('get nested value', t => {
    const configue = Configue({defaults: {root: {a: '2', b: 42}}});
    t.deepEqual(configue.get('root'), {a: '2', b: 42});
    t.is(configue.get('root:a'), '2');
    t.is(configue.get('root:b'), 42);
});

test('get nested value with array', t => {
    const configue = Configue({defaults: {root: {a: '2', b: 42}}});
    t.is(configue.get(['root', 'a']), '2');
    t.is(configue.get(['root', 'b']), 42);
});

test('get nested value with dot', t => {
    const configue = Configue({defaults: {root: {a: '2', b: 42}}});
    t.is(configue.get('root.a'), '2');
    t.is(configue.get('root.b'), 42);
});

test('get defaultValue', t => {
    const configue = Configue({defaults: {A: '2', B: 42}});
    t.is(configue.get('C', 'pasdefini'), 'pasdefini');
});

test('get defaultValue if result is set undefined', t => {
    const configue = Configue({defaults: {idonotexist: undefined, zero: 0}});
    t.is(configue.get('idonotexist', 'unlessItellsSo'), 'unlessItellsSo');
    t.is(configue.get('zero', 12), 0);
});


test('get first value', t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});

    t.is(configue.getFirst('A', 'B', 'C'), '2');
    t.is(configue.getFirst('b', 'B'), 42);
    t.is(configue.getFirst('acd', 'C'), false);
    t.is(configue.getFirst('aa', 'bb', 'cc'), undefined);
});

test('get first value from array', t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});

    t.is(configue.getFirst(['A', 'B', 'C']), '2');
    t.is(configue.getFirst(['b', 'B']), 42);
    t.is(configue.getFirst(['acd', 'C']), false);
    t.is(configue.getFirst(['aa', 'bb', 'cc']), undefined);
});

test('get all value', t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});

    t.deepEqual(configue.getAll('A', 'B', 'C'), ['2', 42, false]);
    t.deepEqual(configue.getAll('b', 'B'), [undefined, 42]);
});

test('get all value from array', t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});

    t.deepEqual(configue.getAll(['A', 'B', 'C']), ['2', 42, false]);
    t.deepEqual(configue.getAll(['b', 'B']), [undefined, 42]);
});


test.cb('get value async with callback', t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});
    configue.getAsync('A', (err, res) => {
        t.is(err, null);
        t.is(res, '2');
        t.end();
    });
});

test('get value async without callback (hence returns promise)', async t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});
    const res = await configue.getAsync('A');
    t.is(res, '2');
});

test('get value async with default value (hence returns promise)', async t => {
    const configue = Configue({overrides: {A: '2', B: 42, C: false}});
    const res = await configue.getAsync('D', 2);
    t.is(res, 2);
});
