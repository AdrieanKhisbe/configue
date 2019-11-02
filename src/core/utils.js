const _ = require('lodash/fp');

const getPaths = (obj, basePath = []) =>
  _.reduce(
    (memo, path) =>
      _.isPlainObject(obj[path])
        ? [...memo, ...getPaths(obj[path], [...basePath, path])]
        : [...memo, [...basePath, path]],
    [],
    _.keys(obj)
  );

module.exports = {getPaths};
