#!/usr/bin/env node
'use strict';
// PostToolUse hook for Atlassian MCP calls. Strips avatar/self-link/icon noise from
// Jira and Confluence responses so the agent keeps only the useful fields.
// Never blocks: on any problem it prints nothing and exits 0 (output stays unchanged).

const NOISE_KEYS = new Set(['avatarUrls', 'avatarUrl', 'self', 'iconUrl', 'thumbnail', 'thumbnailUrl', 'smallUrl', 'expand', '_expandable', 'accountType', 'timeZone']);
const BASE64 = /^[A-Za-z0-9+/=\s]{2000,}$/;

// Images, attachments and long base64 strings are never useful as text: replace them with a short note.
function shrinkString(value) {
  if (/^data:[^;,]+[;,]/.test(value) && value.length > 200) return `[embedded data omitted, ${value.length} chars]`;
  if (BASE64.test(value)) return `[base64 data omitted, ${value.length} chars]`;
  return value;
}

function trim(value) {
  if (Array.isArray(value)) return value.map(trim);
  if (typeof value === 'string') return shrinkString(value);
  if (value && typeof value === 'object') {
    if (value.type === 'image') return { type: 'text', text: '[image omitted]' };
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
    return response.map((block) => (block && block.type === 'image' ? { type: 'text', text: '[image omitted]' } : block && block.type === 'text' && typeof block.text === 'string' ? { ...block, text: trimText(block.text) } : block));
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
