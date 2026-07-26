'use strict';

const upath = require('upath');
const renderPug = require('./render-pug');

// The public site is intentionally a focused single-page experience.
// Legacy template pages remain in src/pug for reference but are not published.
const indexPath = upath.resolve(upath.dirname(__filename), '../src/pug/index.pug');

renderPug(indexPath);
