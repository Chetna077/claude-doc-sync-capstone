'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const gitResolvers = require('../../src/resolvers/gitResolvers');
const { createTempDir, initGitRepoWithCommit, removeDir } = require('../helpers/tempRepo');

test('lastCommitDate/lastCommitAuthor: not a git repo returns Not Found', () => {
  const dir = createTempDir();
  try {
    assert.equal(gitResolvers.lastCommitDate(dir), null);
    assert.equal(gitResolvers.lastCommitAuthor(dir), null);
  } finally {
    removeDir(dir);
  }
});

test('lastCommitDate/lastCommitAuthor: repo with a commit resolves both', () => {
  const dir = createTempDir();
  try {
    initGitRepoWithCommit(dir, { authorName: 'Ada Lovelace' });
    const date = gitResolvers.lastCommitDate(dir);
    const author = gitResolvers.lastCommitAuthor(dir);
    assert.equal(author, 'Ada Lovelace');
    assert.match(date, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  } finally {
    removeDir(dir);
  }
});
