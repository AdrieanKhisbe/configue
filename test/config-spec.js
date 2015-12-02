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
        server.register({register: Configue, options: {'this': 'is-junk'}}, (err) => {
            expect(err).to.exist();
            done();
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


describe('Disable', () => {

    it('enable to disable argv', (done) => {
        const server = new Hapi.Server();
        server.connection();

        const configueOptions = { disable: {argv: true}};
        process.argv.push('--who=YO');
        process.env.who = 'NO';
        // RISKY!!!!

        server.register({register: Configue, options: configueOptions}, (err) => {
            if (err) return console.log('Error loading plugins');

            expect(server.configue('who')).to.equal('NO');
            done();
        });
    })


});


describe('Post Hooks', () => {

    it('enable to insert hook', (done)=> {
        const server = new Hapi.Server();
        server.connection();

        const configueOptions = {
            postHooks: {
                argv: function postArgv(nconf) {
                    nconf.set('who', 'ME FIRST!');
                    nconf.set('when', 'NOW');
                }
            }
        };
        process.argv.push('--when=later');
        process.env.who = 'me';
        server.register({register: Configue, options: configueOptions}, (err) => {
            if (err) return console.log('Error loading plugins');

            expect(server.configue('who')).to.equal('ME FIRST!');
            expect(server.configue('when')).to.equal('NOW');
            done();
        });
    });

    it('enable to insert hook arrays, that are run in order', (done)=> {
        const server = new Hapi.Server();
        server.connection();

        process.env['x'] = 3;
        const configueOptions = {
            postHooks: {
                env: [function (nconf) {
                    const tmp =  nconf.get('x');
                    nconf.set('x', tmp * 10)
                }, function (nconf) {
                    const tmp =  nconf.get('x');
                    nconf.set('x', tmp + 12)
                }]
            }
        };
        server.register({register: Configue, options: configueOptions}, (err) => {
            if (err) return console.log('Error loading plugins');

            expect(server.configue('x')).to.equal(42);
            done();
        });
    });
});

