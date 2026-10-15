#!/usr/bin/env node
'use strict';
// PreToolUse hook for Read: keeps wasteful reads out of the context window.
// Exit 2 blocks the call. Disable with TOKEN_SAVER=off; size cap via TOKEN_SAVER_MAX_BYTES.
const fs = require('fs');

function check(input, env = process.env) {
  if (env.TOKEN_SAVER === 'off') return null;
  if (!input || input.tool_name !== 'Read') return null;
  const ti = input.tool_input || {};
  const p = String(ti.file_path || '').replace(/\\/g, '/');
  if (!p) return null;
  if (/(^|\/)(node_modules|\.git|coverage)(\/|$)/.test(p)) return `${p} is vendored/generated content. Search it with Grep for the exact symbol instead.`;
  if (/(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i.test(p)) return `${p} is a lockfile. Use Grep for the specific package.`;
  if (/\.(docx|xlsx|pptx|zip|gz|tar|tgz|exe|dll|min\.js|min\.css|map|png|jpe?g|gif|bmp|webp|ico|pdf|mp4|mov)$/i.test(p)) return `${p} is a binary, image or minified file that cannot be read usefully as text.`;
  if (ti.limit !== undefined || ti.offset !== undefined) return null;
  let size;
  try { size = fs.statSync(p).size; } catch { return null; }
  const max = Number(env.TOKEN_SAVER_MAX_BYTES) || 100000;
  if (size > max) return `${p} is ${size} bytes (about ${Math.round(size / 4)} tokens). Re-run Read with offset and limit, or use Grep.`;
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
