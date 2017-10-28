'use strict';

const Lab = require('lab');
const {expect} = require('code');

const lab = exports.lab = Lab.script();
const {describe, it, before} = lab;

const Configue = require('../');

describe('Fluent builder', () => {
    it('get is working fine as factory method', (done) => {
        const configue = Configue.get();
        expect(configue instanceof Configue).to.be.true();
        done();
    });

    it('get is reseting the chain', (done) => {
        const configue1 = Configue.defaults({a: 1}).get();
        const configue2 = Configue.get();
        expect(configue2.settings).to.equal({});
        done();
    });

    it('options methods sets the good values', (done) => {
        const configue = Configue.defaults({a: 1})
            .env(['HOME'])
            .defer(true)
            .get();
        expect(configue.settings).to.equal({
            'defaults': {
                'a': 1
            },
            defer: true,
            'env': [
                'HOME'
            ]
        });
        done();

    });

    it('options methods sets the good values', (done) => {
        const hook = nconf => {};
        const configue = Configue.argvHook(hook).envHook(hook).get();
        expect(configue.settings).to.equal({
            'postHooks': {
                'argv': hook,
                'env': hook
            }
        });
        done();
    });
});
