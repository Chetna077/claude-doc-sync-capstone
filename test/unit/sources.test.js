'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { readPackageJson } = require('../../src/sources/readPackageJson');
const { readGitLog } = require('../../src/sources/readGitLog');
const { createTempDir, initGitRepoWithCommit, removeDir } = require('../helpers/tempRepo');

test('readPackageJson: parses a valid file', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0' }));
    assert.deepEqual(readPackageJson(dir), { name: 'x', version: '1.0.0' });
  } finally {
    removeDir(dir);
  }
});

test('readPackageJson: missing file returns null', () => {
  const dir = createTempDir();
  try {
    assert.equal(readPackageJson(dir), null);
  } finally {
    removeDir(dir);
  }
});

test('readPackageJson: nonexistent directory returns null', () => {
  assert.equal(readPackageJson(path.join(createTempDir(), 'no', 'such', 'dir')), null);
});

test('readPackageJson: invalid JSON returns null', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), '{ "name": "x", ');
    assert.equal(readPackageJson(dir), null);
  } finally {
    removeDir(dir);
  }
});

test('readPackageJson: empty file returns null', () => {
  const dir = createTempDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), '');
    assert.equal(readPackageJson(dir), null);
  } finally {
    removeDir(dir);
  }
});

test('readPackageJson: package.json that is a directory returns null', () => {
  const dir = createTempDir();
  try {
    fs.mkdirSync(path.join(dir, 'package.json'));
    assert.equal(readPackageJson(dir), null);
  } finally {
    removeDir(dir);
  }
});

test('readGitLog: returns trimmed output for a repo with a commit', () => {
  const dir = createTempDir();
  try {
    initGitRepoWithCommit(dir, { authorName: 'Linus T' });
    assert.equal(readGitLog(dir, '%an'), 'Linus T');
  } finally {
    removeDir(dir);
  }
});

test('readGitLog: supports different formats', () => {
  const dir = createTempDir();
  try {
    initGitRepoWithCommit(dir);
    assert.equal(readGitLog(dir, '%s'), 'initial commit');
    assert.match(readGitLog(dir, '%cI'), /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    removeDir(dir);
  }
});

test('readGitLog: repo with no commits returns null', () => {
  const dir = createTempDir();
  try {
    execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
    assert.equal(readGitLog(dir, '%an'), null);
  } finally {
    removeDir(dir);
  }
});

test('readGitLog: directory that is not a repo returns null', () => {
  const dir = createTempDir();
  try {
    assert.equal(readGitLog(dir, '%an'), null);
  } finally {
    removeDir(dir);
  }
});

test('readGitLog: nonexistent directory returns null', () => {
  assert.equal(readGitLog(path.join(createTempDir(), 'missing'), '%an'), null);
});

test('readGitLog: empty format output returns null', () => {
  const dir = createTempDir();
  try {
    initGitRepoWithCommit(dir);
    assert.equal(readGitLog(dir, ''), null);
  } finally {
    removeDir(dir);
  }
});
