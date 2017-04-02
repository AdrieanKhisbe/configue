# Configue

> ***Config tool and plugin for [Hapi](http://hapijs.com/).***

[![npm version][npm-badge]][npm-url]
[![experimental][experimental-badge]][experimental-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coverage-badge]][coverage-url]
[![Code Climate][codeclimate-badge]][codeclimate-url]
[![Dependency Status][david-badge]][david-url]
[![bitHound Overalll Score][bithound-badge]][bithound-url]

[Configue] is a wrapper on [nconf] node hierarchical config tool.

It defines a *conventional workflow* to load a config from environment variables,
command line arguments, files, that you can easily *configure* and *extend*.

## About Configue

[Configue] builds up on [nconf] and its
[Hierarchical configuration](https://github.com/indexzero/nconf#hierarchical-configuration) system.

It defines a list of _configuration step_ that are executed in order.
Every property defined on a steps will shadow the same key in the following steps.

Quoting [nconf]:
> ***"The order in which you attach these configuration sources determines their priority in the hierarchy"***

Here are the standard steps [Configue] does define:
- `argv` : command line options
- `env` : environment variables
- `file` : config files
- `defaults` : default objects

The plugin loads the various configurations in order using _predefined steps_.

It starts by parsing argv then goes through the env and the files options
and finishes by loading the default config objects if any.

Hence why every option defined as an argument commandline will override defaults
and environment variables.

## Installation

Just add `configue` has a dependency installing it with npm.

    npm install --save configue

## Usage

### How To

To use _Configue_ you need first to create an instance passing the option to the `Configue(opts)`
constructor.
Once done, you'll first need to `resolve` the config, to ensure all values are loaded in the store.
The function takes a callback that is fired when the config is loaded

See the following examples for concrete presentation.

### Basic usage without customization

#### With Callback
```js
const Configue = require('configue');
const configue = Configue()

configue.resolve((err) => {
    if (err) return console.error('Something bad happened\n%j', err);

    const who = configue.get('who', 'World');
    console.log('Hello ' + who);
});
```
#### WithPromises
```js
const Configue = require('configue');
const configue = Configue()

configue.resolve()
    .then(() => {
        const who = configue.get('who', 'World');
        console.log('I know that "who" is ' + who);
        })
    .catch((err) => console.error('Something bad happened\n%j', err))
```

#### Passing By Options
You can specify the `who` configue in different manners.
Here are some:

```sh
node basic.js --who=Woman
# configue through Env
export who=Man ; node basic.js
who=Human node basic.js
```

The full example is available in the [`examples`](./examples/basic.js) folder.

#### Retrieving values

To retrieve a configue value, use the `get` method on the config holder.
It takes has argument the key of the argument. For nested value you need to
use `:` to deep access to value.
It's also possible to specify a default value in case key is `undefined`.

```js
configue.get('defined4sure')
configue.get('some:nested:value')
configue.get('mightBeUndefined', 'default')
```

### Usage with customization of the configuration workflow

#### Passing options to nconf
You can provide options arguments to `argv` (`yargs`underneath), and `env` in order to customize the behavior 
around command line argument and environment variables.
For more in depth readings see nconf options [here][nconf-options-argv-env]

```js
const Configue = require('configue');

const configueOptions = {
    argv: { f: {
                 alias: 'file',
                 demandOption: true,
                 default: '/etc/passwd',
                 describe: 'x marks the spot',
                 type: 'string'
                 }},
    env: ["HOME", "PWD"] // whitelist

};

const configue = Configue(configueOptions)
configue.resolve((err) => {
    // Your code here
});
```

#### Specifying Files

The files key can contain a single object or an array of objects containing a `file key containing the path to the config file.
The object can also reference a nconf plugin tasked with the formatting using the key `format.

```js
const Configue = require('configue');

const configueOptions = {
    disable: {argv: true},
    files: [
        {file: './config.json'},
        {
            file: './config.yaml',
            format: require('nconf-yaml')
        }
    ]
};

const configue = Configue(configueOptions)
configue.resolve((err) => {
    // Your code here
});
````

Note that if only one file is needed, its path can be directly given as options.

#### Disabling Steps

The argv and env steps can be skipped using the `disable` object in `options`.

```js
const configue = Configue({
  disable: {
     argv: true
        }});

// Your code here
```

#### Step hooks

Every step has a post hook available.
Those can be defined using the `postHooks` key and accept a
function that take `nconf` as a parameter and a callback as a parameter.

The special hooks `overrides`  enables you to respectively apply a hook at the very beginning.

```js
const configue = Configue({
        postHooks: {
            overrides: function first(nconf, done){
                //Your code here
            },
            argv: function postArgv(nconf, done){
                //Your code here
            }
        }
});
// Your code here
```

#### Custom Workflow

If needed you can have your full custom configuration workflow,
simply by providing an object with the single key `customWorkflow`
attached to a function taking the `nconf` object, and a `done` callback.

```js
const configueOptions = { customWorkflow: function(nconf, done){
  // my own config setting
}};

const configue = Configue(configueOptions)
```

### Loading into Hapi

Thought _Configue_ is usable without hapi, (it was originally just a _Hapi_ plugin),
it can be easily loaded in hapi to have the _configue_ being easily accessible from
the server, or on the request.

To do this, you need to register the plugin. It takes care to resolve the config.
```js
const Hapi = require('hapi');
const Configue = require('configue');

const server = new Hapi.Server();
server.connection({port: 3000});

const configue = Configue({some: 'config'})

server.register({register: configue.plugin()}, (err) => {
       // starting the server or else
})
```

A more complete example is available in [`examples`](examples/basic-hapi-plugin.js) folder.

## Configuration Recap
Configue can be configured into two different way. Either using a config object or using a fluent builder.

### Configuration Object
Here is a recap of how the configuration should look like. All options are optional:

- `customWorkflow`: a function manipulating the `nconf`. This option is exclusive of all others
- `argv`: Config object for `yargv`, a map of config key with n object values (`alias`, `demandOption`, `default`,`describe`, `type`)
- `env`: The options for the `nconf.env` method that can be:
  - a string: separator for nested keys
  - an array of string, the whitelisted env method
  - an object with key: `separator`, `match`, `whitelist
- `disable`: A object with key `argv` and/or `env` attach to a boolean indicated whether the step shouldbe disable. 
        Default to true.
- `files`: file or list of files. (object `file`, `format`)
- `defaults`: Object of key mapped to default values. (or array of them)
- `postHooks`: an object of (`step`: function hook)
    step being one of `overrides`, `argv`, `env`, `files` `defaults`

For more details you can see the `internals.schema` in the `configue.js` file around the line 100

### Fluent builder

Instead to use the configuration object provided to the `Configue` constructor, you can use the fluent builder.
This consist in chaining a list of configuration methods before to retrieve the instance to a `get` method.

Here is a simple example:

```js
const configue = Configue.defaults({a: 1})
            .env(["HOME"])
            .get();
```

Here is the builder function list, the function name being the name of the key in the object config (except the postHooks function):
`argv`, `customWorkflow`, `defaults`, `disable`, `env`, `files` 
and `overridesHook`, `argvHook`, `envHook`, `filesHook`, `defaultsHook`


[Configue]: https://github.com/AdrieanKhisbe/configue
[github-repo]: https://github.com/AdrieanKhisbe/configue
[nconf]: https://github.com/indexzero/nconf
[nconf-options-argv-env]: https://github.com/indexzero/nconf#argv

[npm-badge]: https://img.shields.io/npm/v/configue.svg
[npm-url]: https://npmjs.com/package/configue
[travis-badge]: https://api.travis-ci.org/AdrieanKhisbe/configue.svg
[travis-url]: https://travis-ci.org/AdrieanKhisbe/configue
[david-badge]: https://david-dm.org/AdrieanKhisbe/configue.svg
[david-url]: https://david-dm.org/AdrieanKhisbe/configue
[experimental-badge]: https://img.shields.io/badge/stability-experimental-DD5F0A.svg
[experimental-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
[codeclimate-badge]: https://codeclimate.com/github/AdrieanKhisbe/configue/badges/gpa.svg
[codeclimate-url]: https://codeclimate.com/github/AdrieanKhisbe/configue
[coverage-badge]: https://codeclimate.com/github/AdrieanKhisbe/configue/badges/coverage.svg
[coverage-url]: https://codeclimate.com/github/AdrieanKhisbe/configue/coverage
[bithound-badge]: https://www.bithound.io/github/AdrieanKhisbe/configue/badges/score.svg
[bithound-url]: https://www.bithound.io/github/AdrieanKhisbe/configue
