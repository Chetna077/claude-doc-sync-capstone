'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { run } = require('../../src/run');
const { createTempDir, initGitRepoWithCommit, removeDir } = require('../helpers/tempRepo');

const FULL_PKG = {
  name: 'full-project',
  description: 'Everything is present.',
  main: 'src/index.js',
  dependencies: { a: '1.0.0', b: '^2.0.0' },
  devDependencies: { c: '3.0.0' },
  scripts: { test: 'node --test' },
  author: { name: 'Full Author' },
  license: 'Apache-2.0',
};

const ALL_TOKENS_TEMPLATE = [
  '{{ProjectName}}',
  '{{Description}}',
  '{{MainEntryPoint}}',
  '{{Dependencies}}',
  '{{DevDependencies}}',
  '{{TestCommand}}',
  '{{Author}}',
  '{{License}}',
  '{{LastCommitDate}}',
  '{{LastCommitAuthor}}',
  '',
].join('\n');

function setup(files) {
  const dir = createTempDir();
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  return dir;
}

test('run(): all ten placeholders resolve on a complete repo', () => {
  const dir = setup({
    'package.json': JSON.stringify(FULL_PKG),
    'template.md': ALL_TOKENS_TEMPLATE,
  });
  try {
    initGitRepoWithCommit(dir, { authorName: 'Commit Person' });
    const outPath = path.join(dir, 'out.md');

    const result = run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });

    assert.equal(result.total, 10);
    assert.equal(result.found, 10);
    const lines = fs.readFileSync(outPath, 'utf8').split('\n');
    assert.equal(lines[0], 'full-project');
    assert.equal(lines[1], 'Everything is present.');
    assert.equal(lines[2], 'src/index.js');
    assert.equal(lines[3], 'a@1.0.0, b@^2.0.0');
    assert.equal(lines[4], 'c@3.0.0');
    assert.equal(lines[5], 'node --test');
    assert.equal(lines[6], 'Full Author');
    assert.equal(lines[7], 'Apache-2.0');
    assert.match(lines[8], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    assert.equal(lines[9], 'Commit Person');
    assert.doesNotMatch(lines.join('\n'), /Not Found/);
  } finally {
    removeDir(dir);
  }
});

test('run(): empty directory resolves nothing and never throws', () => {
  const dir = setup({ 'template.md': ALL_TOKENS_TEMPLATE });
  try {
    const outPath = path.join(dir, 'out.md');
    const result = run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });

    assert.equal(result.total, 10);
    assert.equal(result.found, 0);
    const output = fs.readFileSync(outPath, 'utf8');
    assert.equal(output, 'Not Found\n'.repeat(10));
  } finally {
    removeDir(dir);
  }
});

test('run(): corrupt package.json only affects package placeholders', () => {
  const dir = setup({
    'package.json': '{ not json',
    'template.md': '{{ProjectName}} | {{License}} | {{LastCommitAuthor}}\n',
  });
  try {
    initGitRepoWithCommit(dir, { authorName: 'Still Works' });
    const outPath = path.join(dir, 'out.md');

    const result = run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });

    assert.equal(result.total, 3);
    assert.equal(result.found, 1);
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'Not Found | Not Found | Still Works\n');
  } finally {
    removeDir(dir);
  }
});

test('run(): valid package.json without git only loses git placeholders', () => {
  const dir = setup({
    'package.json': JSON.stringify(FULL_PKG),
    'template.md': '{{ProjectName}} | {{LastCommitDate}}\n',
  });
  try {
    const outPath = path.join(dir, 'out.md');
    const result = run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });

    assert.equal(result.found, 1);
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'full-project | Not Found\n');
  } finally {
    removeDir(dir);
  }
});

test('run(): a repeated placeholder counts once and is replaced everywhere', () => {
  const dir = setup({
    'package.json': JSON.stringify({ name: 'dup' }),
    'template.md': '{{ProjectName}} {{ProjectName}}\n{{ProjectName}}\n',
  });
  try {
    const outPath = path.join(dir, 'out.md');
    const result = run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });

    assert.equal(result.total, 1);
    assert.equal(result.found, 1);
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'dup dup\ndup\n');
  } finally {
    removeDir(dir);
  }
});

test('run(): values are inserted literally and never re-expanded', () => {
  const dir = setup({
    'package.json': JSON.stringify({
      description: 'costs $& and {{Author}} and $1',
      author: 'Someone',
    }),
    'template.md': '{{Description}} / {{Author}}\n',
  });
  try {
    const outPath = path.join(dir, 'out.md');
    run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });

    assert.equal(
      fs.readFileSync(outPath, 'utf8'),
      'costs $& and {{Author}} and $1 / Someone\n'
    );
  } finally {
    removeDir(dir);
  }
});

