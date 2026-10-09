'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const base = new URL('https://example.invalid/project/');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
let checked = 0;

for (const [, attribute, value] of html.matchAll(/\b(href|src|data-source)="([^"]+)"/g)) {
    if (value.startsWith('#')) {
        assert(ids.has(value.slice(1)), `Missing anchor: ${value}`);
        continue;
    }
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) continue;
    assert(!value.startsWith('/'), `Resource must work beneath a project path: ${value}`);
    const resolved = new URL(value, base);
    assert(resolved.pathname.startsWith(base.pathname), `Resource escapes site path: ${value}`);
    const relative = decodeURIComponent(resolved.pathname.slice(base.pathname.length));
    assert(fs.existsSync(path.join(root, relative)), `Missing ${attribute}: ${value}`);
    checked++;
}

assert(!html.includes('strawberry-vision-dataset.yuhao-jin.chatgpt.site'), 'Old hosting URL remains');
const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/dataset-pointcloud-data.json'), 'utf8'));
assert(data && typeof data === 'object', 'Point-cloud data is invalid');
console.log(`Checked ${checked} local resources, internal anchors, and point-cloud JSON under a project URL.`);
