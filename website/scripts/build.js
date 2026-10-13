'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const steps = [
    'clean.js',
    'build-pug.js',
    'build-scss.js',
    'build-scripts.js',
    'build-worker.js',
    'build-assets.js',
];

for (const step of steps) {
    const result = spawnSync(process.execPath, [path.join(__dirname, step)], {
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
}
