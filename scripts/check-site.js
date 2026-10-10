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
const summary = JSON.parse(fs.readFileSync(path.join(root, 'assets/dataset-summary.json'), 'utf8'));
const figure = fs.readFileSync(path.join(root, 'assets/dataset-distributions.svg'), 'utf8');
assert.equal(Object.values(summary.splits).reduce((sum, split) => sum + split.images, 0), summary.total_images);
assert.equal(Object.values(summary.splits).reduce((sum, split) => sum + split.annotations, 0), summary.total_annotations);
for (const value of [summary.total_images, summary.total_annotations, summary.total_annotations * summary.keypoint_order.length]) {
    const formatted = value.toLocaleString('en-US');
    assert(html.includes(formatted) && figure.includes(formatted), `Page and figure must match summary: ${formatted}`);
}
for (const [, radius] of figure.matchAll(/\brx="([\d.]+)"/g)) {
    assert.equal(Number(radius), 4, 'Figure rectangles must use consistent corner radii');
}
assert(!/harvestability|harvestable/i.test(html + figure + JSON.stringify(summary)), 'Removed attribute remains in public content');
console.log(`Checked ${checked} local resources, internal anchors, and point-cloud JSON under a project URL.`);
