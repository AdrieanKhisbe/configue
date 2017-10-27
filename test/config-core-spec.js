'use strict';

const Lab = require('lab');
const {expect} = require('code');
const path = require('path');

const lab = exports.lab = Lab.script();
const {describe, it} = lab;

const Configue = require('../');

const JSON_CONF_FILE = path.join(__dirname, 'data/config.json');
const JSON_CONF_FILE_BIS = path.join(__dirname, 'data/config-bis.json');
const YAML_CONF_FILE = path.join(__dirname, 'data/config.yaml');

describe('Configue Options', () => {

    describe('Resolving', () => {

        it('resolve is automatic', (done) => {
            const configue = Configue();
            expect(configue.resolved).to.be.true();
            done();
        });
        it('resolve is automatic unless defer', (done) => {
            const configue = Configue({defer: true});
            expect(configue.resolved).to.be.false();
            configue.resolve();

            expect(configue.resolved).to.be.true();
            done();
        });

        it('resolve is executed once', (done) => {
            const configue = Configue({defer: true, defaults: {A: 1}});
            expect(configue.resolved).to.be.false();
            configue.resolve()
            configue.resolve() // coverage ensure that we don't have ran a second times

            expect(configue.resolved).to.be.true();
            // can't test a resolve with change value since dynamic access to argv and env
            done();
        });
    });


    const configueTest = (configueOptions, callback) => {
        let configue
        try {
          configue = Configue(configueOptions);
          callback(configue, null)
        } catch(err) {
          callback(configue, err)
        }
    };

    describe('Schema', () => {
        it('detect wrong option item', (done) => {
            try {
                const configue = Configue({'this': 'is-junk'});
                done(new Error('Exception not triggered'));
            } catch (err) {
                done();
            }
        });
        // TODO maybe add some valid schema
    });


    describe('Getter', () => {

        it('get value', (done) => {
            configueTest({defaults: {A: '2', B: 42}}, (configue, err) => {
                expect(err).to.not.exist();
                // NOTE: code is interpreted from command line: -a !! (-a code, param of lab)
                expect(configue.get('A')).to.equal('2');
                expect(configue.get('B')).to.equal(42);
                done();
            });
        });

        it('get nested value', (done) => {
            configueTest({defaults: {root: {a: '2', b: 42}}}, (configue, err) => {
                expect(err).to.not.exist();

                expect(configue.get('root')).to.equal({a: '2', b: 42});
                expect(configue.get('root:a')).to.equal('2');
                expect(configue.get('root:b')).to.equal(42);
                done();
            });
        });

        it('get defaultValue', (done) => {
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


        it('get first value', (done) => {
            configueTest({overrides: {A: '2', B: 42, C: false}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.getFirst('A', 'B', 'C')).to.equal('2');
                expect(configue.getFirst('b', 'B')).to.equal(42);
                expect(configue.getFirst('acd', 'C')).to.equal(false);
                expect(configue.getFirst('aa', 'bb', 'cc')).to.equal(undefined);
                done();
            });
        });

        it('get first value from array', (done) => {
            configueTest({overrides: {A: '2', B: 42, C: false}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.getFirst(['A', 'B', 'C'])).to.equal('2');
                expect(configue.getFirst(['b', 'B'])).to.equal(42);
                expect(configue.getFirst(['acd', 'C'])).to.equal(false);
                expect(configue.getFirst(['aa', 'bb', 'cc'])).to.equal(undefined);
                done();
            });
        });

        it('get all value', (done) => {
            configueTest({overrides: {A: '2', B: 42, C: false}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.getAll('A', 'B', 'C')).to.equal(['2', 42, false]);
                expect(configue.getAll('b', 'B')).to.equal([undefined, 42]);
                done();
            });
        });
        it('get all value from array', (done) => {
            configueTest({overrides: {A: '2', B: 42, C: false}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.getAll(['A', 'B', 'C'])).to.equal(['2', 42, false]);
                expect(configue.getAll(['b', 'B'])).to.equal([undefined, 42]);
                done();
            });
        });

    });

    describe('Files', () => {

        it('can load data from a json file given as string', (done) => {
            configueTest({files: JSON_CONF_FILE}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                done();
            });
        });

        it('can load data from a json files given as string array', (done) => {
            configueTest({files: [JSON_CONF_FILE, JSON_CONF_FILE_BIS]}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                expect(configue.get('key-bis')).to.equal('json-config-bis');
                done();
            });
        });

        it('can load data from a json file', (done) => {
            configueTest({files: [{file: JSON_CONF_FILE}]}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('key')).to.equal('json-config');
                done();
            });
        });

        it('can load data from a yaml file', (done) => {
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

        it('files are loaded in order', (done) => {
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
    });

    describe('Defaults', () => {
        it('can load a default object', (done) => {
            configueTest({defaults: {one: 1}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('one')).to.equal(1);
                done();
            });
        });

        it('defaults are loaded in order', (done) => {
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
    describe('Overrides', () => {
        it('can be defined', (done) => {
            configueTest({overrides: {one: 1}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('one')).to.equal(1);
                done();
            });
        });

        it('are not overidden', (done) => {
            process.argv.push('--one=2');
            configueTest({overrides: {one: 1}}, (configue, err) => {
                process.argv.pop();
                expect(err).to.not.exist();
                expect(configue.get('one')).to.equal(1);
                done();
            });
        });

    });

    describe('Options', () => {
        it('argv are forwarded to nconf', (done) => {
            configueTest({argv: {'key': {default: 'some-value'}}},
                (configue, err) => {
                    expect(err).to.not.exist();
                    expect(configue.get('key')).to.equal('some-value');
                    done();
                });
        });

        it('env are forwarded to nconf', (done) => {
            configueTest({env: ['PWD']},
                (configue, err) => {
                    expect(err).to.not.exist();
                    const allEnv = configue.nconf.load();
                    expect(configue.get('HOME')).to.be.undefined();
                    done();
                });
        });
        it('required keys are enforced by nconf', (done) => {
            try {
                const configue = Configue.defaults({A: 1}).required(['A', 'B']).get();
                done(new Error('Error should be triggered'))
            } catch(err)  {
                expect(err.message).to.equal('Missing required keys: B');
                done();
            }
        });
        it('required keys are enforced by nconf does not false alarm', (done) => {
            const configue = Configue.defaults({A: 1, B: 2, C: 3}).required(['A', 'B']).get();
            try {
              configue.resolve()
              done()
            } catch (err) {
              done(new Error('Error should not be triggered'));
            }
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

                process.argv.pop();
                process.env.who = undefined;

                done();
            });
        });

        it('enable to disable env', (done) => {
            process.env.who = 'NONO';
            // RISKY!!!!

            configueTest({disable: {env: true}, defaults: {who: 'YES YES'}}, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('who')).to.equal('YES YES');

                process.env.who = undefined;

                done();
            });
        });

    });


    describe('Post Hooks', () => {

        it('enable to insert hook', (done) => {
            const configueOptions = {
                postHooks: {
                    overrides: function postOverrides(nconf) {
                        nconf.set('who', 'ME FIRST!');
                    },
                    argv: function postArgv(nconf) {
                        nconf.set('when', 'NOW');
                    },
                    defaults: function last(nconf) {
                        nconf.set('when', 'RIGHT ' + nconf.get('when'));
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
        it('first hook is runned to insert hook', (done) => {
            const configueOptions = {
                overrides: {who: 'ME second!'},
                postHooks: {
                    first: function first(nconf) {
                        nconf.set('who', 'ME FIRST!');
                        nconf.set('when', 'RIGHT NOW!');
                    }
                }
            };
            process.env.who = 'me';

            configueTest(configueOptions, (configue, err) => {
                process.env.who = undefined;
                expect(err).to.not.exist();
                expect(configue.get('who')).to.equal('ME FIRST!');
                expect(configue.get('when')).to.equal('RIGHT NOW!');
                done();
            });
        });

        it('handle error in loading process', (done) => {
            configueTest({
                postHooks: {
                    argv: function postArgv(nconf) {
                        throw new Error('This is an error');
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
                customWorkflow: nconf => nconf.set('workflow', 'custom')
            };
            process.argv.push('--workflow=default');
            process.env.key = 'value';

            configueTest(configueOptions, (configue, err) => {
                expect(err).to.not.exist();
                expect(configue.get('workflow')).to.equal('custom');
                expect(configue.get('key')).to.not.exist();
                done();
            });
        });

    });

});
