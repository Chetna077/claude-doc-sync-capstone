#!/usr/bin/env node
'use strict';
// PreToolUse hook for Atlassian MCP writes. Exit 2 blocks payloads that are too large,
// so the agent re-sends only the changed field. Never fails on bad input.
const WRITE = /(create|edit|update|add|transition|delete)/i;

function check(input, env = process.env) {
  if (env.TOKEN_SAVER === 'off' || !input) return null;
  const name = String(input.tool_name || '');
  if (!/^mcp__.*atlassian/i.test(name) || !WRITE.test(name.replace(/^mcp__[^_]*(?:_[^_]+)*?__/, ''))) return null;
  const max = Number(env.TOKEN_SAVER_MAX_WRITE_CHARS) || 8000;
  const size = JSON.stringify(input.tool_input || {}).length;
  if (size > max) return `${name} payload is ${size} characters (about ${Math.round(size / 4)} tokens). Send only the changed field or one short comment, under ${max} characters.`;
  return null;
}

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    let input;
    try { input = JSON.parse(raw); } catch { process.exit(0); }
    const reason = check(input);
    if (reason) { process.stderr.write(`Blocked (token-saver): ${reason}\n`); process.exit(2); }
    process.exit(0);
  });
} else {
  module.exports = { check };
}
