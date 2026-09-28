'use strict';

/**
 * Formats a dependencies object as "name@version, name@version, ...",
 * preserving package.json key order. Returns null for a missing or empty
 * object.
 * @param {object|undefined} deps
 * @returns {string|null}
 */
function formatDependencies(deps) {
  if (!deps || typeof deps !== 'object') return null;
  const keys = Object.keys(deps);
  if (keys.length === 0) return null;
  return keys.map((name) => `${name}@${deps[name]}`).join(', ');
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function projectName(pkg) {
  return pkg ? nonEmptyString(pkg.name) : null;
}

function description(pkg) {
  return pkg ? nonEmptyString(pkg.description) : null;
}

function mainEntryPoint(pkg) {
  if (!pkg) return null;
  const main = nonEmptyString(pkg.main);
  if (main) return main;

  const bin = pkg.bin;
  const binAsString = nonEmptyString(bin);
  if (binAsString) return binAsString;

  if (bin && typeof bin === 'object') {
    const keys = Object.keys(bin);
    if (keys.length > 0) {
      const first = nonEmptyString(bin[keys[0]]);
      if (first) return first;
    }
  }

  return null;
}

function dependencies(pkg) {
  return pkg ? formatDependencies(pkg.dependencies) : null;
}

function devDependencies(pkg) {
  return pkg ? formatDependencies(pkg.devDependencies) : null;
}

function testCommand(pkg) {
  if (!pkg || !pkg.scripts || typeof pkg.scripts !== 'object') return null;
  return nonEmptyString(pkg.scripts.test);
}

function author(pkg) {
  if (!pkg) return null;
  const value = pkg.author;

  const asString = nonEmptyString(value);
  if (asString) return asString;

  if (value && typeof value === 'object') {
    const name = nonEmptyString(value.name);
    if (name) return name;
  }

  return null;
}

function license(pkg) {
  return pkg ? nonEmptyString(pkg.license) : null;
}

module.exports = {
  projectName,
  description,
  mainEntryPoint,
  dependencies,
  devDependencies,
  testCommand,
  author,
  license,
};
