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
            defaults: {
                'a': 1
            },
            defer: true,
            env: [
                'HOME'
            ]
        });
        done();

    });


    it('options methods sets the good values bis', (done) => {
        const hook = nconf => {};
        const configue = Configue.envHook(hook).argvHook(hook).get();
        expect(configue.settings).to.equal({
            postHooks: {
                argv: hook,
                env: hook
            }
        });
        done();
    });

    it('withOptions methods sets the good values, does not override existing options', (done) => {
        const hook = nconf => {};
        const configue = Configue.envHook(hook).withOptions({async: true, shortstop: true}).get();
        expect(configue.settings).to.equal({
            async: true,
            shortstop: true,
            postHooks: {
                env: hook
            }
        });
        done();
    });

    it('resolve method builder with chained then', (done) => {
        Configue.shortstop(true).resolve().then(configue => {
                expect(configue.settings).to.equal({
                    async: true,
                    shortstop: true
                });
                expect(configue.resolved).to.be.true();
                done();
            }
        );
    });

    it('resolve method builder with passed continuation', (done) => {
        Configue.shortstop(true).resolve(configue => {
                expect(configue.settings).to.equal({
                    async: true,
                    shortstop: true
                });
                expect(configue.resolved).to.be.true();
                done();
            }
        );
    });


});
