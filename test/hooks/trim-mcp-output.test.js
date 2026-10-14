'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const SCRIPT = path.join(__dirname, '..', '..', '.claude', 'hooks', 'scripts', 'trim-mcp-output.js');
const jira = { key: 'SCRUM-1', self: 'https://x/rest/api/3/issue/1', fields: { summary: 'Doc sync', status: { name: 'To Do', self: 'https://x/s', iconUrl: 'https://x/i.png' }, reporter: { displayName: 'Chetna', avatarUrls: { '48x48': 'https://x/a.png' } } } };
const run = (input) => spawnSync('node', [SCRIPT], { input: JSON.stringify(input), encoding: 'utf8' });

test('strips avatar, self and icon noise from Atlassian MCP output', () => {
  const r = run({ tool_name: 'mcp__atlassian__getJiraIssue', tool_response: [{ type: 'text', text: JSON.stringify(jira) }] });
  assert.strictEqual(r.status, 0);
  const out = JSON.parse(JSON.parse(r.stdout).hookSpecificOutput.updatedMCPToolOutput[0].text);
  assert.strictEqual(out.key, 'SCRUM-1');
  assert.strictEqual(out.fields.summary, 'Doc sync');
  assert.strictEqual(out.fields.reporter.displayName, 'Chetna');
  assert.ok(!JSON.stringify(out).match(/avatarUrls|iconUrl|"self"/));
});

test('ignores other tools and non-JSON text, never fails', () => {
  assert.strictEqual(run({ tool_name: 'Bash', tool_response: 'x' }).stdout, '');
  assert.strictEqual(run({ tool_name: 'mcp__atlassian__x', tool_response: 'plain text' }).stdout, '');
  assert.strictEqual(spawnSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' }).status, 0);
});
