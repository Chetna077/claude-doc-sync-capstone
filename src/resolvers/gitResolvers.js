'use strict';

const { readGitLog } = require('../sources/readGitLog');

function lastCommitDate(repoPath) {
  return readGitLog(repoPath, '%cI');
}

function lastCommitAuthor(repoPath) {
  return readGitLog(repoPath, '%an');
}

module.exports = { lastCommitDate, lastCommitAuthor };
