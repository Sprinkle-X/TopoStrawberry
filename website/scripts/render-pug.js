'use strict';
const fs = require('fs');
const upath = require('upath');
const pug = require('pug');
const sh = require('shelljs');
const prettier = require('prettier');

module.exports = function renderPug(filePath) {
    const configuredUrl = process.env.SITE_URL || 'https://sprinkle-x.github.io/TopoStrawberry/';
    let siteUrl;
    if (configuredUrl) {
        const url = new URL(configuredUrl);
        if (!['https:', 'http:'].includes(url.protocol)) {
            throw new Error('SITE_URL must be an HTTP or HTTPS URL.');
        }
        url.search = '';
        url.hash = '';
        siteUrl = url.href.endsWith('/') ? url.href : `${url.href}/`;
    }
    const destPath = filePath.replace(/src\/pug\//, 'dist/').replace(/\.pug$/, '.html');
    const srcPath = upath.resolve(upath.dirname(__filename), '../src');

    console.log(`### INFO: Rendering ${filePath} to ${destPath}`);
    const html = pug.renderFile(filePath, {
        doctype: 'html',
        filename: filePath,
        basedir: srcPath,
        siteUrl,
        dataset: JSON.parse(fs.readFileSync(upath.join(srcPath, 'assets/dataset-summary.json'), 'utf8')),
        annotationExampleJSON: JSON.stringify(JSON.parse(fs.readFileSync(upath.join(srcPath, 'data/annotation-example.json'), 'utf8')), null, 2)
            .replace(/\[\s*([\d.eE+\-,\s]+)\s*\]/g, (_, values) => '[' + values.trim().split(/\s*,\s*/).join(', ') + ']')
            .replace(/\[\s*\]/g, '[]'),
        number: value => Number(value).toLocaleString('en-US'),
        share: (value, total) => `${Math.round(100 * value / total)}%`
    });

    const destPathDirname = upath.dirname(destPath);
    if (!sh.test('-e', destPathDirname)) {
        sh.mkdir('-p', destPathDirname);
    }

    const prettified = prettier.format(html, {
        printWidth: 1000,
        tabWidth: 4,
        singleQuote: true,
        proseWrap: 'preserve',
        endOfLine: 'lf',
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore'
    });

    fs.writeFileSync(destPath, prettified);
};
