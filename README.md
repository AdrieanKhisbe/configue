# Configue

> ***CONFIGUE ALL THE THINGS \o/***

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coverage-badge]][coverage-url]
[![License: MIT][license-badge]][license-url]

[Configue] is a *node.js* config library to easily customize your app from argv, env, files and more.

It defines a *conventional workflow* to load a config from environment variables,
command line arguments, files, that you can easily *configure* and *extend*.

#### Table of Content
- [About Configue](#about-configue)
- [Installation](#installation)
- [Usage](#usage)
  * [How To](#how-to)
  * [Basic usage without customization](#basic-usage-without-customization)
    + [Basic Configue](#basic-configue)
    + [Basic Async Configue](#basic-async-configue)
    + [Passing By Options](#passing-by-options)
  * [Retrieving values](#retrieving-values)
    + [Simple `get`](#simple-get)
    + [Retrieving Specified Object](#retrieving-specified-object)
      - [Load and getObject for punctual retrieval](#load-and-getobject-for-punctual-retrieval)
      - [*Models* for frequent usage](#models-for-frequent-usage)
    + [Template string](#template-string)
    + [Argv / Env direct access](#argv--env-direct-access)
  * [Usage with customization of the configuration workflow](#usage-with-customization-of-the-configuration-workflow)
    + [Specifying Files](#specifying-files)
    + [Using Protocalls(Shortstop protocols)](#using-protocallshortstop-protocols)
    + [Passing options to nconf to configure argv and env](#passing-options-to-nconf-to-configure-argv-and-env)
    + [Joint options of argv and env to process the values](#joint-options-of-argv-and-env-to-process-the-values)
    + [Disabling Steps](#disabling-steps)
    + [Step hooks](#step-hooks)
    + [Custom Workflow](#custom-workflow)
  * [Loading into Hapi](#loading-into-hapi)
  * [Loading into express](#loading-into-express)
- [Configuration Recap](#configuration-recap)
  * [Configuration Object](#configuration-object)
  * [Fluent builder](#fluent-builder)

## About Configue[↥]

[Configue] builds up on [nconf] and its
[Hierarchical configuration](https://github.com/indexzero/nconf#hierarchical-configuration) system.

It defines a list of _configuration steps_ that are executed in order.
Every property defined on a steps will shadow the same key in the following steps.

Quoting [nconf]:
> ***"The order in which you attach these configuration sources determines their priority in the hierarchy"***

Here are the standard steps [Configue] does define:
- `overrides` : properties that would take precedence on all other steps
- `argv` : command line options
- *configueFile* : file specified by `--configue` in argv if any.
- `env` : environment variables
- `file` : config files
- `defaults` : default objects

The plugin loads the various configurations in order using _predefined steps_.

It starts by parsing *argv* then goes through the *env* and the files options
and finishes by loading the default config objects if any.
Hence why every option defined as an argument commandline will override defaults
and environment variables.

If `--configue` option is specified, the config the specified file holds would
be loaded after the *argv* and before the *env*. This is to enable you to save
many options in many files, and specify at launch with options you want to use.

## Installation[↥]

Just add `configue` has a dependency installing it with `npm`, or with `yarn`.

    npm install --save configue

    yarn add configue


## Usage[↥]

### How To[↥]

To use _Configue_ you need first to create an instance passing the option to the `Configue(opts)`
constructor. Resolving of the config is now done synchronously and automatically unless you specify
the `defer: true` option, or if you opt in for an async resolve.
In case of a problem with the configue options it will throw an Error.

See the following examples for concrete presentation.

### Basic usage without customization[↥]
#### Basic Configue[↥]
```js
const Configue = require('configue');

const configue = new Configue();

const who = configue.get('who', 'World');
console.log(`Hello ${who}`);
```

#### Basic Async Configue[↥]
```js
const Configue = require('configue');

const configue = new Configue({async: true});
configue.resolve().then(() => {
  const who = configue.get('who', 'World');
  console.log(`Hello ${who}`);
});
```

Async resolve is necessary for some advanced features like async hooks and [shortstop] protocols.

#### Passing By Options[↥]
You can specify the `who` configue in different manners.
Here are some:

```sh
node basic.js --who=Woman
# configue through Env
export who=Man ; node basic.js
who=Human node basic.js
node basic.js --configue=my-who-conf.json
```

The full example is available in the [`examples`](./examples/basic.js) folder.

### Retrieving values[↥]
You can retrieve values from the store in different manner, `get` is the most simple one.

#### Simple `get`[↥]

To retrieve a *configue* value, use the `get` method on the config holder.
It takes has argument the key of the argument. For nested value you need to
use `:` or `.` to deep access to value, or you can an array of keys.

It's also possible to specify a default value in case key is `undefined`.

```js
configue.get('defined4sure');
configue.get('some:nested:value');
configue.get('some.other.nested.value');
configue.get(['yet', 'another', 'nested', 'value']);
configue.get('mightBeUndefined', 'default');
```

You can also retrieve a list of value with `getAll`, or the first non undefined value from a list with `getFirst`

```js
configue.getAll('defined4sure', 'some:nested:value');
configue.getAll(['defined4sure', 'some:nested:value']);
configue.getAll(['some.other.nested.value', ['yet', 'another', 'nested', 'value']]);

configue.getFirst('defined4sure', 'some:nested:value');
configue.getFirst(['defined4sure', 'some:nested:value'], optionalDefaultValue);
```

#### Retrieving Specified Object[↥]

When you can to retrieve several values in the same time you can forge object so that they have structure you need.

##### Load and getObject for punctual retrieval[↥]
The two main methods are `load` and `getObject`
- `load` by default return the whole merged config as an object. But you can give him a model that would be used
  to craft an object. The model is a object whose leaves are configue keys, or array of configue key:
    ex: `{serverConfig: {host: 'app:server:host', port: 'PORT'}, ...}`
- `getObject` that takes a list of key, and return an object formed by key / values

```js
const {serverConfig} = configue.load({
  serverConfig: {host: 'app:server:host', port: 'PORT'},
  extraOptions: '...'
});

const {file, prefix} = configue.getObject('file', 'prefix');
```

##### *Models* for frequent usage[↥]
There are case where the forged object are to be used several times, and you dont want to query them over and over.
To do that you can predefined *models* in the configuration. These would be populated once during automatic resolved,
and they would be made accessible under the `_` key.

```js
const configue = new Configue({
  models: {
    serverConfig: {host: 'app:server:host', port: 'PORT'},
    otherModel: {a: 'a', b: '...'}
  }
});
//...
console.log(configue._.serverConfig); // => host: ..., port: ...
```

#### Template string[↥]
One last way you can get config value is via the `configue.template` (aliased to `configue.t`).
This is a template function you can prefix a template string. The interpolated values will be keys of the
*configue* and then replaced by their value:

```js
console.log(configue.t`I will say ${'salute'} to ${'who'}`);
// => I will say Hello to You
// (supposing called with --salute=Hello --who=You)
```
You can defined default values by passing a default object to the `template` method:
```js
console.log(
  configue.t({times: 2, who: 'World'})`I will say ${'salute'} to ${'who'} ${'times'} times`
);
// => I will say Hello to You 2 times
```

#### Argv / Env direct access[↥]
For ease of the the `argv` and `env` can be directly accessible from the *configue* instance:

```js
console.log(configue.argv.host);
console.log(configue.env.HOME);
```

Note that values are neither parsed nor transformed.

### Usage with customization of the configuration workflow[↥]

#### Specifying Files[↥]

The files key can contain a single object or an array of objects containing a `file` key containing the path to the config file.
The object can also reference a *nconf* plugin tasked with the formatting using the key `format`.

Starting from 1.0 the formatter to use can be automatically deduced for standard files. Supported extensions are
`json`, `yaml`/`yml` but also `properties`/`ini` and `json5` In that case you just need to specify the name of the file.

```js
const Configue = require('configue');

const configueOptions = {
  disable: {argv: true},
  files: [
    {file: './config.json'},
    {
      file: './config.yaml',
      format: require('nconf-yaml')
    },
    'my-own.properties'
  ]
};

const configue = new Configue(configueOptions);
```

Note that if only one file is needed, its path can be directly given as options.

#### Using Protocalls(Shortstop protocols)[↥]

[Protocall][protocall](originally [Shortstop][shortstop]) is a library that help transform json values by interpreting their content.
Quoting documentation:
> it enables the use of protocols and handlers to enable identification and special handling of json values.

For instance value with the standard `env` and `file` protocol,
`env:MY_ENV_VARIABLE` will be replaced with the value of `MY_ENV_VARIABLE` while value `file:/some/path` will be
resolved with the content of the given file.
For more details refer to the [protocall] project.

To enable it, you just need to have `{async: true, protocall: true}` in your *Configue* config object.

By default *Configue* comes empowered with the protocols from [shortstop-handlers]:
`env`, `file`, `path`, `exec`, `base64`, `require`.

You can customize behavior of **protocall** by passing a config object as option:
- You can add extra protocols via the `protocols` options, by passing an object `{$protocolName: $handler}`
- You can also precise the `baseDir` for `file`, `path`, `exec`, `require` default handler. (default being current working directory)
- If you don't want the default protocols, use the `noDefaultProtocols` option.
- By default the Buffer are stringified by *Configue*, but you can choose to preserve them with the `preserveBuffer` option.

For an example of configuration refer to the [following examples](examples/async-with-protocalls.js) using
[this json file](examples/config-with-protocalls.json) as part of the config.

#### Passing options to nconf to configure argv and env[↥]
You can provide options arguments to `argv` (`yargs`underneath), and `env` in order to customize the behavior
around command line argument and environment variables.
For more in depth readings see nconf options [here][nconf-options-argv-env]

```js
const Configue = require('configue');

const configueOptions = {
  argv: {
    f: {
      alias: 'file',
      demandOption: true,
      default: '/etc/passwd',
      describe: 'x marks the spot',
      type: 'string'
    }
  },
  env: ['HOME', 'PWD'] // whitelist
};

const configue = new Configue(configueOptions);
```

#### Joint options of argv and env to process the values[↥]
It is possible to process the raw values you can get from the `argv` and `env` step, with the **parse**, **separator**
**ignorePrefix**, **normalize** and **transform** options.

First you can specify to parse values with the **`parse`** option. Argv and Env value will be then parse,
which is convenient to pass simple json from the command line.

A **`separator`** option is there to indicate the token that will be used to split a key and consider it as a nested value.
This affects both the argv and env step. The value can be either a string, or a regexp such as `'__'` or `/__|--/`

With **`ignorePrefix`** you can list of prefix for argv and env variable you want to be removed. This is particulary useful
with environment variables that are prefixed with your app name.

Also a **`normalize`** option enables you to make the variable names uniform with the same case, while using the idiomatic
case for the argv flag name and env variable. (for instance `--my-var` and `MY_VAR`).
This option accept as config the name of case function of lodash, the most useful being `camelCase` which will
transform our both variable into `myVar` as we would like name the javascript variable.
(other options are `kebabCase`, `startCase`, `snakeCase`,`upperCase`, `lowerCase`)

If you have more complex processing of the env/arg variable name or value, you can use the **`transform`** option,
which accept a function `({key, value}) => ({key:someKey, value:someValue})` that will be passed to nconf. (cf [nconf doc][nconf-transform])
This will happen after the ignore prefix, and before the case normalisation.

#### Disabling Steps[↥]

The argv and env steps can be skipped using the `disable` object in `options`.

```js
const configue = new Configue({disable: {argv: true}});
// ...
```

There is no disabling for `overrides`, `files` and `default`; you just have to don't provide the matching option.

#### Step hooks[↥]

Every step (`overrides`, `argv`, `env`, `files`, `defaults`) has a post hook available.
Those can be defined using the `postHooks` key and accept a function that take `nconf`.
In async mode those hooks can be asynchronous by returning a Promise.

The special hooks `first` enables you to respectively apply a function on nconf at the very beginning.

```js
const configue = new Configue({
  postHooks: {
    first: function first(nconf) {
      // Your code here
    },
    overrides: function postOverrides(nconf) {
      // Your code here
    },
    argv: function postArgv(nconf) {
      // Your code here
    }
  }
});
// Your code here
```

#### Custom Workflow[↥]

If needed you can have your full custom configuration workflow,
simply by providing an object with the single key `customWorkflow`
attached to a function taking the `nconf` object, and a `done` callback.

```js
const configueOptions = {
  customWorkflow(nconf, done) {
    // my own config setting
  }
};

const configue = new Configue(configueOptions);
```

If you use a `yargs` instance, you can assign it to `nconf._yargs` so that `argv`
is directly accessible from `configue.argv

### Loading into Hapi[↥]

Thought _Configue_ is usable without hapi`, (it was originally just a _Hapi_ plugin),
it can be easily loaded in `hapi` to have the _configue_ being easily accessible from
the server, or the request.

To do this, you need to register the plugin. It takes care to resolve the config if
was not done due to defer.
```js
const Hapi = require('hapi');
const Configue = require('configue');

const configue = new Configue({some: 'complex config with a model connexion'});

const server = new Hapi.Server();
server.connection(configue._.connexion); // note usage of the model connexion with port in it.
server.register({register: configue.plugin()}, err => {
  // starting the server or else

  // access to the config
  const config = server.configue('some'); // => 'config'
  const configGet = server.configue.get('some'); // => 'config'
  // Any other call to server.configue.getAsync/getFirst/getAll/getObject/template/load
  // ...
});
```
A more complete example is available in [`examples`](examples/hapi-server.js) folder.

Note it's possible to provide to `configue.plugin()` a `decorateName` so that you use a custom accessor on `server` or `request`.

**Warning**: the original plugin is made for the pre 17 version of `hapi`. If you are using `hapi@17 or beyond,
please retrive the plugin with the `plugin17()` method as you can see in the [example server](examples/hapi17-server.js).

### Loading into express[↥]
Configue can also be loaded into `express` via it's middleware you can obtain by `configue.middleware()` you just have
to feed to `app.use()`

A example is available in the [`examples`](examples/express-server.js) folder.

## Configuration Recap[↥]
Configue can be configured in two different way. Either using a config object or using a fluent builder.

### Configuration Object[↥]
Here is a recap of how the configuration should look like. All options are optional:

- `customWorkflow`: a function manipulating the `nconf`. This option is exclusive of all others
- `argv`: Config object for `yargv`, a map of config key with an object values (`alias`, `demandOption`, `default`,`describe`, `type`)
- `env`: The options for the `nconf.env` method that can be:
  - an array of string, the whitelisted env method
  - an object with key: `match`, `whitelist
- `disable`: A object with key `argv` and/or `env` attach to a boolean indicated whether the step should be disable.
- `files`: file or list of files. (object `file`, `format`)
- `defaults`: Object of key mapped to default values. (or array of them)
- `overrides`: Object of key mapped to overrides values.
- `required`: list of key that are required one way or another
- `postHooks`: an object of (`step`: function hook)
    step being one of `first`, `overrides`, `argv`, `env`, `files` `defaults`
- `parse`: boolean to request parsing of argv/env value
- `transform`: a function to process argv and env values
- `normalize`: the case name in which you want keys to be converted
- `ignorePrefix`: a prefix or list of them you want to be remove from key name
- `protocall`/`shortstop`: to activate and customize the protocall/shortstop protocols. (prefer `protocall`, `shortstop` is to be deprecated)
- `async`: to activate async mode which will defer resolve
- `defer`: to defer automatic resolve in sync mode

For more details you can see the `internals.schema` in the `configue-core.js` file around the line 60

### Fluent builder[↥]

Instead to use the configuration object provided to the `Configue` constructor, you can use the fluent builder.
This consist in chaining a list of configuration methods before to retrieve the instance to a `get` method or via a
`resolve` method.

Here is a simple example:

```js
const configue = Configue.defaults({a: 1, b: '2'})
  .parse(true)
  .normalize('camelCase')
  .get();
```
You can provide a portion of option with the `withOption` method as you can see in this example using `resolve`:

```js
Configue.defaults({a: 1, b: '2'})
  .withOptions({parse: true, normalize: 'camelCase'})
  .protocall(true)
  .resolve(configue => {
    // here goes your code
  });
```

Here is the builder function list, the function name being the name of the key in he object config (except the postHooks function and `withOptions`):
`argv`, `async`, `customWorkflow`, `defaults`, `overrides`, `disable`, `env`, `files`, `required`, `transform`, `parse`, `normalize`, `separator`, `protocall`
and `firstHook`, `overridesHook`, `argvHook`, `envHook`, `filesHook`, `defaultsHook`, `withOptions`

[↥]

[↥]: #configue
[Configue]: https://github.com/AdrieanKhisbe/configue
[github-repo]: https://github.com/AdrieanKhisbe/configue
[nconf]: https://github.com/indexzero/nconf
[nconf-options-argv-env]: https://github.com/indexzero/nconf#argv
[nconf-transform]: https://github.com/indexzero/nconf#transform-functionobj
[protocall]: https://github.com/omni-tools/protocall
[shortstop]: https://github.com/krakenjs/shortstop
[shortstop-handlers]: https://github.com/krakenjs/shortstop-handlers

[npm-badge]: https://img.shields.io/npm/v/configue.svg
[npm-url]: https://npmjs.com/package/configue
[travis-badge]: https://travis-ci.com/AdrieanKhisbe/configue.svg?branch=master
[travis-url]: https://travis-ci.com/github/AdrieanKhisbe/configue
[coverage-badge]: https://codecov.io/gh/AdrieanKhisbe/configue/branch/master/graph/badge.svg
[coverage-url]: https://codecov.io/gh/AdrieanKhisbe/configue
[license-badge]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: https://opensource.org/licenses/MIT
