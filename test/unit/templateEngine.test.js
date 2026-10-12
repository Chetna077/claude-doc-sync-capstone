'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractPlaceholders, substitute } = require('../../src/templateEngine');

test('extractPlaceholders: no placeholders returns empty array', () => {
  assert.deepEqual(extractPlaceholders('just plain text'), []);
});

test('extractPlaceholders: single placeholder', () => {
  assert.deepEqual(extractPlaceholders('Hello {{Name}}'), ['Name']);
});

test('extractPlaceholders: duplicate placeholders de-duplicated, first-seen order', () => {
  assert.deepEqual(
    extractPlaceholders('{{B}} then {{A}} then {{B}} again'),
    ['B', 'A']
  );
});

test('extractPlaceholders: adjacent placeholders with no text between', () => {
  assert.deepEqual(extractPlaceholders('{{A}}{{B}}'), ['A', 'B']);
});

test('extractPlaceholders: malformed tokens are ignored', () => {
  assert.deepEqual(extractPlaceholders('{{ Spaced }} {{lower case ok}}'), []);
});

test('substitute: replaces a known value', () => {
  const values = new Map([['Name', 'World']]);
  assert.equal(substitute('Hello {{Name}}', values), 'Hello World');
});

test('substitute: missing key renders Not Found', () => {
  const values = new Map();
  assert.equal(substitute('Hello {{Name}}', values), 'Hello Not Found');
});

test('substitute: null value renders Not Found', () => {
  const values = new Map([['Name', null]]);
  assert.equal(substitute('Hello {{Name}}', values), 'Hello Not Found');
});

test('substitute: duplicate placeholders all replaced', () => {
  const values = new Map([['X', 'v']]);
  assert.equal(substitute('{{X}} and {{X}}', values), 'v and v');
});
