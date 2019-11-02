const test = require('ava');
const Configue = require('../src/configue');

const fooTransformer = ({key, value}) => ({key, value: `${value}foo`});
const barTransformer = ({key, value}) => ({key, value: `${value}bar`});

test('transformer can be defined with a single transformer', t => {
  process.argv.push('--one=one');
  const configue = new Configue({transform: fooTransformer});
  process.argv.pop();

  t.is(configue.get('one'), 'onefoo');
});

test('transformer can be defined with ordered transformer', t => {
  process.argv.push('--one=one');
  const configue = new Configue({transform: [fooTransformer, barTransformer]});
  process.argv.pop();

  t.is(configue.get('one'), 'onefoobar');
});

test('transformer can be defined along with normalize', t => {
  process.argv.push('--ONE-TWO=douze');
  const configue = new Configue({
    transform: [fooTransformer, barTransformer],
    normalize: 'camelCase'
  });
  process.argv.pop();

  t.is(configue.get('oneTwo'), 'douzefoobar');
});

test('ignore-prefix works well for a single prefix', t => {
  process.env.MY_SUPER_APP_PORT = '3024';
  const configue = new Configue({ignorePrefix: 'MY_SUPER_APP_'});
  process.env.MY_SUPER_APP_PORT = undefined;

  t.is(configue.get('PORT'), '3024');
});

test('ignore-prefix works well for a multiple prefix', t => {
  process.env.MY_SUPER_APP_PORT = '3024';
  process.env.MY_APP_HOST = 'localhost';
  const configue = new Configue({ignorePrefix: ['MY_SUPER_APP_', 'MY_APP_']});
  process.env.MY_SUPER_APP_PORT = undefined;

  t.is(configue.get('PORT'), '3024');
  t.is(configue.get('HOST'), 'localhost');
});

test('ignore-prefix works well along with other transformers', t => {
  process.env.MY_APP_PORT = '3024';
  process.env.MY_APP_HOST = 'localhost';
  const configue = new Configue({ignorePrefix: 'MY_APP', normalize: 'camelCase'});
  process.env.MY_SUPER_APP_PORT = undefined;

  t.is(configue.get('port'), '3024');
  t.is(configue.get('host'), 'localhost');
});

test('separator can be defined globally for env and argv with a string', t => {
  process.argv.push('--one__two=douze');
  process.env.four__two = '42';
  const configue = new Configue({separator: '__'});
  process.argv.pop();
  process.env.four__two = undefined;

  t.is(configue.get('one:two'), 'douze');
  t.is(configue.get('four:two'), '42');
});

test('separator can be defined globally for env and argv with a regex', t => {
  process.argv.push('--one--two=douze');
  process.env.four__two = '42';
  const configue = new Configue({separator: /--|__/});
  process.argv.pop();
  process.env.four__two = undefined;

  t.is(configue.get('one:two'), 'douze');
  t.is(configue.get('four:two'), '42');
});

test('normalize invalid case are rejected', t => {
  t.throws(() => Configue.normalize('wtfCase').get(), /"normalize" is not allowed/); // FIXME: check test is correct
});

test('normalize works well for argv and env with camelCase', t => {
  process.argv.push('--one-two=douze');
  process.env.FOUR_TWO = '42';
  const configue = Configue.normalize('camelCase').get();
  process.argv.pop();
  process.env.FOUR_TWO = undefined;

  t.is(configue.get('oneTwo'), 'douze');
  t.is(configue.get('fourTwo'), '42');
  t.is(configue.get('one-two'), undefined);
  t.is(configue.get('FOUR_TWO'), undefined);
});

test('normalize works well for argv and env with lowerCase', t => {
  process.argv.push('--one-TWO=douze');
  process.env.FOUR_TWO = '42';
  const configue = Configue.normalize('lowerCase').get();
  process.argv.pop();
  process.env.FOUR_TWO = undefined;

  t.is(configue.get('one two'), 'douze');
  t.is(configue.get('four two'), '42');
  t.is(configue.get('one-two'), undefined);
  t.is(configue.get('FOUR_TWO'), undefined);
});

test('normalize works well along with the separator option', t => {
  process.argv.push('--One--Two=douze');
  process.env.FOUR__TWO = '42';
  process.env.NO_SEP = '__';
  const configue = new Configue({separator: /--|__/, normalize: 'camelCase'});
  process.argv.pop();
  process.env.FOUR__TWO = undefined;
  process.env.NO_SEP = undefined;

  t.is(configue.get('one:two'), 'douze');
  t.is(configue.get('four:two'), '42');
  t.is(configue.get('noSep'), '__');
});

test('normalize works with the env whitelist option', t => {
  process.env.NO_SEP = 'no sep';
  process.env.CAMEL_CASE = 'camelCase';
  const configue = new Configue({
    normalize: 'camelCase',
    env: {
      whitelist: ['NO_SEP', 'CAMEL_CASE']
    }
  });
  process.env.NO_SEP = undefined;
  process.env.CAMEL_CASE = undefined;
  t.is(configue.get('noSep'), 'no sep');
  t.is(configue.get('camelCase'), 'camelCase');
});