test('run(): returned values map holds null for unresolved names', () => {
  const dir = setup({
    'package.json': JSON.stringify({ name: 'v' }),
    'template.md': '{{ProjectName}} {{License}} {{Bogus}}\n',
  });
  try {
    const result = run({
      templatePath: path.join(dir, 'template.md'),
      repoPath: dir,
      outPath: path.join(dir, 'out.md'),
    });
    assert.equal(result.values.get('ProjectName'), 'v');
    assert.equal(result.values.get('License'), null);
    assert.equal(result.values.get('Bogus'), null);
    assert.equal(result.values.size, 3);
  } finally {
    removeDir(dir);
  }
});

test('run(): two runs on unchanged input produce byte-identical output', () => {
  const dir = setup({
    'package.json': JSON.stringify(FULL_PKG),
    'template.md': ALL_TOKENS_TEMPLATE,
  });
  try {
    initGitRepoWithCommit(dir);
    const templatePath = path.join(dir, 'template.md');
    const out1 = path.join(dir, 'out1.md');
    const out2 = path.join(dir, 'out2.md');

    run({ templatePath, repoPath: dir, outPath: out1 });
    run({ templatePath, repoPath: dir, outPath: out2 });

    assert.deepEqual(fs.readFileSync(out1), fs.readFileSync(out2));
  } finally {
    removeDir(dir);
  }
});

test('run(): template bytes are unchanged after a run', () => {
  const dir = setup({
    'package.json': JSON.stringify(FULL_PKG),
    'template.md': ALL_TOKENS_TEMPLATE,
  });
  try {
    const templatePath = path.join(dir, 'template.md');
    const before = fs.readFileSync(templatePath);
    run({ templatePath, repoPath: dir, outPath: path.join(dir, 'out.md') });
    assert.deepEqual(fs.readFileSync(templatePath), before);
  } finally {
    removeDir(dir);
  }
});

test('run(): CRLF line endings and unicode survive substitution', () => {
  const dir = setup({
    'package.json': JSON.stringify({ name: 'ünï-çødé' }),
    'template.md': '# {{ProjectName}}\r\n\r\nText — 日本語\r\n',
  });
  try {
    const outPath = path.join(dir, 'out.md');
    run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });
    assert.equal(fs.readFileSync(outPath, 'utf8'), '# ünï-çødé\r\n\r\nText — 日本語\r\n');
  } finally {
    removeDir(dir);
  }
});

test('run(): an existing output file is overwritten', () => {
  const dir = setup({
    'package.json': JSON.stringify({ name: 'fresh' }),
    'template.md': '{{ProjectName}}\n',
    'out.md': 'stale content that is much longer than the new output\n',
  });
  try {
    const outPath = path.join(dir, 'out.md');
    run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'fresh\n');
  } finally {
    removeDir(dir);
  }
});

test('run(): empty template produces an empty output with 0 / 0', () => {
  const dir = setup({ 'template.md': '' });
  try {
    const outPath = path.join(dir, 'out.md');
    const result = run({ templatePath: path.join(dir, 'template.md'), repoPath: dir, outPath });
    assert.equal(result.total, 0);
    assert.equal(result.found, 0);
    assert.equal(fs.readFileSync(outPath, 'utf8'), '');
  } finally {
    removeDir(dir);
  }
});

test('run(): a missing template throws', () => {
  const dir = createTempDir();
  try {
    assert.throws(() =>
      run({
        templatePath: path.join(dir, 'missing.md'),
        repoPath: dir,
        outPath: path.join(dir, 'out.md'),
      })
    );
  } finally {
    removeDir(dir);
  }
});

test('run(): repoPath selects which repo is inspected, not the template location', () => {
  const repoDir = setup({ 'package.json': JSON.stringify({ name: 'the-repo' }) });
  const templateDir = setup({
    'package.json': JSON.stringify({ name: 'the-template-dir' }),
    'template.md': '{{ProjectName}}\n',
  });
  try {
    const outPath = path.join(templateDir, 'out.md');
    run({ templatePath: path.join(templateDir, 'template.md'), repoPath: repoDir, outPath });
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'the-repo\n');
  } finally {
    removeDir(repoDir);
    removeDir(templateDir);
  }
});
