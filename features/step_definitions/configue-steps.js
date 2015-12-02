const Code = require('code');
const expect = Code.expect;


module.exports = function () {
    this.Given(/^I load Configue(?: with option "(\s+)")?$/, function (option, callback) {
        //TODO: use jsonic
        this.register(this.configue, {}, callback);
    });

    this.Given(/^I pass as arguments '([^']+)'$/, function (args, callback) {
        process.argv = [process.argv[0], process.argv[1], args];
        callback();
    });


    this.Given(/^I pass have as ENV var (\w+) with value (.*)$/, function (name, value, callback) {
        process.env[name] = eval(value);
        callback();
    });

    this.When(/^I try to access the "([^"]*)"$/, function (key, callback) {
        this.res = this.server.configue(key);
        callback();
    });

    this.Then(/^I should see have for associated value: "([^"]*)"$/, function (expectedRes, callback) {
        expect(expectedRes).to.deep.equal(this.res);
        callback();
    });

    this.Then(/^I should see have for associated value: undefined$/, function (callback) {
        expect(this.res).to.not.exist();
        callback();
    });
};