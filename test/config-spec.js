'use strict';

const Lab = require('lab');
const Code = require('code');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Hapi = require('hapi');
const Configue = require('../');

function testWithServer(body){
    const server = new Hapi.Server();
    server.connection();
    server.register({register: Configue}, body);
}

function testWithServerAndOptions(body, options){
    const server = new Hapi.Server();
    server.connection();
    server.register({register: Configue, options: options}, body);
}





describe('Register', () => {
    it('expose configue handler', (done) => {
        testWithServer((err) => {

            expect(err).to.not.exist();

            expect(server.configue).to.exist();
            expect(server.configue).to.be.a.function();
            return done();
        });
    });

    it('detect wrong option item', (done) => {
        testWithServerAndOptions({'this':'is-junk'}, (err) => {
            expect(err).to.exist();
            done();
        });
    });
});


describe('Request', () => {

    it('has access to configue', (done) => {
        testWithServer((err) => {

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


describe('Disable', () => {

});


describe('Post Hooks', () => {

    
});

