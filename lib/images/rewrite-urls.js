var path = require('path');
var url = require('url');

var UrlScanner = require('../utils/url-scanner');

var isWindows = process.platform == 'win32';

function isAbsolute(uri) {
  return uri[0] == '/';
}

function isSVGMarker(uri) {
  return uri[0] == '#';
}

function isEscaped(uri) {
  return uri.indexOf('__ESCAPED_URL_CLEAN_CSS__') === 0;
}

function isRemote(uri) {
  return uri.indexOf('http://') === 0 || uri.indexOf('https://') === 0;
}

function isImport(uri) {
  return uri.lastIndexOf('.css') === uri.length - 4;
}

function isData(uri) {
  return uri.indexOf('data:') === 0;
}

function absolute(uri, options) {
  return path
    .resolve(path.join(options.fromBase, uri))
    .replace(options.toBase, '');
}

function relative(uri, options) {
  return path.relative(options.toBase, path.join(options.fromBase, uri));
}

function normalize(uri) {
  return isWindows ? uri.replace(/\\/g, '/') : uri;
}

function rebase(uri, options) {
  if (isAbsolute(uri) || isSVGMarker(uri) || isEscaped(uri))
    return uri;

  if (options.rebase === false && !isImport(uri))
    return uri;

  if (!options.imports && isImport(uri))
    return uri;

  if (isData(uri))
    return '\'' + uri + '\'';

  if (isRemote(uri) || isRemote(options.toBase))
    return url.resolve(options.toBase, uri);

  return options.absolute ?
    normalize(absolute(uri, options)) :
    normalize(relative(uri, options));
}

function rewriteUrls(data, options, context) {
  return new UrlScanner(data, context).reduce(function (url, tempData) {
    url = url.replace(/^url\(\s*['"]?|['"]?\s*\)$/g, '');
    tempData.push('url(' + rebase(url, options) + ')');
  });
}

module.exports = rewriteUrls;
