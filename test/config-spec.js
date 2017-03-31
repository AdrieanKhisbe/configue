'use strict';

const Lab = require('lab');
const Code = require('code');
const path = require('path');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const expect = Code.expect;

const Hapi = require('hapi');
const Configue = require('../');

const JSON_CONF_FILE = path.join(__dirname, "data/config.json");
const JSON_CONF_FILE_BIS = path.join(__dirname, "data/config-bis.json");
const YAML_CONF_FILE = path.join(__dirname, "data/config.yaml");

describe('Configue Options', () => {

    const configueTest = (configueOptions, callback) => {
        const configue = Configue(configueOptions)
        configue.resolve((err, other) => callback(configue, err, other));
    }

    describe('Schema', () => {
        it('detect wrong option item', (done) => {
            try {
                const configue = Configue({'this': 'is-junk'})
                done(new Error('Exception not triggered'))
            } catch (err) {
                done()
            }
        })
    })

    describe('Getter', () => {

        it('get value', (done) =>{
            configueTest({defaults: {A: '2', B: 42 }}, (configue, err) => {
                expect(err).to.not.exist();
                // NOTE: code is interpreted from command line: -a !!
                expect(configue.get('A')).to.equal('2');
                expect(configue.get('B')).to.equal(42);
                done();
            });
        });

        it('get nested value', (done) =>{
            configueTest({defaults: {root: {a: '2', b: 42}}}, (configue, err) => {
                expect(err).to.not.exist();

                expect(configue.get('root')).to.deep.equal({a: '2', b: 42 });
                expect(configue.get('root:a')).to.equal('2');
                expect(configue.get('root:b')).to.equal(42);
                done();
            });
        });

        it('get defaultValue', (done) =>{
            configueTest({defaults: {A: '2', B: 42}}, (configue, err) => {
                expect(err).to.not.exist();

                expect(configue.get('C', 'pasdefini')).to.equal('pasdefini');
                done();
            });
        });


        it('get defaultValue if result is set undefined', (done) => {
            configueTest({defaults: {idonotexist: undefined, zero: 0}}, (configue, err) => {
                expect(err).to.not.exist();

                expect(configue.get('idonotexist', 'unlessItellsSo')).to.contain('unless');
                expect(configue.get('zero', 12)).to.equal(0);
                done();
            });
        });


    })

    describe('Files', () => {

        it('can load data from a json file given as string', (done)=> {
            configueTest({files: JSON_CONF_FILE}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                done();
            });
        });

        it('can load data from a json files given as string array', (done)=> {
            configueTest({files: [JSON_CONF_FILE, JSON_CONF_FILE_BIS]}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                expect(configue.get('key-bis')).to.equal('json-config-bis');
                done();
            });
        });

        it('can load data from a json file', (done)=> {
            configueTest({files: [{file: JSON_CONF_FILE}]}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                done();
            });
        });

        it('can load data from a yaml file', (done)=> {
            const configueOptions = {
                files: [{
                    file: YAML_CONF_FILE,
                    format: require('nconf-yaml')
                }]
            };
            configueTest(configueOptions, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('yaml-config');
                done();
            });
        });

        it('files are loaded in order', (done)=> {
            const configueOptions = {
                files: [{file: JSON_CONF_FILE},
                    {
                        file: YAML_CONF_FILE,
                        format: require('nconf-yaml')
                    }]
            };
            configueTest(configueOptions, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                done();
            });
        });

        it('can load a default file', (done)=> {
            configueTest({defaults: {one: 1}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('one')).to.equal(1);
                done();
            });
        });

        it('defaults are loaded in order', (done)=> {
            configueTest({
                defaults: [{one: 1}, {one: 2, two: 2}]
            }, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('one')).to.equal(1);
                expect(configue.get('two')).to.equal(2);
                done();
            });
        });

    });


    describe('Disable', () => {

        it('enable to disable argv', (done) => {
            process.argv.push('--who=YO');
            process.env.who = 'NO';
            // RISKY!!!!

            configueTest({disable: {argv: true}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('who')).to.equal('NO');
                done();
            });
        })

    });


    describe('Post Hooks', () => {

        it('enable to insert hook', (done)=> {
            const configueOptions = {
                postHooks: {
                    overrides: function first(nconf, done) {
                        nconf.set('who', 'ME FIRST!');
                        done()
                    },
                    argv: function postArgv(nconf, done) {
                        nconf.set('when', 'NOW');
                        return done();
                    },
                    defaults: function last(nconf, done) {
                        nconf.set('when', 'RIGHT ' + nconf.get('when'));
                        done()
                    }
                }
            };
            process.argv.push('--when=later');
            process.env.who = 'me';

            configueTest(configueOptions, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('who')).to.equal('ME FIRST!');
                expect(configue.get('when')).to.equal('RIGHT NOW');
                done();
            });
        });

        it('handle error in loading process', (done) => {
            configueTest({
                postHooks: {
                    argv: function postArgv(nconf, done) {
                        done('This is an error');
                    }
                }
            }, (configue, err) => {
                expect(err).to.exist();
                done();
            });
        });
    });

    describe('CustomWorkflow', () => {

        it('accept a custom workflow', (done) => {
            const configueOptions = {
                customWorkflow: function (nconf, done) {
                    nconf.set('workflow', 'custom');
                    return done();
                }
            };
            process.argv.push('--workflow=default');
            process.env.key = 'value';

            configueTest(configueOptions, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('workflow')).to.equal('custom');
                expect(configue.get('key')).to.not.exist();
                done();
            });
        })

    });


});

describe('Hapi plugin', () => {
    describe('Register', () => {
        it('expose configue handler', (done) => {
            const server = new Hapi.Server();
            server.connection();
            const configue = Configue()

            configue.resolve((err) => {
                server.register({register: configue.plugin()}, (err) => {
                    expect(err).to.not.exist();
                    expect(server.configue).to.exist();
                    expect(server.configue).to.be.a.function();
                    return done();
                });
            });
        });
    });
    describe('Request', () => {

        it('has access to configue', (done) => {
            const server = new Hapi.Server();
            server.connection();

            const configue = Configue()
            configue.resolve((err) => {

                server.register({register: configue.plugin()}, (err) => {

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


    });

})