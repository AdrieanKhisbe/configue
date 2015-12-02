'use strict';

const Lab = require('lab');
const Code = require('code');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Hapi = require('hapi');
const Configue = require('../');

describe('Register', () => {
    it('expose configue handler', (done) => {
        const server = new Hapi.Server();
        server.connection();

        server.register({register: Configue}, (err) => {

            expect(err).to.not.exist();

            expect(server.configue).to.exist();
            expect(server.configue).to.be.a.function();
            return done();
        });

    });

    it('detect wrong option item', (done) => {
        const server = new Hapi.Server();
        server.connection();
        server.register({register: Configue, options: {'this':'is-junk'}}, (err) => {
            expect(err).to.exist();
        });

    });
});

describe('Request', () => {

    it('has access to configue', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register({register: Configue}, (err) => {

            expect(err).to.not.exist();

            server.route({
                method: 'GET', path: '/', handler: function (request, reply) {
                    expect(request.configue).to.exist();
                    expect(request.configue).to.be.a.function();
                    return done();
                }
            });

            server.inject('/');
        });
    });
});

