const test = require('ava');
const Configue = require('../src');

test('enable to disable argv', t => {
  process.argv.push('--who=YO');
  process.env.who = 'NO';
  // RISKY!!!!

  const configue = Configue({disable: {argv: true}});
  process.argv.pop();
  process.env.who = undefined;
  t.is(configue.get('who'), 'NO');
});

test('enable to disable env', t => {
  process.env.who = 'NONO';
  // RISKY!!!!

  const configue = Configue({disable: {env: true}, defaults: {who: 'YES YES'}});
  process.env.who = undefined;
  t.is(configue.get('who'), 'YES YES');
});

test('enable to disabLe env in async mode', async t => {
  process.argv.push('--who=YO');
  process.env.who = 'NO';
  // RISKY!!!!

  const configue = await Configue.withOptions({disable: {argv: true, env: true}}).resolve();
  process.argv.pop();
  process.env.who = undefined;

  t.is(configue.get('who'), undefined);
});

test('accept a custom workflow', t => {
  const configueOptions = {
    customWorkflow: nconf => nconf.set('workflow', 'custom')
  };
  process.argv.push('--workflow=default');
  process.env.key = 'value';

  const configue = Configue(configueOptions);
  process.argv.pop();
  process.env.KEY = undefined;

  t.is(configue.get('workflow'), 'custom');
  t.falsy(configue.get('key'));
});

test('accept an async custom workflow', async t => {
  const configueOptions = {
    customWorkflow: nconf =>
      Promise.resolve('custom-async').then(workflow => nconf.set('workflow', workflow))
  };
  process.argv.push('--workflow=default');
  process.env.key = 'value';

  const configue = await Configue.withOptions(configueOptions).resolve();
  process.argv.pop();
  process.env.key = undefined;
  t.is(configue.get('workflow'), 'custom-async');
  t.assert(!configue.get('key'));
});

test('enable to insert hook', t => {
  const configueOptions = {
    postHooks: {
      overrides: function postOverrides(nconf) {
        nconf.set('who', 'ME FIRST!');
      },
      argv: function postArgv(nconf) {
        nconf.set('when', 'NOW');
      },
      defaults: function last(nconf) {
        nconf.set('when', `RIGHT ${nconf.get('when')}`);
      }
    }
  };
  process.argv.push('--when=later');
  process.env.who = 'me';

  const configue = Configue(configueOptions);
  t.is(configue.get('who'), 'ME FIRST!');
  t.is(configue.get('when'), 'RIGHT NOW');
});

test('first hook is runned to insert hook', t => {
  const configueOptions = {
    overrides: {who: 'ME second!'},
    postHooks: {
      first: function first(nconf) {
        nconf.set('who', 'ME FIRST!');
        nconf.set('when', 'RIGHT NOW!');
      }
    }
  };
  process.env.who = 'me';

  const configue = Configue(configueOptions);
  process.env.who = undefined;
  t.is(configue.get('who'), 'ME FIRST!');
  t.is(configue.get('when'), 'RIGHT NOW!');
});

test('handle error in loading process', t => {
  t.throws(() =>
    Configue({
      postHooks: {
        argv: function postArgv() {
          throw new Error('This is an error');
        }
      }
    })
  );
});
