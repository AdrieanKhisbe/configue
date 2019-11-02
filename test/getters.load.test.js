const test = require('ava');
const Configue = require('../src');

test('simple load', t => {
  const configue = Configue({defaults: {A: '2', B: 42}});

  const config = configue.load();
  t.is(config.A, '2');
  t.is(config.B, 42);
});

test('load with simple model', t => {
  const configue = Configue({defaults: {A: '2', B: 42}});

  const config = configue.load({a: 'A', b: 'B'});
  t.deepEqual(config, {a: '2', b: 42});
});

test('load with complex model', t => {
  const configue = Configue({defaults: {A: {a: 1, b: 2}, B: 42}});

  const config = configue.load({a: 'A:a', b: {b: 'B'}});
  t.deepEqual(config, {a: 1, b: {b: 42}});
});

test('load with complex model and multiple values', t => {
  const configue = Configue({defaults: {A: {a: 1, b: 2}, B: 42}});

  const config = configue.load({a: ['a:a', 'A:a'], b: {b: ['B', 'A']}});
  t.deepEqual(config, {a: 1, b: {b: 42}});
});

test('load with complex model and multiple values (using template)', t => {
  const configue = Configue({defaults: {A: {a: 1, b: 2}, B: 42}});

  const config = configue.load(c => ({a: c('A:a'), b: c.t`answer is ${'B'}`}));
  t.deepEqual(config, {a: 1, b: 'answer is 42'});
});
