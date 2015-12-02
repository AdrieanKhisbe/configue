"use strict";
const Hapi = require('hapi');
const Configue = require('../..');

function World() {
    const self = this;
    this.server = new Hapi.Server();
    this.configue = Configue;

    this.register = function (plugin, options, done) {
        self.server.register({register: plugin, options: options || {}}, done);
    };

}

module.exports = function () {
    this.World = World;
};