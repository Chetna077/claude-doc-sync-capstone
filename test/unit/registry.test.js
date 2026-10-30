'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { registry, resolve } = require('../../src/resolvers');

const EXPECTED_NAMES = [
  'ProjectName',
  'Description',
  'MainEntryPoint',
  'Dependencies',
  'DevDependencies',
  'TestCommand',
  'Author',
  'License',
  'LastCommitDate',
  'LastCommitAuthor',
];

test('registry: contains exactly the ten documented placeholders', () => {
  assert.deepEqual(Object.keys(registry).sort(), [...EXPECTED_NAMES].sort());
});

test('registry: every entry is a function', () => {
  for (const name of EXPECTED_NAMES) {
    assert.equal(typeof registry[name], 'function', name);
  }
});

test('resolve: unknown placeholder resolves to null', () => {
  assert.equal(resolve('Nope', { pkg: { name: 'x' }, repoPath: '.' }), null);
});

test('resolve: names are case-sensitive', () => {
  assert.equal(resolve('projectname', { pkg: { name: 'x' }, repoPath: '.' }), null);
  assert.equal(resolve('PROJECTNAME', { pkg: { name: 'x' }, repoPath: '.' }), null);
});

test('resolve: prototype property names are not treated as placeholders', () => {
  for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    assert.equal(resolve(name, { pkg: {}, repoPath: '.' }), null, name);
  }
});

test('resolve: package placeholders resolve from ctx.pkg', () => {
  const ctx = { pkg: { name: 'demo', license: 'MIT' }, repoPath: '.' };
  assert.equal(resolve('ProjectName', ctx), 'demo');
  assert.equal(resolve('License', ctx), 'MIT');
});

test('resolve: package placeholders are null when ctx.pkg is null', () => {
  const ctx = { pkg: null, repoPath: '.' };
  for (const name of EXPECTED_NAMES.slice(0, 8)) {
    assert.equal(resolve(name, ctx), null, name);
  }
});
