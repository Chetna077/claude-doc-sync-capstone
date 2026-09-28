'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Creates a fresh temp directory for a test fixture repo.
 * @returns {string} absolute path to the new directory
 */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'claude-doc-sync-test-'));
}

/**
 * Runs `git init` + a single commit in repoPath, with a fixed local
 * identity so tests never depend on the host machine's git config.
 * @param {string} repoPath
 * @param {{ authorName?: string }} [opts]
 */
function initGitRepoWithCommit(repoPath, opts = {}) {
  const authorName = opts.authorName || 'Test Author';
  const gitOpts = { cwd: repoPath, stdio: 'ignore' };
  execFileSync('git', ['init'], gitOpts);
  execFileSync('git', ['config', 'user.name', authorName], gitOpts);
  execFileSync('git', ['config', 'user.email', 'test@example.com'], gitOpts);
  fs.writeFileSync(path.join(repoPath, '.gitkeep'), '');
  execFileSync('git', ['add', '.'], gitOpts);
  execFileSync('git', ['commit', '-m', 'initial commit'], gitOpts);
}

function removeDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

module.exports = { createTempDir, initGitRepoWithCommit, removeDir };
