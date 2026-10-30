'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { check } = require('../../.claude/hooks/scripts/read-guard.js');

const read = (file_path, extra = {}) => ({ tool_name: 'Read', tool_input: { file_path, ...extra } });

test('blocks vendored folders, lockfiles and binaries', () => {
  assert.match(check(read('C:\\proj\\node_modules\\x\\index.js')), /vendored/);
  assert.match(check(read('/a/package-lock.json')), /lockfile/);
  assert.match(check(read('/a/spec.docx')), /binary/);
  assert.match(check(read('/a/screenshot.png')), /image/);
});

test('blocks large reads without a limit, allows them with one', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'rg-')), 'big.txt');
  fs.writeFileSync(f, 'x'.repeat(200000));
  assert.match(check(read(f)), /Re-run Read with offset and limit/);
  assert.strictEqual(check(read(f, { limit: 50 })), null);
  assert.strictEqual(check(read(f), { TOKEN_SAVER: 'off' }), null);
});

test('ignores other tools and small files', () => {
  assert.strictEqual(check({ tool_name: 'Bash', tool_input: { command: 'ls' } }), null);
  assert.strictEqual(check(read(__filename)), null);
});
