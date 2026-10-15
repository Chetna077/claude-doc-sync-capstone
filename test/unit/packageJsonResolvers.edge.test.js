'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const resolvers = require('../../src/resolvers/packageJsonResolvers');

test('every resolver returns null when pkg is null', () => {
  for (const [name, fn] of Object.entries(resolvers)) {
    assert.equal(fn(null), null, `${name}(null)`);
  }
});

test('every resolver returns null for an empty package object', () => {
  for (const [name, fn] of Object.entries(resolvers)) {
    assert.equal(fn({}), null, `${name}({})`);
  }
});

test('string fields: empty and whitespace-only values are Not Found', () => {
  for (const blank of ['', ' ', '\t\n']) {
    assert.equal(resolvers.projectName({ name: blank }), null);
    assert.equal(resolvers.description({ description: blank }), null);
    assert.equal(resolvers.license({ license: blank }), null);
    assert.equal(resolvers.author({ author: blank }), null);
    assert.equal(resolvers.testCommand({ scripts: { test: blank } }), null);
  }
});

test('string fields: non-string types are Not Found', () => {
  assert.equal(resolvers.projectName({ name: 42 }), null);
  assert.equal(resolvers.description({ description: ['a'] }), null);
  assert.equal(resolvers.license({ license: { type: 'MIT' } }), null);
  assert.equal(resolvers.projectName({ name: null }), null);
  assert.equal(resolvers.projectName({ name: true }), null);
});

test('mainEntryPoint: blank main falls back to bin', () => {
  assert.equal(resolvers.mainEntryPoint({ main: '  ', bin: 'bin/cli.js' }), 'bin/cli.js');
});

test('mainEntryPoint: empty bin object is Not Found', () => {
  assert.equal(resolvers.mainEntryPoint({ bin: {} }), null);
});

test('mainEntryPoint: first bin entry that is not a string is Not Found', () => {
  assert.equal(resolvers.mainEntryPoint({ bin: { a: 5, b: 'bin/b.js' } }), null);
});

test('mainEntryPoint: bin of the wrong type is Not Found', () => {
  assert.equal(resolvers.mainEntryPoint({ bin: 7 }), null);
});

test('dependencies: non-object values are Not Found', () => {
  assert.equal(resolvers.dependencies({ dependencies: 'left-pad' }), null);
  assert.equal(resolvers.dependencies({ dependencies: null }), null);
  assert.equal(resolvers.dependencies({ dependencies: 5 }), null);
});

test('dependencies: single entry has no trailing separator', () => {
  assert.equal(resolvers.dependencies({ dependencies: { a: '^1.0.0' } }), 'a@^1.0.0');
});

test('dependencies: scoped names and version ranges are kept verbatim', () => {
  assert.equal(
    resolvers.dependencies({ dependencies: { '@scope/pkg': '>=1.2.0 <2', x: 'github:u/r' } }),
    '@scope/pkg@>=1.2.0 <2, x@github:u/r'
  );
});

test('dependencies and devDependencies: a non-string version is Not Found', () => {
  for (const bad of [{ b: 1 }, 1, null, true, ['1.0.0']]) {
    assert.equal(resolvers.dependencies({ dependencies: { a: bad } }), null, JSON.stringify(bad));
    assert.equal(resolvers.devDependencies({ devDependencies: { a: bad } }), null, JSON.stringify(bad));
  }
});

test('dependencies: one invalid version makes the whole field Not Found, not a partial string', () => {
  assert.equal(resolvers.dependencies({ dependencies: { good: '1.0.0', bad: { x: 1 } } }), null);
  assert.equal(resolvers.devDependencies({ devDependencies: { bad: 2, good: '^1.0.0' } }), null);
});

test('dependencies: string versions, ranges and an empty string are still rendered', () => {
  assert.equal(resolvers.dependencies({ dependencies: { a: '^1.0.0', b: 'file:../x' } }), 'a@^1.0.0, b@file:../x');
  assert.equal(resolvers.dependencies({ dependencies: { a: '' } }), 'a@');
});

test('devDependencies: does not read from dependencies', () => {
  assert.equal(resolvers.devDependencies({ dependencies: { a: '1' } }), null);
});

test('testCommand: scripts of the wrong type is Not Found', () => {
  assert.equal(resolvers.testCommand({ scripts: 'node --test' }), null);
  assert.equal(resolvers.testCommand({ scripts: null }), null);
});

test('testCommand: only the test script is used', () => {
  assert.equal(resolvers.testCommand({ scripts: { 'test:e2e': 'playwright test' } }), null);
});

test('author: object with blank name is Not Found even when email is present', () => {
  assert.equal(resolvers.author({ author: { name: '  ', email: 'a@b.c' } }), null);
});

test('author: null is Not Found', () => {
  assert.equal(resolvers.author({ author: null }), null);
});

test('resolvers do not trim the returned value', () => {
  assert.equal(resolvers.projectName({ name: ' padded ' }), ' padded ');
});
