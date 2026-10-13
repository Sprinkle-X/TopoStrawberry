'use strict';

const upath = require('upath');
const renderPug = require('./render-pug');

// Publish the dataset overview and its annotation protocol.
// Legacy template pages remain in src/pug for reference but are not published.
const indexPath = upath.resolve(upath.dirname(__filename), '../src/pug/index.pug');

renderPug(indexPath);
renderPug(upath.resolve(upath.dirname(__filename), '../src/pug/annotation-protocol.pug'));
