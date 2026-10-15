'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const SCRIPT = path.join(__dirname, '..', '..', '.claude', 'hooks', 'scripts', 'trim-mcp-output.js');
const jira = { key: 'SCRUM-1', self: 'https://x/rest/api/3/issue/1', fields: { summary: 'Doc sync', status: { name: 'To Do', self: 'https://x/s', iconUrl: 'https://x/i.png' }, reporter: { displayName: 'Chetna', avatarUrls: { '48x48': 'https://x/a.png' } } } };
const run = (input) => spawnSync('node', [SCRIPT], { input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, TOKEN_SAVER_LOG: 'off' } });

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

test('replaces images and base64 data with short notes', () => {
  const blob = 'A'.repeat(5000);
  const r = run({ tool_name: 'mcp__atlassian__getJiraIssue', tool_response: [
    { type: 'image', data: blob, mimeType: 'image/png' },
    { type: 'text', text: JSON.stringify({ key: 'SCRUM-1', attachment: [{ content: blob }], img: 'data:image/png;base64,' + blob }) } ] });
  const out = JSON.parse(r.stdout).hookSpecificOutput.updatedMCPToolOutput;
  assert.deepStrictEqual(out[0], { type: 'text', text: '[image omitted]' });
  const text = out[1].text;
  assert.ok(text.includes('SCRUM-1'));
  assert.ok(text.length < 400, 'base64 and data URIs must be gone');
});
