'use strict';

const url = require('url');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

module.exports = (options) =>
{
	options = _.assign({
		root: '.',
		fallback: 'index.html',
		recurse: true,
		fallbackToRoot: false,
		memoizePathChecks: true,
		memoizeCacheConstructor: Map,
		memoizedPathsMax: 1000,
		log: null,
	}, _.isPlainObject(options) ? options : {});

	_.memoize.Cache = options.memoizeCacheConstructor;

	const log = msg =>
	{
		if (!_.isFunction(options.log))
			return;
		options.log(`serve-fallback: ${msg}`);
	};

	const fsExistsSyncWrapper = path => fs.existsSync(path);
	const fsExistsSyncProxy = options.memoizePathChecks ? _.memoize(fsExistsSyncWrapper) : fsExistsSyncWrapper;

	return (req, res, next) =>
	{
		const reqUrl = url.parse(req.url);
		let relativeFilePath = reqUrl.pathname.replace(/^\/|\/$/, '');

		if (!fsExistsSyncProxy(path.resolve(options.root, relativeFilePath))) {
			if (options.fallbackToRoot)
				// unconditionally serve the fallback relative to the served directory
				req.url = `/${options.fallback}`;
			else
				// try to find an existing file matching the fallbick file name
				do {
					relativeFilePath = _.initial(relativeFilePath.split(/\//)).join('/');

					/*
					 * if the served directory is reached,
					 * unconditionally try to serve the fallbcik file
					 * from there
					 */
					if (/^\/?$/.test(relativeFilePath.trim())) {
						req.url = `/${options.fallback}`;
						log(`reached the root, will serve /${options.fallback}`);
						break;
					}

					/*
					 * if the fallback file ddoes not exist in the current relative file path,
					 * try one level up, if recursion is enabled
					 */
					if (!fsExistsSyncProxy(path.resolve(options.root, relativeFilePath, options.fallback)))
						continue;

					req.url = `/${relativeFilePath}/${options.fallback}`.replace(/^\/\//, '/')
					+ (reqUrl.search || '')
					+ (reqUrl.hash || '');
					log(`will serve ${req.url}`);
					break;
				} while(options.recurse);

			/*
			 * if all fails, unconditionally try to serve the fallback file
			 * from the served directory
			 */
			if (/^\/?$/.test(relativeFilePath.trim())
			|| !fsExistsSyncProxy(path.resolve(options.root, relativeFilePath, options.fallback))) {
				req.url = `/${options.fallback}`;
				log(`will ${options.fallbackToRoot ? 'unconditionally ' : ''}serve ${req.url}`);
			}
		} else {
			log(`will pass through ${req.url}`);
		}

		if (options.memoizePathChecks && fsExistsSyncProxy.cache.size > options.memoizedPathsMax)
			fsExistsSyncProxy.cache.clear();

		if (_.isFunction(next))
			return next();
	};
};
