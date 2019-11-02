const test = require('ava');
const _ = require('lodash/fp');
const Configue = require('../src/configue');

test.cb('expose configue handler', t => {
  const configue = new Configue({defaults: {r: 2, d: 2}});
  const middleware = configue.middleware();

  const req = {},
    res = {};
  middleware(req, res, () => {
    t.deepEqual(res, {});
    t.assert(_.isFunction(req.configue));
    t.assert(_.isFunction(req.configue.get));
    t.assert(_.isFunction(req.configue.t));
    t.is(req.configue('r'), 2);
    t.end();
  });
});

test.cb('expose configue handler with a custom name', t => {
  const configue = new Configue({defaults: {r: 2, d: 2}});
  const middleware = configue.middleware('conf');

  const req = {},
    res = {};
  middleware(req, res, () => {
    t.deepEqual(res, {});
    t.assert(_.isFunction(req.conf));
    t.assert(_.isFunction(req.conf.get));
    t.assert(_.isFunction(req.conf.t));
    t.is(req.conf('r'), 2);
    t.end();
  });
});
