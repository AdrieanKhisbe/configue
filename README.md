Hapi Configue Plugin
====================

***Config plugin for [Hapi](http://hapijs.com/).***

[![NPM Version](https://img.shields.io/npm/v/hapi-configue.svg)](https://npmjs.org/package/hapi-configue)
[![Experimental][experimental-badge]][experimental-url]
[![Build Status](https://travis-ci.org/AdrieanKhisbe/hapi-configue.svg)](https://travis-ci.org/AdrieanKhisbe/hapi-configue)
[![Coverage Status](https://coveralls.io/repos/AdrieanKhisbe/hapi-configue/badge.svg?branch=master&service=github)](https://coveralls.io/github/AdrieanKhisbe/hapi-configue?branch=master)
[![Dependency Status](https://david-dm.org/AdrieanKhisbe/hapi-configue.svg)](https://david-dm.org/AdrieanKhisbe/hapi-configue)
[![bitHound Overalll Score](https://www.bithound.io/github/AdrieanKhisbe/hapi-configue/badges/score.svg)](https://www.bithound.io/github/AdrieanKhisbe/hapi-configue)

### RENAMED TO [CONFIGUE][github-repo]

> ***This node.js module is being renamed to Configue, dropping the `hapi-` Prefix***

> Release `v0.7.1` is to warn of the migration!

[Configue] is a wrapper on [nconf] node hierarchical
plugin tool. It defines a standard workflow to load a config from environment variables,
command line arguments, files, that you can easily *configure* and *extend*.

## About Configue

[Configue] builds up on [nconf] and its
[Hierarchical configuration](https://github.com/indexzero/nconf#hierarchical-configuration) system.
It defines a list of configuration step that are executed in order.
Every property defined on a steps will shadow the same key in the following steps.

Quoting [nconf]: ***"The order in which you attach these configuration sources determines their priority in the hierarchy"***

Here are the standard steps [Configue] does define:
- `argv` : command line option
- `env` : environment variables
- `file` : config files
- `defaults` : default objects

The plugin loads the various configurations in order using predefined steps.
It starts by parsing argv then goes through the env and the files options
and finishes by loading the default config objects if any.
Hence why every option defined as an argument commandline will override defaults
and environment variables.

## Installation

Just add `hapi-configue` has a dependency installing it with npm.

    npm install --save hapi-configue

## Usage

### Basic usage without customization

```js
server.register({register: Configue}, (err) => {
    if (err) return console.log("Error loading plugins");

    const who = server.configue('who') || "World";

    server.route({
        method: 'GET', path: '/', handler: function (request, reply) {
            reply("Hello " + who);
        }
    });

    server.start(function () {
        console.log('Server running at:', server.info.uri);
        console.log('With "who" as ' + who)
    });
});
```

You can specify the `who` configue in different manners.
Here are some:

```sh
node basic.js --who=Woman
# configue through Env
export who=Man ; node basic.js
who=Human node basic.js
```

The full example is available in the [`examples`](./examples/basic.js) folder.

### Usage with customization of the configuration workflow

#### Specifying Files

The files key can contain a single object or an array of objects containing a file key containing the path to the config file. The object can also reference a nconf plugin tasked with the formatting using the key format.

```js
const server = new Hapi.Server();
server.connection();
server.register({
    register: Configue,
    options: {
        files: [
            {file: 'path/to/config.json'},
            {
                file: 'path/to/config2.yaml',
                format: require('nconf-yaml')
            }
        ]
    }
}, (err) => {
    // Your code here
});
```

#### Disabling Steps

The argv and env steps can be skipped using the `disable` object in `options`.

```js
const server = new Hapi.Server();
server.connection();
server.register({
    register: Configue,
    options: {
        disable: {
            argv: true
        }
    }
}, (err) => {
    // Your code here
});
```

#### Step hooks

Every step has a post hook available.
Those can be defined using the `postHooks` key and accept a
function that take `nconf` as a parameter and a callback as a parameter.

The special hooks `overrides`  enables you to respectively apply a hook at the very beginning.

```js
const server = new Hapi.Server();
server.connection();
server.register({
    register: Configue,
    options: {
        postHooks: {
            overrides: function first(nconf, done){
                //Your code here
            },
            argv: function postArgv(nconf, done){
                //Your code here
            }
        }
    }
}, (err) => {
    // Your code here
});
```

#### Custom Workflow

If needed you can have your full custom configuration workflow,
simply by providing an object with the single key `customWorkflow`

```js
const configueOptions = { customWorkflow: function(nconf, done){
  // my own config setting
}};

server.register({register: Configue, options: configueOptions}, (err) => {

});

```


[Configue]: https://github.com/AdrieanKhisbe/hapi-configue
[github-repo]: https://github.com/AdrieanKhisbe/configue
[nconf]: (https://github.com/indexzero/nconf)
[experimental-badge]: https://img.shields.io/badge/stability-experimental-DD5F0A.svg
[experimental-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
