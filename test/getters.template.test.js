const test = require('ava');
const Configue = require('../src');

test('basic template', t => {
  const configue = Configue({defaults: {A: '2', B: 42}});
  t.is(configue.template`answer to life is ${'B'}`, 'answer to life is 42');
});

test('basic template via alias', t => {
  const configue = Configue({defaults: {A: '2', B: 42}});
  t.is(configue.t`1+1=${'A'}`, '1+1=2');
});

test('basic template with default', t => {
  const configue = Configue({defaults: {A: '2', B: 42}});
  t.is(configue.t({A: 4, C: 1})`1+${'C'}=${'A'}`, '1+1=2');
});

test('complex template, object not handled for now', t => {
  const configue = Configue({defaults: {A: '2', B: {b: 'b', c: 2}}});
  t.is(configue.t`1+${'B'}=Nan`, '1+[object Object]=Nan');
});
