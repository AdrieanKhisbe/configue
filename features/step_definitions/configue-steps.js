const Code = require('code');
const expect = Code.expect;


module.exports = function () {
    this.Given(/^I load Configue(?: with option "(\s+)")?$/, function (option, callback) {
        //TODO: use jsonic
        this.register(this.configue, {}, callback);
    });

    this.When(/^I try to access the "([^"]*)"$/, function (key, callback) {
        this.res = this.getConfig(key);
        console.log(this.res);
        callback();
    });

    this.Then(/^I should see have for associated value: "([^"]*)"$/, function (expectedRes, callback) {
        expect(expectedRes).to.deep.equal(this.res);
        callback();
    });
};