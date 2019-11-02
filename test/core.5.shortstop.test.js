const test = require('ava');
const Configue = require('../src');

for (const protocolLib of ['shortstop', 'protocall']) {
  // temporary test duplication waiting for shortstop config name to be deprecated
  test(`${protocolLib} performs transformation as expected`, async t => {
    const configue = await Configue[protocolLib](true)
      .defaults({b64: 'base64:YmFzZTY0'})
      .resolve();
    t.is(configue.get('b64'), 'base64');
  });

  test(`${protocolLib} dont perform transformation when not activated`, async t => {
    const configue = await Configue[protocolLib](false)
      .defaults({b64: 'base64:YmFzZTY0'})
      .resolve();
    t.is(configue.get('b64'), 'base64:YmFzZTY0');
  });
  test(`${protocolLib} does not include protocols if defaults deactivated`, async t => {
    const configue = await Configue[protocolLib]({noDefaultProtocols: true})
      .defaults({b64: 'base64:YmFzZTY0'})
      .resolve();
    t.is(configue.get('b64'), 'base64:YmFzZTY0');
  });

  test(`${protocolLib} trigger an error if resolve fail`, async t => {
    await t.throwsAsync(
      () =>
        Configue[protocolLib](true)
          .defaults({file: 'file:/does/not/exist'})
          .resolve(),
      "ENOENT: no such file or directory, open '/does/not/exist'"
    );
  });
}
