'use strict';

const Yargs = require('yargs');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');


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
 * Apply the Default Configuration Workflow in Async mode
 * @param nconf - the nconf object
 * @param settings - plugin config
 */
const applyDefaultWorkflowAsync = function applyDefaultWorkflowAsync(nconf, settings) {
    return Promise.resolve(processHook(nconf, settings.postHooks, 'first'))
        .then(() => iterateSteps(nconf, STEPS, settings))
        .then(() => checkRequired(nconf, settings));
};

/**
 * Iterate synchronously over the various steps
 * @param nconf - nconf instance
 * @param steps - list of configuration steps
 * @param settings - project settings
 * @returns {Function}
 */
const iterateSteps = (nconf, steps, settings) => {
    const hooks = settings.postHooks;
    if (settings.async) {
        return Promise.each(steps, stepName => {
            return STEP_ACTIONS[stepName](nconf, settings)
                .then(() => processHook(nconf, hooks, stepName));
        });
    }
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
        return hooks[stepName](nconf);
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

const getTransformForNormalize = (normalize, separator, ignorePrefix) => {
    const normalizer = _[normalize];
    if(!separator)
        return ({key, value}) => {
            if(key === '_') return {key, value};
            return {key: normalizer(key), value};
        };
    return ({key, value}) => {
        if(key === '_') return {key, value};
        const separatorMatch = key.match(separator);
        if(separatorMatch) {
            const actualSeparator = separatorMatch[0];
            const normalizedKey = key.split(separator).map(normalizer).join(actualSeparator);
            return {key: normalizedKey, value};
        }
        else
            return {key: normalizer(key), value};
        };
};

const getTransformForIgnorePrefix = (prefix) => {
    return ({key, value}) => ({key: key.replace(new RegExp(`^${prefix}`), ''), value});
};

const getTransformers = (options) => {
    const transformers = [];
    if (options.ignorePrefix) {
        if(_.isArray(options.ignorePrefix))
            _.forEach(options.ignorePrefix, prefix => transformers.push(getTransformForIgnorePrefix(prefix)));
        else transformers.push(getTransformForIgnorePrefix(options.ignorePrefix));
    }
    if (options.transform) transformers.push(options.transform);
    if (options.normalize)
        transformers.push(getTransformForNormalize(options.normalize, options.separator));
    return transformers;
};

/**
 * Load argv step adding eventualy file passed by command line
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadArgv = (nconf, options) => {
    if (_.has(options, 'disable.argv')) return options.async ? Promise.resolve() : undefined;

    const argOpts = options.argv || {};
    // craft own yargs if needed that is transmit to nconf
    const yargs = _.has(argOpts, 'argv') ? argOpts
        : Yargs(process.argv.slice(2)).options(argOpts);
    yargs.separator = options.separator;
    if(options.parse !== undefined) yargs.parseValues = options.parse;

    const transformers = getTransformers(options);
    if (!_.isEmpty(transformers)) {
        yargs.transform = kv => _.reduce(_.flatten(transformers),
            (acc, transformer) => transformer(acc), kv);
    }
    nconf.argv(yargs);
    nconf._yargs = yargs;
    const argvFile = nconf.get('configue');
    if (argvFile) {
        nconf.file('argv-configue', argvFile);
    }
    if (options.async) {
        return Promise.resolve();
    }
};

/**
 * Load env step
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadEnv = (nconf, options) => {
    if (_.has(options, 'disable.env')) return options.async ? Promise.resolve() : undefined;

    const envOpts = _.isArray(options.env) ? {whitelist: options.env} : options.env || {};
    envOpts.parseValues = options.parse;
    envOpts.separator = options.separator;

    const transformers = getTransformers(options);
    if (options.normalize) {
        envOpts.whitelist = _.map(envOpts.whitelist, _[options.normalize]);
    }

    if(!_.isEmpty(transformers)) {
        envOpts.transform = kv => _.reduce(_.flatten(transformers),
            (acc, transformer) => transformer(acc), kv);
    }

    nconf.env(envOpts);
    if (options.async)
        return Promise.resolve();
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
 * @param nconf - nconf instance
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
    // TODO TMP
    if(options.async)
        return Promise.resolve();
};

/**
 * Load the defaults in options using <tt>nconf.defaults</tt>
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadDefaults = function loadDefaults(nconf, options) {
    const defaults = options.defaults;
    nconf.defaults(Array.isArray(defaults) ? _.defaults({}, ...defaults) : defaults);
    if(options.async)
        return Promise.resolve();
};

/**
 * Load the overrides in options using <tt>nconf.overrides</tt>
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadOverrides = function loadOverrides(nconf, options) {
    const overrides = options.overrides;
    nconf.overrides(overrides);
    if(options.async)
        return Promise.resolve();
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

module.exports = {applyDefaultWorkflow, applyDefaultWorkflowAsync}