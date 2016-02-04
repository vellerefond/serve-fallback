# serve-fallback
Node server middleware to serve a fallback page, relative to the url, instead of a 404 response

## description

When a library/framework needs to handle url paths exclusively then the server should allow
a reasonable fallback for any url path. When a typical hierarchy of folders contains index files
then it's sometimes desirable to always fallback to them if a 404 error code would occur otherwise.

## options

```javascript
{
  // the path to the served directory (default: .)
  root: '.',

  // the filename of the fallback file to serve in case of a non existent path (default: index.html)
  fallback: 'index.html',

  // whether or not to recurse backwards trying to find a valid fallback file to serve
  recurse: true
}
```

## usage

```javascript
const serveFallback = require('serve-fallback');

// then, using the middleware configuration of browser-sync as an example:
{
  ...,
  middleware: [ ..., serveFallback({ root: 'path/to/served/directory', fallback: 'default.html' }), ... ],
  ...
}
```

## how it works

Given the following directory structure:

> /
> > index.html

> > foo/
> > > index.html

> > bar/
> > > index.html

then the following table maps possibly requested paths to what is actually served (assuming the fallback filename is _index.html_):

| url requested | url modified (- (dash) means no modification) |
| :---: | :---: |
| / | - |
| /foo | - |
| /bar | - |
| /abc | /index.html |
| /foo/abc | /foo/index.html |
| /bar/abc/xyz | options.recurse ? /bar/index.html : whatever the next middleware returns |