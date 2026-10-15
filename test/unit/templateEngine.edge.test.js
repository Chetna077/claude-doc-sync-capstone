'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractPlaceholders, substitute } = require('../../src/templateEngine');

test('extractPlaceholders: empty string returns empty array', () => {
  assert.deepEqual(extractPlaceholders(''), []);
});

test('extractPlaceholders: digits and underscores are valid name characters', () => {
  assert.deepEqual(extractPlaceholders('{{A_1}} {{_x}} {{9}}'), ['A_1', '_x', '9']);
});

test('extractPlaceholders: names are case-sensitive', () => {
  assert.deepEqual(extractPlaceholders('{{Name}} {{name}}'), ['Name', 'name']);
});

test('extractPlaceholders: empty, unclosed and single-brace tokens are ignored', () => {
  assert.deepEqual(extractPlaceholders('{{}} {{A} {B}} {A}'), []);
});

test('extractPlaceholders: dotted, dashed and spaced names are ignored', () => {
  assert.deepEqual(extractPlaceholders('{{a.b}} {{a-b}} {{ A }}'), []);
});

test('extractPlaceholders: tokens on multiple lines, CRLF included', () => {
  assert.deepEqual(extractPlaceholders('{{A}}\r\n{{B}}\n{{A}}'), ['A', 'B']);
});

test('extractPlaceholders: token inside a code fence is still detected', () => {
  assert.deepEqual(extractPlaceholders('```\n{{A}}\n```'), ['A']);
});

test('substitute: text without placeholders is returned unchanged', () => {
  assert.equal(substitute('plain {text} here', new Map([['A', 'x']])), 'plain {text} here');
});

test('substitute: malformed tokens are left untouched', () => {
  const values = new Map([['A', 'x']]);
  assert.equal(substitute('{{ A }} {{A}', values), '{{ A }} {{A}');
});

test('substitute: $& and $1 in a value are inserted literally', () => {
  const values = new Map([['A', 'cost $& and $1 and $$']]);
  assert.equal(substitute('[{{A}}]', values), '[cost $& and $1 and $$]');
});

test('substitute: a value containing a placeholder is not expanded again', () => {
  const values = new Map([['A', '{{B}}'], ['B', 'nope']]);
  assert.equal(substitute('{{A}}', values), '{{B}}');
});

test('substitute: adjacent placeholders each resolve independently', () => {
  const values = new Map([['A', '1'], ['B', null]]);
  assert.equal(substitute('{{A}}{{B}}', values), '1Not Found');
});

test('substitute: unicode values are preserved', () => {
  const values = new Map([['A', 'Zoë — 日本語']]);
  assert.equal(substitute('{{A}}', values), 'Zoë — 日本語');
});

test('substitute: line endings around tokens are preserved', () => {
  const values = new Map([['A', 'x']]);
  assert.equal(substitute('a\r\n{{A}}\r\n', values), 'a\r\nx\r\n');
});
