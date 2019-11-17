const path = require('path');
const Yargs = require('yargs');
const _ = require('lodash/fp');
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
      return STEP_ACTIONS[stepName](nconf, settings).then(() =>
        processHook(nconf, hooks, stepName)
      );
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
  const hook = _.get(stepName, hooks);
  if (hook) return hook(nconf);
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

const getTransformForNormalize = (normalize, separator) => {
  const normalizer = _[normalize];
  if (!separator)
    return ({key, value}) => {
      if (key === '_') return {key, value};
      return {key: normalizer(key), value};
    };
  return ({key, value}) => {
    if (key === '_') return {key, value};
    const separatorMatch = key.match(separator);
    if (separatorMatch) {
      const actualSeparator = separatorMatch[0];
      const normalizedKey = key
        .split(separator)
        .map(normalizer)
        .join(actualSeparator);
      return {key: normalizedKey, value};
    } else return {key: normalizer(key), value};
  };
};

const getTransformForIgnorePrefix = prefix => {
  return ({key, value}) => ({key: key.replace(new RegExp(`^${prefix}`), ''), value});
};

const getTransformer = options => {
  const transformers = [];
  if (options.ignorePrefix)
    transformers.push(..._.flatten([options.ignorePrefix]).map(getTransformForIgnorePrefix));
  if (options.transform) transformers.push(options.transform);
  if (options.normalize)
    transformers.push(getTransformForNormalize(options.normalize, options.separator));
  if (_.isEmpty(transformers)) return;
  return kv => _.flatten(transformers).reduce((acc, transformer) => transformer(acc), kv);
};

const promiseIfNeeded = options => (options.async ? Promise.resolve() : undefined);

/**
 * Load argv step adding eventualy file passed by command line
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadArgv = (nconf, options) => {
  if (_.has('disable.argv', options)) return promiseIfNeeded(options);

  const argOpts = options.argv || {};
  // craft own yargs if needed that is transmit to nconf
  const yargs = _.has('argv', argOpts) ? argOpts : Yargs(process.argv.slice(2)).options(argOpts);
  yargs.separator = options.separator;
  if (options.parse !== undefined) yargs.parseValues = options.parse;

  const transformer = getTransformer(options);
  if (transformer) yargs.transform = transformer;

  nconf.argv(yargs);
  nconf._yargs = yargs;
  const argvFile = nconf.get('configue');
  if (argvFile) {
    nconf.file('argv-configue', argvFile);
  }
  return promiseIfNeeded(options);
};

/**
 * Load env step
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadEnv = (nconf, options) => {
  if (_.has('disable.env', options)) return promiseIfNeeded(options);

  const envOpts = _.isArray(options.env) ? {whitelist: options.env} : options.env || {};
  envOpts.parseValues = options.parse;
  envOpts.separator = options.separator;

  const transformer = getTransformer(options);
  if (options.normalize) {
    envOpts.whitelist = _.map(_[options.normalize], envOpts.whitelist);
  }

  if (transformer) envOpts.transform = transformer;

  nconf.env(envOpts);
  return promiseIfNeeded(options);
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
  if (Array.isArray(files) && files.length > 0) {
    for (const file of files) {
      const path = _.getOr(file, 'file', file);
      // file(.file) is used as namespace for nconf
      const formater = file.format || nconfFormatForFile(path);
      nconf.file(path, formater ? {file: path, format: formater} : file);
    }
  } else if (typeof files === 'string' && files.length > 0) {
    const formater = nconfFormatForFile(files);
    if (formater) nconf.file({file: files, format: formater});
    else nconf.file(files);
  }
  return promiseIfNeeded(options);
};

/**
 * Load the defaults in options using <tt>nconf.defaults</tt>
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadDefaults = function loadDefaults(nconf, options) {
  const defaults = options.defaults;
  nconf.defaults(Array.isArray(defaults) ? _.defaultsAll(defaults) : defaults);
  return promiseIfNeeded(options);
};

/**
 * Load the overrides in options using <tt>nconf.overrides</tt>
 * @param nconf - nconf instance
 * @param options - plugin options
 */
const loadOverrides = function loadOverrides(nconf, options) {
  const overrides = options.overrides;
  nconf.overrides(overrides);
  return promiseIfNeeded(options);
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

module.exports = {applyDefaultWorkflow, applyDefaultWorkflowAsync};
