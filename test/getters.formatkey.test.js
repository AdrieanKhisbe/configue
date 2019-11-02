const test = require('ava');
const {formatKey} = require('../lib/configue-getters');

test('does nothing for normal keys', t => {
    t.is(formatKey('toto'), 'toto');
    t.is(formatKey('titi-toto'), 'titi-toto');
});

test('does nothing for nconf keys with ":"', t => {
    t.is(formatKey('toto:titi'), 'toto:titi');
    t.is(formatKey('titi:toto'), 'titi:toto');
});

test('transform keys with dot in them', t => {
    t.is(formatKey('toto.titi'), 'toto:titi');
    t.is(formatKey('titi.toto'), 'titi:toto');
});

test('transform keys passed in an array', t => {
    t.is(formatKey(['toto','titi']), 'toto:titi');
    t.is(formatKey(['titi','toto']), 'titi:toto');
});
