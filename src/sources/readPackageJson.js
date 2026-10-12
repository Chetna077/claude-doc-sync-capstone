'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Reads and parses <repoPath>/package.json.
 * @param {string} repoPath
 * @returns {object|null} the parsed object, or null on any failure
 *   (missing file, unreadable, invalid JSON).
 */
function readPackageJson(repoPath) {
  try {
    const raw = fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { readPackageJson };
