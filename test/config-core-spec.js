'use strict';

const Lab = require('lab');
const {expect} = require('code');
const path = require('path');

const lab = exports.lab = Lab.script();
const {describe, it} = lab;

const Configue = require('../');
const Yargs = require('yargs');

const JSON_CONF_FILE = path.join(__dirname, 'data/config.json');
const JSON5_CONF_FILE = path.join(__dirname, 'data/config.json5');
const PROPERTIES_CONF_FILE = path.join(__dirname, 'data/config.properties');
const JSON_CONF_FILE_BIS = path.join(__dirname, 'data/config-bis.json');
const YAML_CONF_FILE = path.join(__dirname, 'data/config.yaml');

describe('Configue Core', () => {

    describe('Resolving', () => {

        it('resolve is automatic by default', (done) => {
            const configue = Configue();
            expect(configue.resolved).to.be.true();
            done();
        });

        it('resolve is automatic unless defer', (done) => {
            const configue = Configue({defer: true});
            expect(configue.resolved).to.be.false();
            done();
        });

        it('resolve is automatic unless async', (done) => {
            const configue = Configue({async: true});
            expect(configue.resolved).to.be.false();
            done();
        });

        it('resolve can be performed asynchrounously', (done) => {
            const configue = Configue({async: true});
            configue.resolve()
                .then(cnfg => {

                    expect(configue).to.be.equal(cnfg);
                    expect(configue.resolved).to.be.true();
                    done();
                });
        });

        it('resolve is executed once', (done) => {
            const configue = Configue({defer: true, defaults: {A: 1}});
            expect(configue.resolved).to.be.false();
            configue.resolve();
            configue.resolve(); // coverage ensure that we don't have ran a second times

            expect(configue.resolved).to.be.true();
            // can't test a resolve with change value since dynamic access to argv and env
            done();
        });
        it('resolve is executed once', (done) => {
            const configue = Configue({async: true, defaults: {A: 1}});
            expect(configue.resolved).to.be.false();
            configue.resolve()
                .then(cfg => cfg.resolve()) // coverage ensure that we don't have ran a second times
                .then(cfg => {
                    expect(cfg.resolved).to.be.true();
                    // can't test a resolve with change value since dynamic access to argv and env
                    done();
                });
        });
    });

    describe('Options Schema', () => {
        it('detect wrong option item', (done) => {
            try {
                const configue = Configue({'this': 'is-junk'});
                done(new Error('Exception not triggered'));
            } catch (err) {
                done();
            }
        });
        // TODO maybe add some valid schema
        it('presevent usage of shortstop without async mode', (done) => {
            try {
                const configue = Configue({shortstop: true});
                done(new Error('Exception not triggered'));
            } catch (err) {
                expect(err.message).to.equal('Shortstop usage requires async mode');
                done();
            }
        });
    });

    describe('Files', () => {

        it('can load data from a json file given as string', (done) => {
            const configue = Configue({files: JSON_CONF_FILE});
            expect(configue.get('key')).to.equal('json-config');
            done();
        });

        it('can load data from a json files given as string array', (done) => {
            const configue = Configue({files: [JSON_CONF_FILE, JSON_CONF_FILE_BIS]});
            expect(configue.get('key')).to.equal('json-config');
            expect(configue.get('key-bis')).to.equal('json-config-bis');
            done();
        });

        it('can load data from a json file', (done) => {
            const configue = Configue({files: [{file: JSON_CONF_FILE}]});
            expect(configue.get('key')).to.equal('json-config');
            expect(configue.get('nested:key')).to.equal('nested');
            done();
        });

        it('can load data from a json5 file', (done) => {
            const configue = Configue({files: JSON5_CONF_FILE});
            expect(configue.get('key')).to.equal('json5-config');
            expect(configue.get('nested:key')).to.equal('nested');
            done();
        });

        it('can load data from a yaml file', (done) => {
            const configueOptions = {
                files: [{
                    file: YAML_CONF_FILE,
                    format: require('nconf-yaml')
                }]
            };
            const configue = Configue(configueOptions);
            expect(configue.get('key')).to.equal('yaml-config');
            expect(configue.get('nested:key')).to.equal('nested');
            done();
        });

        it('can load data from a yaml file without saying explicitely it is one', (done) => {
            const configueOptions = {
                files: YAML_CONF_FILE
            };
            const configue = Configue(configueOptions);
            expect(configue.get('key')).to.equal('yaml-config');
            expect(configue.get('nested:key')).to.equal('nested');
            done();
        });

        it('can load data from a yaml file without saying explicitely it is one in a list', (done) => {
            const configueOptions = {
                files: [YAML_CONF_FILE, JSON_CONF_FILE]
            };
            const configue = Configue(configueOptions);
            expect(configue.get('key')).to.equal('yaml-config');
            expect(configue.get('nested:key')).to.equal('nested');
            done();
        });

        it('can load data from a properties file without saying explicitely it is one', (done) => {
            const configueOptions = {
                files: PROPERTIES_CONF_FILE
            };
            const configue = Configue(configueOptions);
            console.log(configue.get('key'));
            expect(configue.get('key')).to.equal('properties-config');
            expect(configue.get('nested:key')).to.equal('nested');
            done();
        });

        it('files are loaded in order', (done) => {
            const configueOptions = {
                files: [{file: JSON_CONF_FILE},
                    {
                        file: YAML_CONF_FILE,
                        format: require('nconf-yaml')
                    }]
            };
            const configue = Configue(configueOptions);
            expect(configue.get('key')).to.equal('json-config');
            done();
        });
    });

    describe('Defaults', () => {
        it('can load a default object', (done) => {
            const configue = Configue({defaults: {one: 1}});
            expect(configue.get('one')).to.equal(1);
            done();
        });

        it('defaults are loaded in order', (done) => {
            const configue = Configue({
                defaults: [{one: 1}, {one: 2, two: 2}]
            });
            expect(configue.get('one')).to.equal(1);
            expect(configue.get('two')).to.equal(2);
            done();
        });

    });

    describe('Overrides', () => {
        it('can be defined', (done) => {
            const configue = Configue({overrides: {one: 1}});
            expect(configue.get('one')).to.equal(1);
            done();
        });
        it('can be defined', (done) => {
            const configue = Configue({overrides: {one: 1}});
            expect(configue.get('one')).to.equal(1);
            done();
        });

        it('are not overidden', (done) => {
            process.argv.push('--one=2');
            const configue = Configue({overrides: {one: 1}});
            process.argv.pop();
            expect(configue.get('one')).to.equal(1);
            done();
        });

    });

    describe('Diverses Options', () => {
        it('argv are forwarded to nconf', (done) => {
            const configue = Configue({argv: {key: {default: 'some-value'}}});
            expect(configue.get('key')).to.equal('some-value');
            done();
        });
        it('argv can be a yargs instance', (done) => {
            const configue = Configue({argv: Yargs(process.argv.slice(2)).defaults('toto', 'titi')});
            expect(configue.get('toto')).to.equal('titi');
            done();
        });

        it('env config are forwarded to nconf if whitelist', (done) => {
            const configue = Configue({env: ['PWD']});
            expect(configue.get('HOME')).to.be.undefined();
            done();
        });

        it('env config are forwarded to nconf if object', (done) => {
            const configue = Configue({env: {whitelist: ['HOME']}});
            expect(configue.get('PWD')).to.be.undefined();
            done();
        });

        it('required keys are enforced by nconf', (done) => {
            try {
                const configue = Configue.defaults({A: 1}).required(['A', 'B']).get();
                done(new Error('Error should be triggered'));
            } catch (err) {
                expect(err.message).to.equal('Missing required keys: B');
                done();
            }
        });
        it('required keys are enforced by nconf does not false alarm', (done) => {
            try {
                const configue = Configue.defaults({A: 1, B: 2, C: 3}).required(['A', 'B']).get();
                done();
            } catch (err) {
                done(new Error('Error should not be triggered'));
            }
        });

        it('parse is activated', (done) => {
            process.argv.push('--one=2');
            process.env.universe = '42';
            const configue = Configue.parse(true).get();
            process.argv.pop();
            process.env.universe = undefined;
            expect(configue.get('one')).to.equal(2);
            expect(configue.get('universe')).to.equal(42);
            done();
        });

        it('parse and transform are activated', (done) => {
            process.argv.push('--one=2');
            const configue = Configue.parse(true)
                .transform(({key, value}) => ({key, value: `this is ${value + 2}`}))
                .get();
            process.argv.pop();
            expect(configue.get('one')).to.equal('this is 4');
            done();
        });
    });

    describe('transform', () => {

        const fooTransformer = ({key, value}) => ({key, value: value + 'foo'});
        const barTransformer = ({key, value}) => ({key, value: value + 'bar'});

        it('can be defined with a single transformer', (done) => {
            process.argv.push('--one=one');
            const configue = new Configue({transform: fooTransformer});
            process.argv.pop();

            expect(configue.get('one')).to.equal('onefoo');
            done();
        });

        it('can be defined with ordered transformer', (done) => {
            process.argv.push('--one=one');
            const configue = new Configue({transform: [fooTransformer, barTransformer]});
            process.argv.pop();

            expect(configue.get('one')).to.equal('onefoobar');
            done();
        });

        it('can be defined along with normalize', (done) => {
            process.argv.push('--ONE-TWO=douze');
            const configue = new Configue({transform: [fooTransformer, barTransformer], normalize: 'camelCase'});
            process.argv.pop();

            expect(configue.get('oneTwo')).to.equal('douzefoobar');
            done();
        });

    });

    describe('ignorePrefix', () => {
        it('works well for a single prefix', (done) => {
            process.env.MY_SUPER_APP_PORT = '3024';
            const configue = new Configue({ignorePrefix: 'MY_SUPER_APP_'});
            process.env.MY_SUPER_APP_PORT = undefined;

            expect(configue.get('PORT')).to.equal('3024');
            done();
        });

        it('works well for a multiple prefix', (done) => {
            process.env.MY_SUPER_APP_PORT = '3024';
            process.env.MY_APP_HOST = 'localhost';
            const configue = new Configue({ignorePrefix: ['MY_SUPER_APP_', 'MY_APP_']});
            process.env.MY_SUPER_APP_PORT = undefined;

            expect(configue.get('PORT')).to.equal('3024');
            expect(configue.get('HOST')).to.equal('localhost');
            done();
        });

        it('works well along with other transformers', (done) => {
            process.env.MY_APP_PORT = '3024';
            process.env.MY_APP_HOST = 'localhost';
            const configue = new Configue({ignorePrefix: 'MY_APP', normalize: 'camelCase'});
            process.env.MY_SUPER_APP_PORT = undefined;

            expect(configue.get('port')).to.equal('3024');
            expect(configue.get('host')).to.equal('localhost');
            done();
        });
    });

    describe('separator', () => {
        it('can be defined globally for env and argv with a string', (done) => {
            process.argv.push('--one__two=douze');
            process.env.four__two = '42';
            const configue = new Configue({separator: '__'});
            process.argv.pop();
            process.env.four__two = undefined;

            expect(configue.get('one:two')).to.equal('douze');
            expect(configue.get('four:two')).to.equal('42');
            done();
        });

        it('can be defined globally for env and argv with a regex', (done) => {
            process.argv.push('--one--two=douze');
            process.env.four__two = '42';
            const configue = new Configue({separator: /--|__/});
            process.argv.pop();
            process.env.four__two = undefined;

            expect(configue.get('one:two')).to.equal('douze');
            expect(configue.get('four:two')).to.equal('42');
            done();
        });

    });

    describe('normalize', () => {

        it('invalid case are rejected', (done) => {
            try {
                const configue = Configue.normalize('wtfCase').get();
                done(new Error('Exception not triggered'));
            } catch (err) {
                expect(err.message).to.match(/"normalize" is not allowed/);
                done();
            }
        });

        it('works well for argv and env with camelCase', (done) => {
            process.argv.push('--one-two=douze');
            process.env.FOUR_TWO = '42';
            const configue = Configue.normalize('camelCase').get();
            process.argv.pop();
            process.env.FOUR_TWO = undefined;

            expect(configue.get('oneTwo')).to.equal('douze');
            expect(configue.get('fourTwo')).to.equal('42');
            expect(configue.get('one-two')).to.equal(undefined);
            expect(configue.get('FOUR_TWO')).to.equal(undefined);
            done();
        });

        it('works well for argv and env with lowerCase', (done) => {
            process.argv.push('--one-TWO=douze');
            process.env.FOUR_TWO = '42';
            const configue = Configue.normalize('lowerCase').get();
            process.argv.pop();
            process.env.FOUR_TWO = undefined;

            expect(configue.get('one two')).to.equal('douze');
            expect(configue.get('four two')).to.equal('42');
            expect(configue.get('one-two')).to.equal(undefined);
            expect(configue.get('FOUR_TWO')).to.equal(undefined);
            done();
        });

        it('works well along with the separator option', (done) => {
            process.argv.push('--One--Two=douze');
            process.env.FOUR__TWO = '42';
            process.env.NO_SEP = '__';
            const configue = new Configue({separator: /--|__/, normalize: 'camelCase'});
            process.argv.pop();
            process.env.FOUR__TWO = undefined;
            process.env.NO_SEP = undefined;

            expect(configue.get('one:two')).to.equal('douze');
            expect(configue.get('four:two')).to.equal('42');
            expect(configue.get('noSep')).to.equal('__');
            done();
        });

        it('normalize works with the env whitelist option', (done) => {
            process.env.NO_SEP = 'no sep';
            process.env.CAMEL_CASE = 'camelCase';
            const configue = new Configue({
                normalize: 'camelCase',
                env: {
                    whitelist: ['NO_SEP', 'CAMEL_CASE']
                },
            });
            process.env.NO_SEP = undefined;
            process.env.CAMEL_CASE = undefined;
            expect(configue.get('noSep')).to.equal('no sep');
            expect(configue.get('camelCase')).to.equal('camelCase');
            done();
        });

    });

    describe('Configue file', () => {
        it('can be specified in arguments', (done) => {
            process.argv.push('--configue=test/data/config.json');
            const configue = Configue({defaults: {key: 'default'}});
            process.argv.pop();
            expect(configue.get('key')).to.equal('json-config');
            done();
        });
        it('take precedence over env variable', (done) => {
            process.argv.push('--configue=test/data/config.json');
            process.env.key = 'env-var';
            // RISKY!!!!
            const configue = Configue({defaults: {key: 'default'}});
            process.argv.pop();
            expect(configue.get('key')).to.equal('json-config');
            process.env.key = undefined;
            done();
        });
        it('works in async mode', (done) => {
            process.argv.push('--configue=test/data/config.json');
            process.env.key = 'env-var';
            // RISKY!!!!
            const configue = Configue({defaults: {key: 'default'}, async: true});
            configue.resolve().then(() => {
                expect(configue.get('key')).to.equal('json-config');
                process.argv.pop();
                process.env.key = undefined;
                done();
            });
        });
    });

    describe('Disable', () => {

        it('enable to disable argv', (done) => {
            process.argv.push('--who=YO');
            process.env.who = 'NO';
            // RISKY!!!!

            const configue = Configue({disable: {argv: true}});
            expect(configue.get('who')).to.equal('NO');

            process.argv.pop();
            process.env.who = undefined;

            done();
        });

        it('enable to disable env', (done) => {
            process.env.who = 'NONO';
            // RISKY!!!!

            const configue = Configue({disable: {env: true}, defaults: {who: 'YES YES'}});
            expect(configue.get('who')).to.equal('YES YES');

            process.env.who = undefined;

            done();
        });

        it('enable to disabe env in async mode', (done) => {
            process.argv.push('--who=YO');
            process.env.who = 'NO';
            // RISKY!!!!

            Configue.withOptions({disable: {argv: true, env: true}}).resolve(configue => {
                expect(configue.get('who')).to.equal(undefined);

                process.argv.pop();
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

            const configue = Configue(configueOptions);
            expect(configue.get('who')).to.equal('ME FIRST!');
            expect(configue.get('when')).to.equal('RIGHT NOW');
            done();
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

            const configue = Configue(configueOptions);
            process.env.who = undefined;
            expect(configue.get('who')).to.equal('ME FIRST!');
            expect(configue.get('when')).to.equal('RIGHT NOW!');
            done();
        });

        it('handle error in loading process', (done) => {
            try {
                const configue = Configue({
                    postHooks: {
                        argv: function postArgv(nconf) {
                            throw new Error('This is an error');
                        }
                    }
                });
            } catch (err) {
                expect(err).to.exist();
            }
            done();
        });
    });

    describe('Shortstop', () => {
        it('performs transformation as expected', (done) => {
            Configue.shortstop(true).defaults({b64: 'base64:YmFzZTY0'}).resolve(configue => {
                expect(configue.get('b64')).to.equal('base64');
                done();
            });
        });
        it('performs transformation as expected unless not activated', (done) => {
            Configue.shortstop(false).defaults({b64: 'base64:YmFzZTY0'}).resolve(configue => {
                expect(configue.get('b64')).to.equal('base64:YmFzZTY0');
                done();
            });
        });
        it('does not include protocols if defaults deactivated', (done) => {
            Configue.shortstop({noDefaultProtocols: true}).defaults({b64: 'base64:YmFzZTY0'}).resolve(configue => {
                expect(configue.get('b64')).to.equal('base64:YmFzZTY0');
                done();
            });
        });
        it('trigger an error if resolve fail', (done) => {
            Configue.shortstop(true).defaults({file: 'file:/does/not/exist'}).resolve().catch(err => {
                expect(err.message).to.equal("ENOENT: no such file or directory, open '/does/not/exist'");
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

            const configue = Configue(configueOptions);
            expect(configue.get('workflow')).to.equal('custom');
            expect(configue.get('key')).to.not.exist();
            done();
        });

        it('accept an async custom workflow', (done) => {
            const configueOptions = {
                customWorkflow: nconf => Promise.resolve('custom-async')
                    .then(workflow => nconf.set('workflow', workflow))
            };
            process.argv.push('--workflow=default');
            process.env.key = 'value';

            Configue.withOptions(configueOptions).resolve(configue => {
                expect(configue.get('workflow')).to.equal('custom-async');
                expect(configue.get('key')).to.not.exist();
                done();
            });
        });

    });

    describe('Argv and Env direct access', () => {
        it('argv can be directly accessed from the configue', (done) => {
            process.argv.push('--one=two');
            const configue = Configue.get();
            process.argv.pop();
            expect(configue.argv.one).to.equal('two');
            done();
        });

        it('argv cannot be directly accessed if custom workflow is used', (done) => {
            const configue = new Configue({customWorkflow: nconf => nconf.set('workflow', 'custom')});
            expect(configue.argv).to.be.undefined();
            done();
        });

        it('argv can be directly accessed if custom workflow set a _yargs', (done) => {
            const configue = new Configue({customWorkflow: nconf => nconf._yargs = {argv: 'stub'}});
            expect(configue.argv).to.equal('stub');
            done();
        });

        it('env can be directly accessed', (done) => {
            process.env.universe = '42';
            const configue = new Configue();
            expect(configue.env.universe).to.equal('42');
            process.env.universe = undefined;
            done();
        });

    });

    describe('Predefined Models', () => {
        it('can be simply defined', (done) => {
            const configue = new Configue({
                defaults: {A: {a: 1, b: 2}, B: 42},
                models: {
                    universe: c => ({a: c('A:a'), b: c.t`the answer is ${'B'}`}),
                    simple: {a: 'A:a', b: ['B:b', 'A:b']}
                }
            });
            expect(configue._.simple).to.equal({a: 1, b: 2});
            expect(configue._.universe).to.equal({a: 1, b: 'the answer is 42'});
            done();
        });
    });
});
