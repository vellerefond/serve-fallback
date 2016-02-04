'use strict';

const url = require('url');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = (options) => {
  options = _.assign({
    root: '.',
    fallback: 'index.html',
    recurse: true,
  }, _.isPlainObject(options) ? options : {});
  return (req, res, next) => {
    const reqUrl = url.parse(req.url);
    let relativeFilePath = reqUrl.pathname.replace(/^\/|\/$/, '');
    while (!fs.existsSync(path.resolve(options.root, relativeFilePath))) {
      req.url = `/${relativeFilePath = _.initial(relativeFilePath.split(/\//)).join('/')}/${options.fallback}`.replace(/^\/\//, '/')
      + (reqUrl.search || '')
      + (reqUrl.hash || '');
      if (!options.recurse)
        break;
    }
    if (_.isFunction(next))
      return next();
  };
};
