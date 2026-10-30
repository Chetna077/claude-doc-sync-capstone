'use strict';
// Local deployment: installs the built tarball into .deploy/ and runs a smoke test with the installed CLI.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const target = path.join(root, '.deploy');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const sh = process.platform === 'win32';

const tarball = fs.readdirSync(dist).find((f) => f.endsWith('.tgz'));
if (!tarball) throw new Error('No artifact in dist/. Run: npm run build');

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target);
execFileSync(npm, ['install', '--prefix', target, path.join(dist, tarball), '--silent'], { cwd: root, shell: sh });

const pkg = require(path.join(root, 'package.json'));
const installed = path.join(target, 'node_modules', pkg.name);
const cli = path.join(installed, 'bin', 'claude-doc-sync.js');
const out = path.join(target, 'smoke-output.md');
execFileSync('node', [cli, '--template', path.join(installed, 'templates', 'project-doc.template.md'), '--repo', root, '--out', out], { cwd: root });

const templateText = fs.readFileSync(path.join(installed, 'templates', 'project-doc.template.md'), 'utf8');
const tokens = [...new Set([...templateText.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)].map((m) => m[1]))];
const text = fs.readFileSync(out, 'utf8');
const left = tokens.filter((t) => text.includes(`{{${t}}}`));
if (left.length) throw new Error(`Smoke test failed: unresolved template tokens: ${left.join(', ')}`);
console.log(`Deployed ${pkg.name}@${pkg.version} to ${target}\nSmoke test OK: ${out}`);
