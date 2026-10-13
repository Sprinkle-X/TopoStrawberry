'use strict';
const fs = require('fs');
const upath = require('upath');
const sh = require('shelljs');

module.exports = function renderAssets() {
    const sourcePath = upath.resolve(upath.dirname(__filename), '../src/assets');
    const destPath = upath.resolve(upath.dirname(__filename), '../dist/assets');
    const publicAssets = [
        'og-strawberry-dataset.jpg',
        'favicon.ico',
        'strawberry-favicon.png',
        'strawberry-mascot.png',
        'strawberry-field.webp',
        'dataset-annotation-overview.svg',
        'dataset-distributions.svg',
        'dataset-pointcloud.webp',
        'dataset-pointcloud-data.json',
        'dataset-summary.json',
        'TopoStrawberry_Dataset_Access_Application.docx',
    ];

    sh.mkdir('-p', destPath);
    publicAssets.forEach((asset) => {
        sh.cp(upath.join(sourcePath, asset), destPath);
    });
};
