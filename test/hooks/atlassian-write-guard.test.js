'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { check } = require('../../.claude/hooks/scripts/atlassian-write-guard.js');

test('blocks oversized Atlassian writes, allows small ones', () => {
  const big = { tool_name: 'mcp__atlassian__editJiraIssue', tool_input: { fields: { description: 'x'.repeat(9000) } } };
  assert.match(check(big), /Send only the changed field/);
  assert.strictEqual(check({ ...big, tool_input: { fields: { description: 'short' } } }), null);
  assert.strictEqual(check(big, { TOKEN_SAVER: 'off' }), null);
});

test('does not touch reads or other servers', () => {
  const big = { tool_input: { text: 'x'.repeat(9000) } };
  assert.strictEqual(check({ ...big, tool_name: 'mcp__atlassian__getJiraIssue' }), null);
  assert.strictEqual(check({ ...big, tool_name: 'mcp__github__create_issue' }), null);
  assert.strictEqual(check(null), null);
});
