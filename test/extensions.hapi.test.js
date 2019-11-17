const test = require('ava');
const _ = require('lodash/fp');
const Configue = require('../src');

test.cb('hapi should register correctly', t => {
  t.plan(6);
  const server = {
    log() {},
    decorate(type, decorateName, configGetter) {
      t.assert(/server|request/.test(type));
      t.is(decorateName, 'configue');
      t.true(_.isFunction(configGetter));
    }
  };
  const plugin = new Configue().plugin();
  plugin(server, {}, t.end);
});

test.cb('hapi should register with a custom name correctly', t => {
  t.plan(6);
  const server = {
    log() {},
    decorate(type, decorateName, configGetter) {
      t.assert(/server|request/.test(type));
      t.is(decorateName, 'conf');
      t.true(_.isFunction(configGetter));
    }
  };
  const plugin = new Configue().plugin('conf');
  plugin(server, {}, t.end);
});

test.cb('hapi should register after sync resolve', t => {
  t.plan(4);
  const server = {
    log() {},
    decorate(type) {
      t.assert(/server|request/.test(type));
    }
  };
  const configue = new Configue({defer: true});
  t.is(configue.resolved, false);
  const plugin = configue.plugin();
  plugin(server, {}, err => {
    try {
      if (err) throw err;
      t.is(configue.resolved, true);
      t.end();
    } catch (error) {
      t.end(error);
    }
  });
});

test.cb('hapi should register after async resolve', t => {
  t.plan(4);
  const server = {
    log() {},
    decorate(type) {
      t.assert(/server|request/.test(type));
    }
  };
  const configue = new Configue({async: true});
  t.is(configue.resolved, false);
  const plugin = configue.plugin();
  plugin(server, {}, err => {
    try {
      if (err) throw err;
      t.is(configue.resolved, true);
      t.end();
    } catch (error) {
      t.end(error);
    }
  });
});

test('Hapi17 can be (fakely) registered ', t => {
  t.plan(2);
  const configue = new Configue();
  const server = {
    log() {},
    decorate(type) {
      t.assert(/server|request/.test(type));
    }
  };
  configue.plugin17().register(server);
});

test('Hapi17 handle failure in the resolve', t => {
  const configue = Configue({
    defer: true,
    customWorkflow: () => {
      throw new Error('init failed');
    }
  });
  const server = {};
  t.throws(() => configue.plugin17().register(server), 'init failed');
});
