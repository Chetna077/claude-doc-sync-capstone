'use strict';

const fs = require('fs');
const { extractPlaceholders, substitute } = require('./templateEngine');
const { readPackageJson } = require('./sources/readPackageJson');
const { resolve } = require('./resolvers');
const { samePath } = require('./samePath');

/**
 * Fills a Markdown template's {{Placeholder}} tokens from real repo state
 * and writes the result to outPath. Never modifies templatePath.
 * @param {{ templatePath: string, repoPath: string, outPath: string }} opts
 * @returns {{ total: number, found: number, values: Map<string, string|null> }}
 * @throws {Error} when outPath is the same file as templatePath (checked
 *   before anything is read or written).
 */
function run({ templatePath, repoPath, outPath }) {
  if (samePath(outPath, templatePath)) {
    throw new Error('--out must not be the same path as --template (the template is never modified)');
  }

  const templateText = fs.readFileSync(templatePath, 'utf8');
  const names = extractPlaceholders(templateText);

  const pkg = readPackageJson(repoPath);
  const ctx = { pkg, repoPath };

  const values = new Map();
  let found = 0;
  for (const name of names) {
    const value = resolve(name, ctx);
    values.set(name, value);
    if (value !== null) found += 1;
  }

  const outputText = substitute(templateText, values);
  fs.writeFileSync(outPath, outputText, 'utf8');

  return { total: names.length, found, values };
}

module.exports = { run };
