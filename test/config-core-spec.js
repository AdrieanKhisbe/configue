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

describe('Configue Core', () => {

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
            configue.resolve();
            configue.resolve(); // coverage ensure that we don't have ran a second times

            expect(configue.resolved).to.be.true();
            // can't test a resolve with change value since dynamic access to argv and env
            done();
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

    describe('Options', () => {
        it('argv are forwarded to nconf', (done) => {
            const configue = Configue({argv: {'key': {default: 'some-value'}}});
            expect(configue.get('key')).to.equal('some-value');
            done();
        });

        it('env config are forwarded to nconf', (done) => {
            const configue = Configue({env: ['PWD']});
            expect(configue.get('HOME')).to.be.undefined();
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

    });

});
