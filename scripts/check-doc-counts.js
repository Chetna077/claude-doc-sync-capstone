#!/usr/bin/env node
'use strict';
// Guards against stale numbers in the docs.
// Runs `npm test`, reads the real total from the test output, and compares it with the number
// recorded in the marker `<!-- test-count: N -->` of the given Markdown file.
// Usage: node scripts/check-doc-counts.js <markdown-file>
// Exit 0 when they match, exit 1 when they differ or cannot be read. Zero dependencies.
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const docPath = process.argv[2];
if (!docPath) {
  console.error('usage: node scripts/check-doc-counts.js <markdown-file>');
  process.exit(1);
}

let doc;
try {
  doc = fs.readFileSync(docPath, 'utf8');
} catch (err) {
  console.error(`check-doc-counts: cannot read ${docPath}: ${err.message}`);
  process.exit(1);
}

const marker = doc.match(/<!--\s*test-count:\s*(\d+)\s*-->/);
if (!marker) {
  console.error(`check-doc-counts: no "<!-- test-count: N -->" marker in ${docPath}`);
  process.exit(1);
}
const documented = Number(marker[1]);

const run = spawnSync('npm', ['test'], { encoding: 'utf8', shell: true });
const output = `${run.stdout || ''}\n${run.stderr || ''}`;
const total = output.match(/^(?:#|ℹ)\s+tests\s+(\d+)/m);
if (!total) {
  console.error('check-doc-counts: could not read the test total from the npm test output');
  process.exit(1);
}
const actual = Number(total[1]);

if (actual !== documented) {
  console.error(`check-doc-counts: ${docPath} says ${documented} tests but npm test ran ${actual}.`);
  console.error('Update the marker and the numbers in the report after re-verifying.');
  process.exit(1);
}
console.log(`check-doc-counts: OK (${actual} tests, matches ${docPath})`);
