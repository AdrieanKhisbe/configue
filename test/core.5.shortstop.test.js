const test = require('ava');
const Configue = require('../src');

test('shortstop performs transformation as expected', async t => {
  const configue = await Configue.shortstop(true)
    .defaults({b64: 'base64:YmFzZTY0'})
    .resolve();
  t.is(configue.get('b64'), 'base64');
});

test('shortstop dont perform transformation when not activated', async t => {
  const configue = await Configue.shortstop(false)
    .defaults({b64: 'base64:YmFzZTY0'})
    .resolve();
  t.is(configue.get('b64'), 'base64:YmFzZTY0');
});
test('shortstop does not include protocols if defaults deactivated', async t => {
  const configue = await Configue.shortstop({noDefaultProtocols: true})
    .defaults({b64: 'base64:YmFzZTY0'})
    .resolve();
  t.is(configue.get('b64'), 'base64:YmFzZTY0');
});

test('shortstop trigger an error if resolve fail', async t => {
  await t.throwsAsync(
    () =>
      Configue.shortstop(true)
        .defaults({file: 'file:/does/not/exist'})
        .resolve(),
    "ENOENT: no such file or directory, open '/does/not/exist'"
  );
});
