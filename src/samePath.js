'use strict';

const fs = require('fs');
const path = require('path');

/**
 * True when two paths refer to the same file location. Each path is
 * canonicalised with realpath (so symlinks and `.`/`..` spellings collapse);
 * a path that does not exist yet falls back to path.resolve. On win32 the
 * comparison is case-insensitive.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function samePath(a, b) {
  const normalize = (value) => {
    const normalized = path.normalize(value);
    return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
  };

  const canonical = (value) => {
    try {
      return fs.realpathSync.native(value);
    } catch {
      return path.resolve(value);
    }
  };

  return normalize(canonical(a)) === normalize(canonical(b));
}

module.exports = { samePath };
