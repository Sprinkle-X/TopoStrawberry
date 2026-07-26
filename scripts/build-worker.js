'use strict';

const upath = require('upath');
const sh = require('shelljs');

const sourcePath = upath.resolve(upath.dirname(__filename), '../src/worker/index.js');
const destinationDir = upath.resolve(upath.dirname(__filename), '../dist/server');

sh.mkdir('-p', destinationDir);
sh.cp(sourcePath, upath.join(destinationDir, 'index.js'));
