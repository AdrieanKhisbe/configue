const test = require('ava');
const Configue = require('../lib/configue');

test('get is working fine as factory method', t => {
    const configue = Configue.get();
    t.assert(configue instanceof Configue);
});

test('get is reseting the chain', t => {
    const configue1 = Configue.defaults({a: 1}).get();
    const configue2 = Configue.get();
    t.deepEqual(configue2.settings, {});
});

test('options methods sets the good values', t => {
    const configue = Configue.defaults({a: 1})
        .env(['HOME'])
        .defer(true)
        .get();
    t.deepEqual(configue.settings, {
        defaults: {'a': 1},
        defer: true,
        env: ['HOME']
    });
});


test('options methods sets the good values bis', t => {
    const hook = nconf => {};
    const configue = Configue.envHook(hook).argvHook(hook).get();
    t.deepEqual(configue.settings, {
        postHooks: {argv: hook, env: hook}
    });
});

test('withOptions methods sets the good values, does not override existing options', t => {
    const hook = nconf => {};
    const configue = Configue.envHook(hook).withOptions({async: true, shortstop: true}).get();
    t.deepEqual(configue.settings, {
        async: true,
        shortstop: true,
        postHooks: {env: hook}
    });
});

test('resolve method builder with chained then', async t => {
    const configue = await Configue.shortstop(true).resolve();
    t.deepEqual(configue.settings, {
        async: true,
        shortstop: true
    });
    t.assert(configue.resolved);
});

test('resolve method builder with passed continuation', async t => {
    const configue = await Configue.shortstop(true).resolve();
    t.deepEqual(configue.settings, {
        async: true,
        shortstop: true
    });
    t.assert(configue.resolved);
});
