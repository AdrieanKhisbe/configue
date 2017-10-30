'use strict';

const Joi = require('joi');
const _ = require('lodash');

const Configue = module.exports = function Configue(options = {}) {
    if (!(this instanceof Configue)) {
        return new Configue(options);
    }

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];

    const nconf = this.nconf = require('nconf');
    const settings = this.settings =_.clone(options);
    this.resolved = false;

    const results = Joi.validate(settings, configueOptionsSchema);
    if (results.error) throw results.error;

    nconf.use('memory');
    nconf.clear();

    if (!options.defer) {
        this.resolve();
    }
};


Configue.prototype.resolve = function ()  {
    if (this.resolved) return;

    if (this.settings.customWorkflow)
        this.settings.customWorkflow(this.nconf);
    else applyDefaultWorkflow(this.nconf, this.settings);
    this.resolved = true;
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
        argv: [Joi.object()],
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
        })
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
    for(const stepName of steps) {
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
 * Closure that takes the name of a nconf resource as a parameters and
 * loads it if it is not disabled in the plugin options
 *
 * @param resource - the ressource to be loaded. (argv, env, files...)
 * @returns {Function} (nconf, options)
 */
const load = resource => (nconf, options) => {
    if (!options.disable || !options.disable[resource]) {
        return nconf[resource](options[resource]);
    }
};

/**
 * Process the hook for a given step
 * @param hooks
 * @param stepName
 * @returns {Function}
 */
const processHook = (nconf, hooks, stepName) => {
    if (hooks && hooks[stepName])
        hooks[stepName](nconf);
};

const checkRequired = (nconf, options) => {
    if (options.required) {
        nconf.required(options.required);
    }
};

/**
 * Load the files in options using <tt>nconf.file</tt>
 * @param options - plugin options
 */
const loadFiles = (nconf, options) => {
    const files = options.files;
    if (Array.isArray(files) && files.length) {
        files.forEach(file => nconf.file((typeof files[0] === 'string') ? file : file.file, file));
        // file(.file) is used as namespace for nconf
    } else if (typeof files === 'string' && files.length)
        nconf.file(files);
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
 * Steps and their associated action function
 * @type {{argv: Function, env: Function, files: loadFiles}}
 */
const STEP_ACTIONS = {
    overrides: load('overrides'),
    argv: load('argv'),
    env: load('env'),
    files: loadFiles,
    defaults: loadDefaults
};
