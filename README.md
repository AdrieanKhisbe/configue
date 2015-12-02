Hapi Configue Plugin
====================

[![NPM Version](https://img.shields.io/npm/v/hapi-configue.svg)](https://npmjs.org/package/hapi-configue)
[![Build Status](https://travis-ci.org/AdrieanKhisbe/hapi-configue.svg)](https://travis-ci.org/AdrieanKhisbe/hapi-configue)
[![Coverage Status](https://coveralls.io/repos/AdrieanKhisbe/hapi-config/badge.svg?branch=master&service=github)](https://coveralls.io/github/AdrieanKhisbe/hapi-config?branch=master)
[![Dependency Status](https://david-dm.org/AdrieanKhisbe/hapi-configue.svg)](https://david-dm.org/AdrieanKhisbe/hapi-configue)

***Config plugin for [Hapi](http://hapijs.com/).***

Configue is a wrapper on [nconf](https://github.com/indexzero/nconf) node hierarchical
plugin tool. It defines a standard workflow to load a config from environment variable,
command line arguments, files, that you can easily configure and extend.

# Usage

## Basic usage without customization

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
node index.js --who=Woman
# configue through Env
export who=Man ; node index.js
who=Human node index.js
```

## Usage with customization of the configuration workflow

**TODO**

# Steps

**TODO**

# Installation

Just add `hapi-configue` has a dependancy installing it with npm.

    npm install --save hapi-configue