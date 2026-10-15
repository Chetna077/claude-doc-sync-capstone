'use strict';
// Build: runs the tests, then packs a deployable tarball into dist/ with build info.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });

run(npm, ['test']);
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);
const packed = run(npm, ['pack', '--pack-destination', 'dist', '--silent']).trim().split('\n').pop();
let sha = 'unknown';
try { sha = run('git', ['rev-parse', '--short', 'HEAD']).trim(); } catch { /* not a git repo */ }
const pkg = require(path.join(root, 'package.json'));
const info = { name: pkg.name, version: pkg.version, artifact: packed, gitCommit: sha, builtAt: new Date().toISOString(), tests: 'passed' };
fs.writeFileSync(path.join(dist, 'BUILD-INFO.json'), JSON.stringify(info, null, 2) + '\n');
console.log('Build OK:', info);
