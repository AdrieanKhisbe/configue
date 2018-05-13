'use strict';

const Joi = require('joi');
const _ = require('lodash');
const Promise = require('bluebird');
const shortstop = require('shortstop');
const shortstopHandlers = require('shortstop-handlers');
const {getPaths} = require('./configue-common');
const {applyDefaultWorkflow, applyDefaultWorkflowAsync} = require('./configue-core-workflow');

const Configue = module.exports = function Configue(options = {}) {
    if (!(this instanceof Configue)) {
        return new Configue(options);
    }

    // load fresh instance of nconf
    delete require.cache[require.resolve('nconf')];

    const nconf = this.nconf = require('nconf');
    const settings = this.settings = _.clone(options);
    this.resolved = false;
    this.async = options.async;
    if(settings.shortstop)
        this.shortstopResolver = createShortstopResolver(settings.shortstop)

    const results = Joi.validate(settings, configueOptionsSchema);
    if (results.error) throw results.error;
    if (settings.shortstop && !settings.async)
        throw new Error('Shortstop usage requires async mode');
    nconf.use('memory');
    nconf.clear();

    if (!options.defer && !options.async) {
        this.resolve();
    }
};

/**
 * Resolve the configue
 */
Configue.prototype.resolve = function () {
    if (this.resolved) return this.async ? Promise.resolve(this) : undefined;

    const completeSetup = () => {
        this.resolved = true;
        this.argv = _.get(this.nconf, '_yargs.argv');
        this.env = process.env;
        this.populateModels();
    };
    if (this.async){
        return (this.settings.customWorkflow ?
           Promise.resolve(this.settings.customWorkflow(this.nconf)) :
        Promise.resolve(applyDefaultWorkflowAsync(this.nconf, this.settings)))
            .then(() => {
                if (this.settings.shortstop) {
                    return resolveShortstops(this.nconf, this.shortstopResolver, this.settings.shortstop.preserveBuffer);
                }
            })
            .then(this.populateModels.bind(this))
            .then(completeSetup)
            .then(() => this);
    } else {
        if (this.settings.customWorkflow)
            this.settings.customWorkflow(this.nconf);
        else applyDefaultWorkflow(this.nconf, this.settings);
        completeSetup();
    }
};

/**
 * Populate defined models
 */
Configue.prototype.populateModels = function () {
    this._ = {};
    _.map(this.settings.models, (value, key) => {
        this._[key] = this.load(value);
    });
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
        normalize: Joi.string().valid(['camelCase', 'kebabCase', 'startCase', 'snakeCase',
                                       'upperCase', 'lowerCase']),
        transform: [Joi.func(), Joi.array().items(Joi.func())],
        parse: Joi.boolean(),
        separator: [Joi.string(), Joi.object().type(RegExp)],
        ignorePrefix: [Joi.string(), Joi.array().items(Joi.string())],
        shortstop: [Joi.boolean(), Joi.object().keys({
            protocols: Joi.object(),
            preserveBuffer: Joi.boolean(),
            noDefaultProtocols: Joi.boolean(),
            baseDir: Joi.string()
        })],
        argv: [Joi.object(), Joi.func()],
        env: [Joi.object(), Joi.array().items(Joi.string())],
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

const defaultShotstopResolvers = baseDir => ({
    file: shortstopHandlers.file(baseDir),
    path: shortstopHandlers.path(baseDir),
    env: shortstopHandlers.env(),
    base64: shortstopHandlers.base64(),
    exec: shortstopHandlers.exec(baseDir),
    glob: shortstopHandlers.glob(baseDir),
    require: shortstopHandlers.require(baseDir)
});

const createShortstopResolver = (options) => {
    const shortstopResolver = shortstop.create();
    const resolvers = _.assign({},
        _.get(options, 'noDefaultProtocols') ? {} : defaultShotstopResolvers(_.get(options, 'baseDir', process.cwd())),
        _.get(options, 'protocols', {}));
    _.forEach(resolvers, (handler, protocol) => shortstopResolver.use(protocol, handler));
return shortstopResolver;
};

const resolveShortstops = (nconf, resolver, preseveBuffer) => {
    const originalValues = nconf.load();
    return Promise.fromCallback(callback => {
        resolver.resolve(originalValues, (err, resolvedValues) => {
            if(err) return callback(err);
            const paths = getPaths(originalValues);
            _.forEach(paths, path => {
                let resolvedValue = _.get(resolvedValues, path);
                if (_.get(originalValues, path) !== resolvedValue)
                nconf.set(path.join(':'),
                    _.isBuffer(resolvedValue) && !preseveBuffer ? resolvedValue.toString() : resolvedValue );
            });
            callback(null);
        });
    });
};
