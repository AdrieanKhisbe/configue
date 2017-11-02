'use strict';

const Lab = require('lab');
const {expect} = require('code');

const lab = exports.lab = Lab.script();
const {describe, it} = lab;

const Configue = require('../');

describe('Configue Getters', () => {

    describe('Getter', () => {

        it('get value', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});

            // NOTE: code is interpreted from command line: -a !! (-a code, param of lab)
            expect(configue.get('A')).to.equal('2');
            expect(configue.get('B')).to.equal(42);
            done();

        });

        it('get nested value', (done) => {
            const configue = Configue({defaults: {root: {a: '2', b: 42}}});
            expect(configue.get('root')).to.equal({a: '2', b: 42});
            expect(configue.get('root:a')).to.equal('2');
            expect(configue.get('root:b')).to.equal(42);
            done();
        });

        it('get defaultValue', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.get('C', 'pasdefini')).to.equal('pasdefini');
            done();
        });

        it('get defaultValue if result is set undefined', (done) => {
            const configue = Configue({defaults: {idonotexist: undefined, zero: 0}});
            expect(configue.get('idonotexist', 'unlessItellsSo')).to.contain('unless');
            expect(configue.get('zero', 12)).to.equal(0);
            done();
        });


        it('get first value', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});

            expect(configue.getFirst('A', 'B', 'C')).to.equal('2');
            expect(configue.getFirst('b', 'B')).to.equal(42);
            expect(configue.getFirst('acd', 'C')).to.equal(false);
            expect(configue.getFirst('aa', 'bb', 'cc')).to.equal(undefined);
            done();
        });

        it('get first value from array', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});

            expect(configue.getFirst(['A', 'B', 'C'])).to.equal('2');
            expect(configue.getFirst(['b', 'B'])).to.equal(42);
            expect(configue.getFirst(['acd', 'C'])).to.equal(false);
            expect(configue.getFirst(['aa', 'bb', 'cc'])).to.equal(undefined);
            done();
        });

        it('get all value', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});

            expect(configue.getAll('A', 'B', 'C')).to.equal(['2', 42, false]);
            expect(configue.getAll('b', 'B')).to.equal([undefined, 42]);
            done();
        });

        it('get all value from array', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});

            expect(configue.getAll(['A', 'B', 'C'])).to.equal(['2', 42, false]);
            expect(configue.getAll(['b', 'B'])).to.equal([undefined, 42]);
            done();
        });


        it('get value async with callback', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});
            configue.getAsync('A', (err, res) => {
                expect(err).to.be.null();
                expect(res).to.equal('2');
                done();
            });
        });

        it('get value async without callback (hence returns promise)', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});
            configue.getAsync('A').then(res => {
                expect(res).to.equal('2');
                done();
            });
        });

        it('get value async with default value (hence returns promise)', (done) => {
            const configue = Configue({overrides: {A: '2', B: 42, C: false}});
            configue.getAsync('D', 2).then(res => {
                expect(res).to.equal(2);
                done();
            });
        });
    });

    describe('Loader', () => {

        it('simple load', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});

            const config = configue.load();
            expect(config.A).to.equal('2');
            expect(config.B).to.equal(42);

            done();
        });

        it('load with simple model', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});

            const config = configue.load({a: 'A', b: 'B'});
            expect(config).to.equal({a: '2', b: 42});

            done();
        });

        it('load with complex model', (done) => {
            const configue = Configue({defaults: {A: {a: 1, b: 2}, B: 42}});

            const config = configue.load({a: 'A:a', b: {b: 'B'}});
            expect(config).to.equal({a: 1, b: {b: 42}});

            done();
        });

        it('load with complex model and multiple values', (done) => {
            const configue = Configue({defaults: {A: {a: 1, b: 2}, B: 42}});

            const config = configue.load({a: ['a:a', 'A:a'], b: {b: ['B', 'A']}});
            expect(config).to.equal({a: 1, b: {b: 42}});

            done();
        });

        it('load with complex model and multiple values', (done) => {
            const configue = Configue({defaults: {A: {a: 1, b: 2}, B: 42}});

            const config = configue.load(c => ({a: c('A:a'), b: c.t`answer is ${'B'}`}));
            expect(config).to.equal({a: 1, b: 'answer is 42'});

            done();
        });
    });

    describe('template', () => {

        it('basic template', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.template`answer to life is ${'B'}`).to.equal('answer to life is 42');
            done();
        });

        it('basic template via alias', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.t`1+1=${'A'}`).to.equal('1+1=2');
            done();
        });

        it('basic template with default', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.t({A: 4, C: 1})`1+${'C'}=${'A'}`).to.equal('1+1=2');
            done();
        });

        it('complex template, object not handled for now', (done) => {
            const configue = Configue({defaults: {A: '2', B: {b: 'b', c: 2}}});
            expect(configue.t`1+${'B'}=Nan`).to.equal('1+[object Object]=Nan');
            done();
        });

    });

    describe('getObject', () => {

        it('basic getObject', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.getObject('A', 'B')).to.equal({A: '2', B: 42});
            done();
        });

        it('basic getObject from array', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.getObject(['A', 'B'])).to.equal({A: '2', B: 42});
            done();
        });

        it('basic getObject with rename', (done) => {
            const configue = Configue({defaults: {A: '2', B: 42}});
            expect(configue.getObject(['A', 'a'], 'B')).to.equal({a: '2', B: 42});
            done();
        });

        it('complex getObject with rename', (done) => {
            const configue = Configue({defaults: {A: {alpha: 2, beta: 4}, B: 42}});
            expect(configue.getObject(['A:alpha', 'alpha'], ['B', 'beta'])).to.equal({alpha: 2, beta: 42});
            done();
        });

    });

});
