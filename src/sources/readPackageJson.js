'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Reads and parses <repoPath>/package.json.
 * @param {string} repoPath
 * @returns {object|null} the parsed object, or null on any failure
 *   (missing file, unreadable, invalid JSON). A leading UTF-8 BOM is ignored.
 */
function readPackageJson(repoPath) {
  try {
    const raw = fs.readFileSync(path.join(repoPath, 'package.json'), 'utf8');
    // Strip a single leading UTF-8 BOM (some Windows editors write one).
    const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

module.exports = { readPackageJson };
