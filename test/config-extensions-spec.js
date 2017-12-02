'use strict';

const Lab = require('lab');
const {expect}  = require('code');

const lab = exports.lab = Lab.script();
const {describe, it} = lab;

const Hapi = require('hapi');
const Configue = require('../');

describe('Hapi plugin', () => {
    describe('Register', () => {
        it('expose configue handler', (done) => {
            const server = new Hapi.Server();
            server.connection();
            const configue = Configue();

            server.register({register: configue.plugin()}, (err) => {
                 expect(err).to.not.exist();
                 expect(server.configue).to.exist();
                 expect(server.configue).to.be.a.function();
                 done();
            });
        });

        it('expose configue handler with a custom name', (done) => {
            const server = new Hapi.Server();
            server.connection();
            const configue = Configue();

            server.register({register: configue.plugin('conf')}, (err) => {
                expect(err).to.not.exist();
                expect(server.conf).to.exist();
                expect(server.conf).to.be.a.function();
                return done();
            });
        });

        it('take care to do the resolve if needed', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configue = Configue({defaults: {un: 1}});
            server.register({register: configue.plugin()}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue).to.exist();
                expect(server.configue).to.be.a.function();
                expect(server.configue('un')).to.equal(1);
                return done();
            });
        });

        it('handle failure in the resolve', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configue = Configue({defer: true, customWorkflow: nconf => {throw new Error('init failed');}});
            server.register({register: configue.plugin()}, (err) => {
                expect(err).to.exist();
                expect(err.message).to.equal('init failed');
                return done();
            });
        });
    });
    describe('Request', () => {

        it('has access to configue', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configue = Configue({defaults: {one: 1}});
            server.register({register: configue.plugin()}, (err) => {
                expect(err).to.not.exist();

                server.route({
                    method: 'GET', path: '/', handler: function (request, reply) {
                        expect(request.configue).to.exist();
                        expect(request.configue).to.be.a.function();
                        expect(request.configue('one')).to.equal(1);
                        return done();
                    }
                });
                server.inject('/');
                });
            });

        it('has access to configue with a custom name', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configue = Configue({defaults: {one: 1}});

            server.register({register: configue.plugin('config')}, (err) => {

                expect(err).to.not.exist();
                server.route({
                    method: 'GET', path: '/', handler: function (request, reply) {
                        expect(request.config).to.exist();
                        expect(request.config).to.be.a.function();
                        expect(request.config('one')).to.equal(1);
                        return done();
                    }
                });
                server.inject('/');
            });
        });

        it('has access to configue sub accessors', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configue = Configue({overrides: {a: 1, b: 2, c: 3}});

            server.register({register: configue.plugin()}, (err) => {
                expect(err).to.not.exist();
                server.route({
                    method: 'GET', path: '/', handler: function (request, reply) {
                        try {
                            expect(request.configue.get).to.exist();
                            expect(request.configue.get).to.be.a.function();
                            expect(request.configue.get('a')).to.equal(1);

                            expect(request.configue.getFirst).to.exist();
                            expect(request.configue.getFirst).to.be.a.function();
                            expect(request.configue.getFirst('aa', 'b')).to.equal(2);

                            expect(request.configue.getAll).to.exist();
                            expect(request.configue.getAll).to.be.a.function();
                            expect(request.configue.getAll('a', 'b', 'c')).to.equal([1, 2, 3]);
                        } catch(err) {
                            return done(err);
                        }
                        return done();
                    }
                });
                server.inject('/');
            });
        });
    });
    describe('Hapi17', () => {
        it('can be (fakely) regiistered ', (done) => {
            const configue = new Configue();
            const server = {log(){}, decorate(type){ expect(type).to.match(/server|request/)}};
            configue.plugin17().register(server);
            done();
        });
        it('handle failure in the resolve', (done) => {
            const configue = Configue({defer: true, customWorkflow: nconf => {throw new Error('init failed');}});
            const server = {};
            try {
                configue.plugin17().register(server);
                done(new Error('exception was not triggered'));
            } catch(err) {
                expect(err.message).to.equal('init failed');
                done();
            }
        });
    });
});

describe('Express MiddleWare', () => {
    it('expose configue handler', (done) => {
        const configue = new Configue({defaults: {r: 2, d: 2}});
        const middleware = configue.middleware();

        const req = {}, res = {};
        middleware(req, res, () => {
            expect(res).to.equal({});
            expect(req.configue).to.be.a.function();
            expect(req.configue.get).to.be.a.function();
            expect(req.configue.t).to.be.a.function();
            expect(req.configue('r')).to.equal(2);
            done();
        });
    });

    it('expose configue handler with a custom name', (done) => {
        const configue = new Configue({defaults: {r: 2, d: 2}});
        const middleware = configue.middleware('conf');

        const req = {}, res = {};
        middleware(req, res, () => {
            expect(res).to.equal({});
            expect(req.conf).to.be.a.function();
            expect(req.conf.get).to.be.a.function();
            expect(req.conf.t).to.be.a.function();
            expect(req.conf('r')).to.equal(2);
            done();
        });
    });

});
