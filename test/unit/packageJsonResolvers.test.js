'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const resolvers = require('../../src/resolvers/packageJsonResolvers');

test('projectName: found', () => {
  assert.equal(resolvers.projectName({ name: 'my-pkg' }), 'my-pkg');
});

test('projectName: missing pkg', () => {
  assert.equal(resolvers.projectName(null), null);
});

test('projectName: missing field', () => {
  assert.equal(resolvers.projectName({}), null);
});

test('description: found and missing', () => {
  assert.equal(resolvers.description({ description: 'A tool' }), 'A tool');
  assert.equal(resolvers.description({}), null);
});

test('mainEntryPoint: uses main when present', () => {
  assert.equal(
    resolvers.mainEntryPoint({ main: 'src/index.js', bin: 'bin/cli.js' }),
    'src/index.js'
  );
});

test('mainEntryPoint: falls back to bin string', () => {
  assert.equal(resolvers.mainEntryPoint({ bin: 'bin/cli.js' }), 'bin/cli.js');
});

test('mainEntryPoint: falls back to first key of bin object', () => {
  assert.equal(
    resolvers.mainEntryPoint({ bin: { foo: 'bin/foo.js', bar: 'bin/bar.js' } }),
    'bin/foo.js'
  );
});

test('mainEntryPoint: neither main nor bin present', () => {
  assert.equal(resolvers.mainEntryPoint({}), null);
});

test('dependencies: formats as name@version list in key order', () => {
  assert.equal(
    resolvers.dependencies({ dependencies: { b: '2.0.0', a: '1.0.0' } }),
    'b@2.0.0, a@1.0.0'
  );
});

test('dependencies: empty object is Not Found', () => {
  assert.equal(resolvers.dependencies({ dependencies: {} }), null);
});

test('dependencies: missing field is Not Found', () => {
  assert.equal(resolvers.dependencies({}), null);
});

test('devDependencies: formats and handles empty', () => {
  assert.equal(
    resolvers.devDependencies({ devDependencies: { x: '1.0.0' } }),
    'x@1.0.0'
  );
  assert.equal(resolvers.devDependencies({ devDependencies: {} }), null);
});

test('testCommand: found and missing', () => {
  assert.equal(resolvers.testCommand({ scripts: { test: 'node --test' } }), 'node --test');
  assert.equal(resolvers.testCommand({ scripts: {} }), null);
  assert.equal(resolvers.testCommand({}), null);
});

test('author: string form', () => {
  assert.equal(resolvers.author({ author: 'Jane Doe <jane@x.com>' }), 'Jane Doe <jane@x.com>');
});

test('author: object form uses .name', () => {
  assert.equal(resolvers.author({ author: { name: 'Jane Doe', email: 'jane@x.com' } }), 'Jane Doe');
});

test('author: object form without usable name is Not Found', () => {
  assert.equal(resolvers.author({ author: {} }), null);
});

test('author: missing field is Not Found', () => {
  assert.equal(resolvers.author({}), null);
});

test('license: found and missing', () => {
  assert.equal(resolvers.license({ license: 'MIT' }), 'MIT');
  assert.equal(resolvers.license({}), null);
});
