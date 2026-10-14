#!/usr/bin/env node
'use strict';
// PostToolUse hook for Atlassian MCP calls. Strips avatar/self-link/icon noise from
// Jira and Confluence responses so the agent keeps only the useful fields.
// Never blocks: on any problem it prints nothing and exits 0 (output stays unchanged).

const NOISE_KEYS = new Set(['avatarUrls', 'avatarUrl', 'self', 'iconUrl', 'thumbnail', 'expand', '_expandable', 'accountType', 'timeZone']);

function trim(value) {
  if (Array.isArray(value)) return value.map(trim);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (NOISE_KEYS.has(key)) continue;
      out[key] = trim(val);
    }
    return out;
  }
  return value;
}

function trimText(text) {
  try {
    return JSON.stringify(trim(JSON.parse(text)));
  } catch {
    return text; // not JSON: leave as is
  }
}

function trimResponse(response) {
  if (typeof response === 'string') return trimText(response);
  if (Array.isArray(response)) {
    return response.map((block) => (block && block.type === 'text' && typeof block.text === 'string' ? { ...block, text: trimText(block.text) } : block));
  }
  if (response && Array.isArray(response.content)) return { ...response, content: trimResponse(response.content) };
  return trim(response);
}

function main(raw) {
  let input;
  try { input = JSON.parse(raw); } catch { return null; }
  if (!input || !/^mcp__.*atlassian/i.test(String(input.tool_name || ''))) return null;
  const before = JSON.stringify(input.tool_response);
  const trimmed = trimResponse(input.tool_response);
  const after = JSON.stringify(trimmed);
  if (!before || after.length >= before.length) return null;
  return { hookSpecificOutput: { hookEventName: 'PostToolUse', updatedMCPToolOutput: trimmed }, savedChars: before.length - after.length };
}

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    const result = main(raw);
    if (result) {
      const { savedChars, ...payload } = result;
      process.stdout.write(JSON.stringify(payload));
      process.stderr.write(`trim-mcp-output: saved about ${Math.round(savedChars / 4)} tokens (estimate, chars/4)\n`);
    }
    process.exit(0);
  });
} else {
  module.exports = { trim, trimResponse, main };
}
