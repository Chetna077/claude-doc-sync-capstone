'use strict';
// Proves the hooks really work: the before hook blocks a staged secret, and the skills validator passes.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', '..');
const guard = path.join(root, '.claude/hooks/scripts/pre-commit-secret-guard.sh');
const validator = path.join(root, '.claude/hooks/scripts/validate-skills.sh');
// On Windows a bare 'bash' can be a broken WSL stub, so look for Git Bash first.
function findBash() {
  if (process.platform !== 'win32') return 'bash';
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'],
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs')].filter(Boolean);
  for (const r of roots) {
    for (const rel of ['Git/bin/bash.exe', 'Git/usr/bin/bash.exe']) {
      const p = path.join(r, rel);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}
const BASH = findBash();
const hasBash = Boolean(BASH) && spawnSync(BASH, ['-c', 'true']).status === 0;

function git(cwd, ...args) { return spawnSync('git', args, { cwd, encoding: 'utf8' }); }

test('before hook blocks a staged secret (non-zero exit) and passes when clean', { skip: !hasBash }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-'));
  git(dir, 'init');
  fs.writeFileSync(path.join(dir, 'ok.txt'), 'hello\n');
  git(dir, 'add', 'ok.txt');
  assert.strictEqual(spawnSync(BASH, [guard], { cwd: dir }).status, 0);
  fs.writeFileSync(path.join(dir, 'leak.txt'), 'token=ghp_' + 'a'.repeat(36) + '\n');
  git(dir, 'add', 'leak.txt');
  const blocked = spawnSync(BASH, [guard], { cwd: dir, encoding: 'utf8' });
  assert.notStrictEqual(blocked.status, 0);
  assert.match(blocked.stdout + blocked.stderr, /possible secret/);
});

test('every skill an agent references exists and has valid frontmatter', { skip: !hasBash }, () => {
  const r = spawnSync(BASH, [validator, '.claude'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
});
