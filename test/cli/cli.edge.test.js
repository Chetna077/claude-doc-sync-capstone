'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createTempDir, initGitRepoWithCommit, removeDir } = require('../helpers/tempRepo');

const BIN_PATH = path.join(__dirname, '..', '..', 'bin', 'claude-doc-sync.js');

function runCli(args, cwd) {
  return spawnSync(process.execPath, [BIN_PATH, ...args], { encoding: 'utf8', cwd });
}

test('CLI: nonexistent --repo exits 1 and writes no output', () => {
  const dir = createTempDir();
  try {
    const templatePath = path.join(dir, 'template.md');
    const outPath = path.join(dir, 'out.md');
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');

    const result = runCli(['--template', templatePath, '--repo', path.join(dir, 'nope'), '--out', outPath]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /^Error: repo path not found or not a directory/);
    assert.equal(fs.existsSync(outPath), false);
  } finally {
    removeDir(dir);
  }
});

test('CLI: --repo pointing at a file exits 1', () => {
  const dir = createTempDir();
  try {
    const templatePath = path.join(dir, 'template.md');
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');

    const result = runCli(['--template', templatePath, '--repo', templatePath]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /repo path not found or not a directory/);
  } finally {
    removeDir(dir);
  }
});

test('CLI: --template pointing at a directory exits 1', () => {
  const dir = createTempDir();
  try {
    const result = runCli(['--template', dir]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /template file not found/);
  } finally {
    removeDir(dir);
  }
});

test('CLI: errors write nothing to stdout', () => {
  const result = runCli([]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
});

test('CLI: success writes nothing to stderr', () => {
  const dir = createTempDir();
  try {
    const templatePath = path.join(dir, 'template.md');
    fs.writeFileSync(templatePath, 'static\n');
    const result = runCli(['--template', templatePath, '--repo', dir, '--out', path.join(dir, 'o.md')]);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
  } finally {
    removeDir(dir);
  }
});

test('CLI: template without placeholders reports 0 / 0', () => {
  const dir = createTempDir();
  try {
    const templatePath = path.join(dir, 'template.md');
    fs.writeFileSync(templatePath, '# Static\n');
    const result = runCli(['--template', templatePath, '--repo', dir, '--out', path.join(dir, 'o.md')]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '0 / 0 placeholders found.');
  } finally {
    removeDir(dir);
  }
});

test('CLI: default --out is <template-basename>.filled.md in the current directory', () => {
  const repoDir = createTempDir();
  const cwdDir = createTempDir();
  try {
    const templatePath = path.join(repoDir, 'project-doc.template.md');
    fs.writeFileSync(path.join(repoDir, 'package.json'), JSON.stringify({ name: 'default-out' }));
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');

    const result = runCli(['--template', templatePath, '--repo', repoDir], cwdDir);

    assert.equal(result.status, 0);
    const expected = path.join(cwdDir, 'project-doc.template.filled.md');
    assert.equal(fs.readFileSync(expected, 'utf8'), 'default-out\n');
    assert.equal(fs.existsSync(path.join(repoDir, 'project-doc.template.filled.md')), false);
  } finally {
    removeDir(repoDir);
    removeDir(cwdDir);
  }
});

test('CLI: default --repo is the current directory', () => {
  const dir = createTempDir();
  const templateDir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'from-cwd' }));
    const templatePath = path.join(templateDir, 't.md');
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');

    const result = runCli(['--template', templatePath, '--out', path.join(templateDir, 'o.md')], dir);

    assert.equal(result.status, 0);
    assert.equal(fs.readFileSync(path.join(templateDir, 'o.md'), 'utf8'), 'from-cwd\n');
  } finally {
    removeDir(dir);
    removeDir(templateDir);
  }
});

test('CLI: relative paths resolve against the current directory', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'relative' }));
    fs.writeFileSync(path.join(dir, 't.md'), '{{ProjectName}}\n');

    const result = runCli(['--template', 't.md', '--repo', '.', '--out', 'o.md'], dir);

    assert.equal(result.status, 0);
    assert.equal(fs.readFileSync(path.join(dir, 'o.md'), 'utf8'), 'relative\n');
  } finally {
    removeDir(dir);
  }
});

test('CLI: flag order does not matter', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'order' }));
    const templatePath = path.join(dir, 't.md');
    const outPath = path.join(dir, 'o.md');
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');

    const result = runCli(['--out', outPath, '--repo', dir, '--template', templatePath]);

    assert.equal(result.status, 0);
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'order\n');
  } finally {
    removeDir(dir);
  }
});

test('CLI: a successful run leaves the template byte-identical', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'keep' }));
    const templatePath = path.join(dir, 't.md');
    fs.writeFileSync(templatePath, '{{ProjectName}} {{Missing}}\n');
    const before = fs.readFileSync(templatePath);

    const result = runCli(['--template', templatePath, '--repo', dir, '--out', path.join(dir, 'o.md')]);

    assert.equal(result.status, 0);
    assert.deepEqual(fs.readFileSync(templatePath), before);
  } finally {
    removeDir(dir);
  }
});

test('CLI: --out equal to --template via a different spelling is rejected', () => {
  const dir = createTempDir();
  try {
    const templatePath = path.join(dir, 't.md');
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');
    const before = fs.readFileSync(templatePath);

    const result = runCli(['--template', 't.md', '--repo', dir, '--out', './t.md'], dir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /--out must not be the same path as --template/);
    assert.deepEqual(fs.readFileSync(templatePath), before);
  } finally {
    removeDir(dir);
  }
});

test('CLI: --out equal to --template via case-only differences is rejected on Windows', () => {
  if (process.platform !== 'win32') return;

  const dir = createTempDir();
  try {
    const templatePath = path.join(dir, 'TEMPLATE.md');
    fs.writeFileSync(templatePath, '{{ProjectName}}\n');
    const before = fs.readFileSync(templatePath);
    const outPath = path.join(dir, 'template.md');

    const result = runCli(['--template', templatePath, '--repo', dir, '--out', outPath]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /--out must not be the same path as --template/);
    assert.deepEqual(fs.readFileSync(templatePath), before);
  } finally {
    removeDir(dir);
  }
});

test('CLI: git-less repo still succeeds and reports only package hits', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'nogit' }));
    const templatePath = path.join(dir, 't.md');
    fs.writeFileSync(templatePath, '{{ProjectName}} {{LastCommitAuthor}}\n');
    const outPath = path.join(dir, 'o.md');

    const result = runCli(['--template', templatePath, '--repo', dir, '--out', outPath]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '1 / 2 placeholders found.');
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'nogit Not Found\n');
  } finally {
    removeDir(dir);
  }
});

test('CLI: full happy path against a real git repo resolves every git placeholder', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'g' }));
    initGitRepoWithCommit(dir, { authorName: 'Happy Path' });
    const templatePath = path.join(dir, 't.md');
    const outPath = path.join(dir, 'o.md');
    fs.writeFileSync(templatePath, '{{LastCommitAuthor}} @ {{LastCommitDate}}\n');

    const result = runCli(['--template', templatePath, '--repo', dir, '--out', outPath]);

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '2 / 2 placeholders found.');
    assert.match(fs.readFileSync(outPath, 'utf8'), /^Happy Path @ \d{4}-\d{2}-\d{2}T/);
  } finally {
    removeDir(dir);
  }
});
