import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('public/site.webmanifest', 'utf8'));
const worker = fs.readFileSync('worker/sw.ts', 'utf8');
const registration = fs.readFileSync('plugins/sw.register.js', 'utf8');

assert.equal(manifest.id, '/lrc-maker/', 'LRC Maker PWA id must be unique on shinobione.github.io.');
assert.equal(manifest.start_url, '/lrc-maker/', 'LRC Maker start_url must stay inside its GitHub Pages project.');
assert.equal(manifest.scope, '/lrc-maker/', 'LRC Maker scope must not cover sibling GitHub Pages apps.');
assert.match(registration, /serviceWorker\.register\("\.\/sw\.js"\)/, 'LRC Maker service worker must stay registered from the project directory.');
assert.match(worker, /const APP_NAME = "akari-lrc-maker"/, 'LRC Maker cache namespace must remain explicit.');
assert.match(worker, /cacheName\.startsWith\(APP_NAME\) && cacheName !== CACHENAME/, 'LRC Maker must delete only its own obsolete caches.');

console.log('LRC Maker PWA identity, scope and cache namespace isolation are valid.');
