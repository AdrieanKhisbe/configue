'use strict';

const Joi = require('joi');
const Yargs = require('yargs');
const path = require('path');
const _ = require('lodash');

const Configue = module.exports = function Configue(options = {}) {
    if (!(this instanceof Configue)) {
        return new Configue(options);
    }

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];

    const nconf = this.nconf = require('nconf');
    const settings = this.settings = _.clone(options);
    this.resolved = false;

    const results = Joi.validate(settings, configueOptionsSchema);
    if (results.error) throw results.error;

    nconf.use('memory');
    nconf.clear();

    if (!options.defer) {
        this.resolve();
    }
};

/**
 * Resolve the configue
 */
Configue.prototype.resolve = function () {
    if (this.resolved) return;

    if (this.settings.customWorkflow)
        this.settings.customWorkflow(this.nconf);
    else applyDefaultWorkflow(this.nconf, this.settings);
    this.resolved = true;
    this.argv = _.get(this.nconf, '_yargs.argv');
    this.env = process.env;
    this.populateModels();
};

/**
 * Populate defined models
 */
Configue.prototype.populateModels = function () {
    this._ = {}
    _.map(this.settings.models, (value, key) => {
        this._[key] = this.load(value);
    })
};


/**
 * Joi options schema
 */
const configueOptionsSchema = [
    Joi.object({defer: Joi.boolean(), customWorkflow: Joi.func()}),
    Joi.object().keys({
        defer: Joi.boolean(),
        disable: Joi.object({
            argv: Joi.boolean(),
            env: Joi.boolean()
        }),
        normalize: Joi.string().valid(['camelCase', 'kebabCase', 'startCase', 'snakeCase',
                                       'upperCase', 'lowerCase']),
        transform: Joi.func(),
        parse: Joi.boolean(),
        argv: [Joi.object(), Joi.func()],
        env: [Joi.object(), Joi.array().items(Joi.string()), Joi.string()],
        files: [Joi.string(),
            Joi.array().items(Joi.object({
                file: Joi.string().required(),
                format: Joi.object({stringify: Joi.func(), parse: Joi.func()})
            })),
            Joi.array().items(Joi.string())],
        defaults: [Joi.object(),
            Joi.array().items(Joi.object())],
        overrides: Joi.object(),
        required: Joi.array().items(Joi.string()),
        postHooks: Joi.object({
            first: Joi.func(),
            overrides: Joi.func(),
            argv: Joi.func(),
            env: Joi.func(),
            files: Joi.func(),
            defaults: Joi.func()
        }),
        models: Joi.object()
    })];

/**
 * Apply the Default Configuration Workflow
 * @param nconf - the nconf object
 * @param settings - plugin config
 */
const applyDefaultWorkflow = function applyDefaultWorkflow(nconf, settings) {
    // Load eventual overrides values and then iterates over the different steps (in order: argv, env, files, default)
    processHook(nconf, settings.postHooks, 'first');
    iterateSteps(nconf, STEPS, settings);
    checkRequired(nconf, settings);
};


/**
 * Iterate synchronously over the various steps
 * @param steps - list of configuration steps
 * @param settings - project settings
 * @returns {Function}
 */
const iterateSteps = (nconf, steps, settings) => {
    const hooks = settings.postHooks;
    for (const stepName of steps) {
        STEP_ACTIONS[stepName](nconf, settings);
        processHook(nconf, hooks, stepName);
    }
};

/**
 * Ordered list of configuration steps
 * @type {string[]}
 */
const STEPS = ['overrides', 'argv', 'env', 'files', 'defaults'];
// Definition of associated actions below

/**
 * Process the hook for a given step
 * @param nconf nconf instance
 * @param hooks defined hooks
 * @param stepName
 * @returns {Function}
 */
const processHook = (nconf, hooks, stepName) => {
    if (_.has(hooks, stepName))
        hooks[stepName](nconf);
};

/**
 * Process the hook for a given step
 * @param nconf nconf instance
 * @param options configue options
 */
const checkRequired = (nconf, options) => {
    if (options.required) {
        nconf.required(options.required);
    }
};

const getTransformForNormalize = (normalize) => {
    const normalizer = _[normalize];
    return ({key, value}) => {
        if(key === '_') return {key, value};
        return {key: normalizer(key), value};
    };
};

/**
 * Load argv step adding eventualy file passed by command line
 * @param options - plugin options
 */
const loadArgv = (nconf, options) => {
    if (!_.has(options, 'disable.argv')) {
        const argOpts = options.argv || {};
        // craft own yargs if needed that is transmit to nconf
        const yargs = _.has(argOpts, 'argv') ? argOpts
            : Yargs(process.argv.slice(2)).options(argOpts);
        if(options.parse !== undefined) yargs.parseValues = options.parse;
        if(options.normalize) yargs.transform = getTransformForNormalize(options.normalize);
        else if (options.transform) yargs.transform = options.transform;

        nconf.argv(yargs);
        const argvFile = nconf.get('configue');
        if (argvFile) {
            nconf.file('argv-configue', argvFile);
        }
        nconf._yargs = yargs;
    }
};

/**
 * Load env step
 * @param options - plugin options
 */
const loadEnv = (nconf, options) => {
    if (!_.has(options, 'disable.env')) {
        const envOpts = _.isArray(options.env) ? {whitelist: options.env} :
            _.isString(options.env) ? {separator: options.env} : options.env || {};
        envOpts.parseValues = options.parse;
        if(options.normalize) envOpts.transform = getTransformForNormalize(options.normalize);
        else envOpts.transform = options.transform;
        nconf.env(envOpts);
    }
};

const nconfYaml = require('nconf-yaml');
const nconfProperties = require('nconf-properties');
const nconfJson5 = require('json5');
const fileTypeAssociation = {
    json: null,
    yaml: nconfYaml,
    yml: nconfYaml,
    properties: nconfProperties,
    ini: nconfProperties,
    json5: nconfJson5
};
/**
 * Return the format associated to the type of the file
 * @param file name of file
 * @returns {*} format associated to file
 */
const nconfFormatForFile = file => {
    const ext = path.extname(file);
    return fileTypeAssociation[ext.slice(1)];
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options - plugin options
 */
const loadFiles = (nconf, options) => {
    const files = options.files;
    if (Array.isArray(files) && files.length) {
        files.forEach(file => {
            const path = (typeof files[0] === 'string') ? file : file.file;
            // file(.file) is used as namespace for nconf
            const formater = file.format || nconfFormatForFile(path);
            nconf.file(path, formater ? {file: path, format: formater} : file);
        });
    } else if (typeof files === 'string' && files.length) {
        const formater = nconfFormatForFile(files);
        if (formater)
            nconf.file({file: files, format: formater});
        else
            nconf.file(files);
    }
};

/**
 * Load the defaults in options using <tt>nconf.defaults</tt>
 * @param options - plugin options
 */
const loadDefaults = function loadDefaults(nconf, options) {
    const defaults = options.defaults;
    nconf.defaults(Array.isArray(defaults) ? _.defaults({}, ...defaults) : defaults);
};

/**
 * Load the overrides in options using <tt>nconf.overrides</tt>
 * @param options - plugin options
 */
const loadOverrides = function loadOverrides(nconf, options) {
    const overrides = options.overrides;
    nconf.overrides(overrides);
};


/**
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
const STEP_ACTIONS = {
    overrides: loadOverrides,
    argv: loadArgv,
    env: loadEnv,
    files: loadFiles,
    defaults: loadDefaults
};
