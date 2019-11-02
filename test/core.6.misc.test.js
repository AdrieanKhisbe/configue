const test = require('ava');
const Configue = require('../src');

// argv-env-access-and-prefedined-models

test('argv can be directly accessed from the configue', t => {
  process.argv.push('--one=two');
  const configue = Configue.get();
  process.argv.pop();
  t.is(configue.argv.one, 'two');
});

test('argv cannot be directly accessed if custom workflow is used', t => {
  const configue = new Configue({customWorkflow: nconf => nconf.set('workflow', 'custom')});
  t.assert(configue.argv === undefined);
});

test('argv can be directly accessed if custom workflow set a _yargs', t => {
  const configue = new Configue({customWorkflow: nconf => (nconf._yargs = {argv: 'stub'})});
  t.is(configue.argv, 'stub');
});

test('env can be directly accessed', t => {
  process.env.universe = '42';
  const configue = new Configue();
  t.is(configue.env.universe, '42');
  process.env.universe = undefined;
});

test('aliases can be simply defined', t => {
  const configue = new Configue({
    defaults: {A: {a: 1, b: 2}, B: 42},
    models: {
      universe: c => ({a: c('A:a'), b: c.t`the answer is ${'B'}`}),
      simple: {a: 'A:a', b: ['B:b', 'A:b']}
    }
  });
  t.deepEqual(configue._.simple, {a: 1, b: 2});
  t.deepEqual(configue._.universe, {a: 1, b: 'the answer is 42'});
});
