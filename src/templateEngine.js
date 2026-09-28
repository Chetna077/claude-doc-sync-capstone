'use strict';

const PLACEHOLDER_PATTERN = /\{\{([A-Za-z0-9_]+)\}\}/g;

/**
 * Returns the de-duplicated placeholder names found in `text`, in
 * first-seen order. Only bare {{Word}} tokens match.
 * @param {string} text
 * @returns {string[]}
 */
function extractPlaceholders(text) {
  const seen = new Set();
  const names = [];
  for (const match of text.matchAll(PLACEHOLDER_PATTERN)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/**
 * Replaces every {{Name}} occurrence in `text` with the corresponding
 * value from `valuesByName`, or the literal string "Not Found" when the
 * value is missing or null.
 * @param {string} text
 * @param {Map<string, string|null>} valuesByName
 * @returns {string}
 */
function substitute(text, valuesByName) {
  return text.replace(PLACEHOLDER_PATTERN, (_match, name) => {
    const value = valuesByName.get(name);
    return value === undefined || value === null ? 'Not Found' : value;
  });
}

module.exports = { extractPlaceholders, substitute };
