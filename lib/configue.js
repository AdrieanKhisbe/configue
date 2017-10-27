'use strict';

const _ = require('lodash');
const Configue = require('./configue-core');
const addBuilder = require('./configue-builder');
const addGetters = require('./configue-getters');
const addHapiPlugin = require('./configue-hapi-plugin');

module.exports = addHapiPlugin(addBuilder(addGetters(Configue)));
