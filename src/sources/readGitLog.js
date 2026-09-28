'use strict';

const { execFileSync } = require('child_process');

/**
 * Runs `git log -1 --format=<format>` in repoPath and returns the trimmed
 * output.
 * @param {string} repoPath
 * @param {string} format a git pretty-format string, e.g. "%cI" or "%an"
 * @returns {string|null} null on any failure: not a git repo, no commits
 *   yet, git not installed, or the command times out.
 */
function readGitLog(repoPath, format) {
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', `--format=${format}`],
      {
        cwd: repoPath,
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    const trimmed = output.toString('utf8').trim();
    return trimmed === '' ? null : trimmed;
  } catch {
    return null;
  }
}

module.exports = { readGitLog };
