const test = require('ava');
const _ = require('lodash/fp');
const Hapi = require('hapi');
const Configue = require('../src/configue');

test.cb('hapi register expose configue handler', t => {
  const server = new Hapi.Server();
  server.connection();
  const configue = Configue();

  server.register({register: configue.plugin()}, err => {
    t.assert(!err);
    t.assert(server.configue);
    t.assert(_.isFunction(server.configue));
    t.end();
  });
});

test.cb('hapi register expose configue handler with a custom name', t => {
  const server = new Hapi.Server();
  server.connection();
  const configue = Configue();

  server.register({register: configue.plugin('conf')}, err => {
    t.assert(!err);
    t.assert(server.conf);
    t.assert(_.isFunction(server.conf));
    return t.end();
  });
});

test.cb('hapi register take care to do the resolve if needed', t => {
  const server = new Hapi.Server();
  server.connection();

  const configue = Configue({defaults: {un: 1}});
  server.register({register: configue.plugin()}, err => {
    t.assert(!err);
    t.assert(server.configue);
    t.assert(_.isFunction(server.configue));
    t.is(server.configue('un'), 1);
    return t.end();
  });
});

test.cb('hapi register handle failure in the resolve', t => {
  const server = new Hapi.Server();
  server.connection();

  const configue = Configue({
    defer: true,
    customWorkflow: () => {
      throw new Error('init failed');
    }
  });
  server.register({register: configue.plugin()}, err => {
    t.assert(err);
    t.is(err.message, 'init failed');
    return t.end();
  });
});

test.cb('hapi requests has access to configue', t => {
  const server = new Hapi.Server();
  server.connection();

  const configue = Configue({defaults: {one: 1}});
  server.register({register: configue.plugin()}, err => {
    t.assert(!err);

    server.route({
      method: 'GET',
      path: '/',
      handler(request) {
        t.assert(request.configue);
        t.assert(_.isFunction(request.configue));
        t.is(request.configue('one'), 1);
        return t.end();
      }
    });
    server.inject('/');
  });
});

test.cb('hapi request has access to configue with a custom name', t => {
  const server = new Hapi.Server();
  server.connection();

  const configue = Configue({defaults: {one: 1}});

  server.register({register: configue.plugin('config')}, err => {
    t.assert(!err);
    server.route({
      method: 'GET',
      path: '/',
      handler(request) {
        t.assert(request.config);
        t.assert(_.isFunction(request.config));
        t.is(request.config('one'), 1);
        return t.end();
      }
    });
    server.inject('/');
  });
});

test.cb('hapi request has access to configue sub accessors', t => {
  const server = new Hapi.Server();
  server.connection();

  const configue = Configue({overrides: {a: 1, b: 2, c: 3}});

  server.register({register: configue.plugin()}, err => {
    t.assert(!err);
    server.route({
      method: 'GET',
      path: '/',
      handler(request) {
        try {
          t.assert(request.configue.get);
          t.assert(_.isFunction(request.configue.get));
          t.is(request.configue.get('a'), 1);

          t.assert(request.configue.getFirst);
          t.assert(_.isFunction(request.configue.getFirst));
          t.is(request.configue.getFirst('aa', 'b'), 2);

          t.assert(request.configue.getAll);
          t.assert(_.isFunction(request.configue.getAll));
          t.deepEqual(request.configue.getAll('a', 'b', 'c'), [1, 2, 3]);
        } catch (err) {
          return t.end(err);
        }
        return t.end();
      }
    });
    server.inject('/');
  });
});

test('Hapi17 can be (fakely) regiistered ', t => {
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
