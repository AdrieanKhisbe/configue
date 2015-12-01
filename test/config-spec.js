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
           // expect(server.configue).to.be.a.function();
        });

    });
});

describe('Request', () => {

    it('has access to configue', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register({register: Configue}, (err) => {

            expect(err).to.not.exist();

            server.route({method: 'GET', path: '/', handler: function(request, reply){}});

            server.inject('/', (res) => {
                expect(res.configue).to.exist();
                expect(res.configue).to.be.a.function();

                done();
            });
        });
    });
});

