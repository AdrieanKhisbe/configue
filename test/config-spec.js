'use strict';

const Lab = require('lab');
const Code = require('code');
const path = require('path');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Hapi = require('hapi');
const Configue = require('../');

const JSON_CONF_FILE = path.join(__dirname, "data/config.json");
const JSON_CONF_FILE_BIS = path.join(__dirname, "data/config-bis.json");
const YAML_CONF_FILE = path.join(__dirname, "data/config.yaml");

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


describe('Configue Options', () => {

    describe('Files', () => {

        it('can load data from a json file given as string', (done)=> {
            const server = new Hapi.Server();
            server.connection();
             const configueOptions = {files: JSON_CONF_FILE};
            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('key')).to.equal('json-config');
                done();
            });
        });

        it('can load data from a json files given as string array', (done)=> {
            const server = new Hapi.Server();
            server.connection();
            const configueOptions = {files: [JSON_CONF_FILE, JSON_CONF_FILE_BIS]};
            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('key')).to.equal('json-config');
                expect(server.configue('key-bis')).to.equal('json-config-bis');
                done();
            });
        });

        it('can load data from a json file', (done)=> {
            const server = new Hapi.Server();
            server.connection();

            const configueOptions = {files: [{file: JSON_CONF_FILE}]};
            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('key')).to.equal('json-config');
                done();
            });
        });

        it('can load data from a yaml file', (done)=> {
            const server = new Hapi.Server();
            server.connection();
            const configueOptions = {
                files: [{
                    file: YAML_CONF_FILE,
                    format: require('nconf-yaml')
                }]
            };
            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('key')).to.equal('yaml-config');
                done();
            });
        });

        it('files are loaded in order', (done)=> {
            const server = new Hapi.Server();
            server.connection();

            const configueOptions = {
                files: [{file: JSON_CONF_FILE},
                    {
                        file: YAML_CONF_FILE,
                        format: require('nconf-yaml')
                    }]
            };
            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('key')).to.equal('json-config');
                done();
            });
        });

    });


    describe('Disable', () => {

        it('enable to disable argv', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configueOptions = {disable: {argv: true}};
            process.argv.push('--who=YO');
            process.env.who = 'NO';
            // RISKY!!!!

            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
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
                    argv: function postArgv(nconf, done) {
                        nconf.set('who', 'ME FIRST!');
                        nconf.set('when', 'NOW');
                        return done();
                    },
                    default: function last(nconf, done) {
                        nconf.set('when', 'RIGHT '+nconf.get('when'));
                        done()
                    }
                }
            };
            process.argv.push('--when=later');
            process.env.who = 'me';
            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('who')).to.equal('ME FIRST!');
                expect(server.configue('when')).to.equal('RIGHT NOW');
                done();
            });
        });
    });

    describe('CustomWorkflow', () => {

        it('accept a custom workflow', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configueOptions = {customWorkflow: function(nconf, done){
                nconf.set('workflow', 'custom');
                return done();
            }};
            process.argv.push('--workflow=default');
            process.env.key = 'value';

            server.register({register: Configue, options: configueOptions}, (err) => {
                expect(err).to.not.exist();
                expect(server.configue('workflow')).to.equal('custom');
                expect(server.configue('key')).to.not.exist();
                done();
            });
        })

    });

});



