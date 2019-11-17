const path = require('path');
const test = require('ava');
const Configue = require('../src');

const JSON_CONF_FILE = path.join(__dirname, 'data/config.json');
const JSON5_CONF_FILE = path.join(__dirname, 'data/config.json5');
const PROPERTIES_CONF_FILE = path.join(__dirname, 'data/config.properties');
const JSON_CONF_FILE_BIS = path.join(__dirname, 'data/config-bis.json');
const YAML_CONF_FILE = path.join(__dirname, 'data/config.yaml');

test('can load data from a json file given as string', t => {
  const configue = Configue({files: JSON_CONF_FILE});
  t.is(configue.get('key'), 'json-config');
});

test('can load data from a json files given as string array', t => {
  const configue = Configue({files: [JSON_CONF_FILE, JSON_CONF_FILE_BIS]});
  t.is(configue.get('key'), 'json-config');
  t.is(configue.get('key-bis'), 'json-config-bis');
});

test('can load data from a json file', t => {
  const configue = Configue({files: [{file: JSON_CONF_FILE}]});
  t.is(configue.get('key'), 'json-config');
  t.is(configue.get('nested:key'), 'nested');
});

test('can load data from a json5 file', t => {
  const configue = Configue({files: JSON5_CONF_FILE});
  t.is(configue.get('key'), 'json5-config');
  t.is(configue.get('nested:key'), 'nested');
});

test('can load data from a yaml file', t => {
  const configueOptions = {
    files: [
      {
        file: YAML_CONF_FILE,
        format: require('nconf-yaml')
      }
    ]
  };
  const configue = Configue(configueOptions);
  t.is(configue.get('key'), 'yaml-config');
  t.is(configue.get('nested:key'), 'nested');
});

test('can load data from a yaml file without saying explicitely it is one', t => {
  const configueOptions = {
    files: YAML_CONF_FILE
  };
  const configue = Configue(configueOptions);
  t.is(configue.get('key'), 'yaml-config');
  t.is(configue.get('nested:key'), 'nested');
});

test('can load data from a yaml file without saying explicitely it is one in a list', t => {
  const configueOptions = {
    files: [YAML_CONF_FILE, JSON_CONF_FILE]
  };
  const configue = Configue(configueOptions);
  t.is(configue.get('key'), 'yaml-config');
  t.is(configue.get('nested:key'), 'nested');
});

test('can load data from a properties file without saying explicitely it is one', t => {
  const configueOptions = {
    files: PROPERTIES_CONF_FILE
  };
  const configue = Configue(configueOptions);
  t.is(configue.get('key'), 'properties-config');
  t.is(configue.get('nested:key'), 'nested');
});

test('files are loaded in order', t => {
  const configueOptions = {
    files: [
      {file: JSON_CONF_FILE},
      {
        file: YAML_CONF_FILE,
        format: require('nconf-yaml')
      }
    ]
  };
  const configue = Configue(configueOptions);
  t.is(configue.get('key'), 'json-config');
});
