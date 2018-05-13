module.exports = {
    disable: {env: true},
    argv: {
        salute: {
            alias: 's',
            type: 'string'
        },
        times: {
            alias: 'n',
            type: 'number'
        }

    },
    files: [{
        file: './config.yaml',
        format: require('nconf-yaml')
    }],
    defaults: {salute: 'hey', who: 'you', times: 1},
    models: {
        hello: {hello: 'salute', target: 'who'},
        bonjour: c => ({bonjour: c('salute'), cible: 'lemonde', langue: c('lang', 'fr')})
  }
};
