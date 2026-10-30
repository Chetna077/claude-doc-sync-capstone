'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { samePath } = require('../../src/samePath');
const { createTempDir, removeDir } = require('../helpers/tempRepo');

test('samePath: identical path is true, different files are false', () => {
  const dir = createTempDir();
  try {
    const a = path.join(dir, 'a.md');
    const b = path.join(dir, 'b.md');
    fs.writeFileSync(a, 'a');
    fs.writeFileSync(b, 'b');
    assert.equal(samePath(a, a), true);
    assert.equal(samePath(a, b), false);
  } finally {
    removeDir(dir);
  }
});

test('samePath: a different spelling of the same file is true', () => {
  const dir = createTempDir();
  try {
    const f = path.join(dir, 'f.md');
    fs.writeFileSync(f, 'x');
    assert.equal(samePath(path.join(dir, '.', 'f.md'), f), true);
    assert.equal(samePath(path.join(dir, 'sub', '..', 'f.md'), f), true);
  } finally {
    removeDir(dir);
  }
});

test('samePath: nonexistent paths fall back to path.resolve', () => {
  const dir = createTempDir();
  try {
    const missing = path.join(dir, 'not-yet.md');
    assert.equal(samePath(missing, path.join(dir, '.', 'not-yet.md')), true);
    assert.equal(samePath(missing, path.join(dir, 'other.md')), false);
  } finally {
    removeDir(dir);
  }
});

test('samePath: a case-only difference matches on win32 only', () => {
  const dir = createTempDir();
  try {
    const lower = path.join(dir, 'case.md');
    const upper = path.join(dir, 'CASE.md');
    // Neither file exists, so this exercises the normalize step alone.
    assert.equal(samePath(lower, upper), process.platform === 'win32');
  } finally {
    removeDir(dir);
  }
});

test('samePath: a symlink to the same file is true', (t) => {
  const dir = createTempDir();
  try {
    const target = path.join(dir, 'target.md');
    const link = path.join(dir, 'link.md');
    fs.writeFileSync(target, 'x');
    try {
      fs.symlinkSync(target, link);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        t.skip(`cannot create symlink here (${err.code})`);
        return;
      }
      throw err;
    }
    assert.equal(samePath(link, target), true);
  } finally {
    removeDir(dir);
  }
});
