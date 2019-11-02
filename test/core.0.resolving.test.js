const test = require('ava');
const Configue = require('../lib/configue');

test('resolve is automatic by default', t => {
    const configue = Configue();
    t.true(configue.resolved);
});

test('resolve is automatic unless defer', t => {
    const configue = Configue({defer: true});
    t.false(configue.resolved);
});

test('resolve is automatic unless async', t => {
    const configue = Configue({async: true});
    t.false(configue.resolved);
});

test('resolve can be performed asynchrounously', async t => {
    const configue = Configue({async: true});
    const config = await configue.resolve();
    t.is(config, configue);
    t.assert(configue.resolved);
});

test('resolve is executed once (defer)', t => {
    const configue = Configue({defer: true, defaults: {A: 1}});
    t.false(configue.resolved);
    configue.resolve();
    configue.resolve(); // coverage ensure that we don't have ran a second times

    t.assert(configue.resolved);
    // can't test a resolve with change value since dynamic access to argv and env
});

test('resolve is executed once', async t => {
    const configue = Configue({async: true, defaults: {A: 1}});
    t.false(configue.resolved);
    const config = await configue.resolve();
    const configbis = await configue.resolve(); // coverage ensure that we don't have ran a second times

    t.assert(configbis.resolved);
    // can't test a resolve with change value since dynamic access to argv and env
});
