'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createTempDir, initGitRepoWithCommit, removeDir } = require('../helpers/tempRepo');

const BIN_PATH = path.join(__dirname, '..', '..', 'bin', 'claude-doc-sync.js');

function runCli(args) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], { encoding: 'utf8' });
}

test('CLI: successful run prints summary and exits 0', () => {
  const repoDir = createTempDir();
  try {
    fs.writeFileSync(
      path.join(repoDir, 'package.json'),
      JSON.stringify({ name: 'cli-fixture', license: 'MIT' }, null, 2)
    );
    initGitRepoWithCommit(repoDir);

    const templatePath = path.join(repoDir, 'template.md');
    fs.writeFileSync(templatePath, '# {{ProjectName}}\nLicense: {{License}}\nOwner: {{Owner}}\n');
    const outPath = path.join(repoDir, 'output.md');

    const result = runCli(['--template', templatePath, '--repo', repoDir, '--out', outPath]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '2 / 3 placeholders found.');
    assert.equal(fs.existsSync(outPath), true);
    assert.match(fs.readFileSync(outPath, 'utf8'), /Owner: Not Found/);
  } finally {
    removeDir(repoDir);
  }
});

test('CLI: missing template file exits 1 with an Error message on stderr', () => {
  const repoDir = createTempDir();
  try {
    const result = runCli(['--template', path.join(repoDir, 'does-not-exist.md')]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^Error: /);
  } finally {
    removeDir(repoDir);
  }
});

test('CLI: missing --template flag exits 1', () => {
  const result = runCli([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--template <path> is required/);
});

test('CLI: --out same as --template is rejected and the template is left untouched', () => {
  const repoDir = createTempDir();
  try {
    const templatePath = path.join(repoDir, 'template.md');
    const originalText = '# {{ProjectName}}\n';
    fs.writeFileSync(templatePath, originalText);

    const result = runCli(['--template', templatePath, '--repo', repoDir, '--out', templatePath]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /--out must not be the same path as --template/);
    assert.equal(fs.readFileSync(templatePath, 'utf8'), originalText);
  } finally {
    removeDir(repoDir);
  }
});
