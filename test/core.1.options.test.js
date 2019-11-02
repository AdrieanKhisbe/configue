const test = require('ava');
const Yargs = require('yargs');
const Configue = require('../src/configue');

test('detect wrong option item', t => {
  t.throws(() => Configue({this: 'is-junk'}));
});
// TODO maybe add some valid schema
test('presevent usage of shortstop without async mode', t => {
  t.throws(() => Configue({shortstop: true}), 'Shortstop usage requires async mode');
});

test('argv are forwarded to nconf', t => {
  const configue = Configue({argv: {key: {default: 'some-value'}}});
  t.is(configue.get('key'), 'some-value');
});

test('argv can be a yargs instance', t => {
  const configue = Configue({argv: Yargs(process.argv.slice(2)).defaults('toto', 'titi')});
  t.is(configue.get('toto'), 'titi');
});

test('env config are forwarded to nconf if whitelist', t => {
  const configue = Configue({env: ['PWD']});
  t.assert(configue.get('HOME') === undefined);
});

test('env config are forwarded to nconf if object', t => {
  const configue = Configue({env: {whitelist: ['HOME']}});
  t.assert(configue.get('PWD') === undefined);
});

test('required keys are enforced by nconf', t => {
  t.throws(
    () =>
      Configue.defaults({A: 1})
        .required(['A', 'B'])
        .get(),
    'Missing required keys: B'
  );
});

test('required keys are enforced by nconf does not false alarm', t => {
  Configue.defaults({A: 1, B: 2, C: 3})
    .required(['A', 'B'])
    .get();
  t.pass();
});

test('parse is activated', t => {
  process.argv.push('--one=2');
  process.env.universe = '42';
  const configue = Configue.parse(true).get();
  process.argv.pop();
  process.env.universe = undefined;
  t.is(configue.get('one'), 2);
  t.is(configue.get('universe'), 42);
});

test('parse and transform are activated', t => {
  process.argv.push('--one=2');
  const configue = Configue.parse(true)
    .transform(({key, value}) => ({key, value: `this is ${value + 2}`}))
    .get();
  process.argv.pop();
  t.is(configue.get('one'), 'this is 4');
});

test('can load a default object', t => {
  const configue = Configue({defaults: {one: 1}});
  t.is(configue.get('one'), 1);
});

test('defaults are loaded in order', t => {
  const configue = Configue({
    defaults: [{one: 1}, {one: 2, two: 2}]
  });
  t.is(configue.get('one'), 1);
  t.is(configue.get('two'), 2);
});

test('overrides can be defined', t => {
  const configue = Configue({overrides: {one: 1}});
  t.is(configue.get('one'), 1);
});

test('overrides are not overidden', t => {
  process.argv.push('--one=2');
  const configue = Configue({overrides: {one: 1}});
  process.argv.pop();
  t.is(configue.get('one'), 1);
});
