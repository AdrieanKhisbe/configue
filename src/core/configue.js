const Joi = require('joi');
const _ = require('lodash/fp');
const Promise = require('bluebird');
const protocall = require('protocall');
const {getPaths} = require('./utils');
const {applyDefaultWorkflow, applyDefaultWorkflowAsync} = require('./workflows');

const Configue = (module.exports = function Configue(options = {}) {
  if (!(this instanceof Configue)) {
    return new Configue(options);
  }

  // load fresh instance of nconf
  delete require.cache[require.resolve('nconf')];

  const nconf = (this.nconf = require('nconf'));
  const settings = (this.settings = _.clone(options));
  this.resolved = false;
  this.async = options.async;

  if (settings.protocall) this.protocallResolver = createProtocallResolver(settings.protocall);
  if (settings.shortstop) this.protocallResolver = createProtocallResolver(settings.shortstop);

  const results = Joi.validate(settings, configueOptionsSchema);
  if (results.error) throw results.error;
  if ((settings.shortstop || settings.protocall) && !settings.async)
    throw new Error('Protocall(Shortstop) usage requires async mode');
  nconf.use('memory');
  nconf.clear();

  if (!options.defer && !options.async) {
    this.resolve();
  }
});

/**
 * Resolve the configue
 */
Configue.prototype.resolve = function() {
  if (this.resolved) return this.async ? Promise.resolve(this) : undefined;

  const completeSetup = () => {
    this.resolved = true;
    this.argv = _.get('_yargs.argv', this.nconf);
    this.env = process.env;
    this.populateModels();
  };
  if (this.async) {
    return (this.settings.customWorkflow
      ? Promise.resolve(this.settings.customWorkflow(this.nconf))
      : Promise.resolve(applyDefaultWorkflowAsync(this.nconf, this.settings))
    )
      .then(() => {
        if (this.settings.protocall) {
          return resolveProtocalls(
            this.nconf,
            this.protocallResolver,
            this.settings.protocall.preserveBuffer
          );
        }
      })
      .then(this.populateModels.bind(this))
      .then(completeSetup)
      .then(() => this);
  } else {
    if (this.settings.customWorkflow) this.settings.customWorkflow(this.nconf);
    else applyDefaultWorkflow(this.nconf, this.settings);
    completeSetup();
  }
};

/**
 * Populate defined models
 */
Configue.prototype.populateModels = function() {
  this._ = _.mapValues(value => this.load(value), this.settings.models);
};

/**
 * Joi options schema
 */
const configueOptionsSchema = [
  Joi.object({defer: Joi.boolean(), async: Joi.boolean(), customWorkflow: Joi.func()}),
  Joi.object().keys({
    async: Joi.boolean(),
    defer: Joi.boolean(),
    disable: Joi.object({
      argv: Joi.boolean(),
      env: Joi.boolean()
    }),
    normalize: Joi.string().valid([
      'camelCase',
      'kebabCase',
      'startCase',
      'snakeCase',
      'upperCase',
      'lowerCase'
    ]),
    transform: [Joi.func(), Joi.array().items(Joi.func())],
    parse: Joi.boolean(),
    separator: [Joi.string(), Joi.object().type(RegExp)],
    ignorePrefix: [Joi.string(), Joi.array().items(Joi.string())],
    shortstop: [
      // TODO: mark as deprecated
      Joi.boolean(),
      Joi.object().keys({
        protocols: Joi.object(),
        preserveBuffer: Joi.boolean(),
        noDefaultProtocols: Joi.boolean(),
        baseDir: Joi.string()
      })
    ],
    protocall: [
      Joi.boolean(),
      Joi.object().keys({
        protocols: Joi.object(),
        preserveBuffer: Joi.boolean(),
        noDefaultProtocols: Joi.boolean(),
        baseDir: Joi.string()
      })
    ],
    argv: [Joi.object(), Joi.func()],
    env: [Joi.object(), Joi.array().items(Joi.string())],
    files: [
      Joi.string(),
      Joi.array().items(
        Joi.object({
          file: Joi.string().required(),
          format: Joi.object({stringify: Joi.func(), parse: Joi.func()})
        })
      ),
      Joi.array().items(Joi.string())
    ],
    defaults: [Joi.object(), Joi.array().items(Joi.object())],
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
  })
];

const createProtocallResolver = options => {
  const protocallResolver = _.get('noDefaultProtocols', options)
    ? new protocall.Resolver()
    : protocall.getDefaultResolver(_.getOr(process.cwd(), 'baseDir', options));

  if (_.has('protocols', options)) protocallResolver.use(options.protocols);

  return protocallResolver;
};

const resolveProtocalls = (nconf, resolver, preseveBuffer) => {
  const originalValues = nconf.load();
  return resolver.resolve(originalValues).then(resolvedValues => {
    const paths = getPaths(originalValues);
    for (const path of paths) {
      const resolvedValue = _.get(path, resolvedValues);
      if (_.get(path, originalValues) !== resolvedValue)
        nconf.set(
          path.join(':'),
          _.isBuffer(resolvedValue) && !preseveBuffer ? resolvedValue.toString() : resolvedValue
        );
    }
  });
};
