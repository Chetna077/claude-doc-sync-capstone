'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { run } = require('../../src/run');
const { createTempDir, initGitRepoWithCommit, removeDir } = require('../helpers/tempRepo');

const FIXTURE_PKG = {
  name: 'fixture-project',
  description: 'A fixture project for integration testing.',
  main: 'index.js',
  dependencies: { 'left-pad': '1.0.0' },
  scripts: { test: 'node --test' },
  author: 'Fixture Author',
  license: 'MIT',
};

const TEMPLATE_TEXT = [
  '# {{ProjectName}}',
  '',
  '{{Description}}',
  '',
  '- Main: {{MainEntryPoint}}',
  '- Dependencies: {{Dependencies}}',
  '- Dev dependencies: {{DevDependencies}}',
  '- Test command: {{TestCommand}}',
  '- Author: {{Author}}',
  '- License: {{License}}',
  '- Last commit author: {{LastCommitAuthor}}',
  '- Unknown: {{TotallyUnregisteredThing}}',
  '',
].join('\n');

test('run(): fills verifiable placeholders and marks the rest Not Found', () => {
  const repoDir = createTempDir();
  try {
    fs.writeFileSync(
      path.join(repoDir, 'package.json'),
      JSON.stringify(FIXTURE_PKG, null, 2)
    );
    initGitRepoWithCommit(repoDir, { authorName: 'Grace Hopper' });

    const templatePath = path.join(repoDir, 'template.md');
    fs.writeFileSync(templatePath, TEMPLATE_TEXT);
    const outPath = path.join(repoDir, 'output.md');

    const result = run({ templatePath, repoPath: repoDir, outPath });

    assert.equal(result.total, 10);
    assert.equal(result.found, 8);

    const output = fs.readFileSync(outPath, 'utf8');
    assert.match(output, /^# fixture-project/);
    assert.match(output, /A fixture project for integration testing\./);
    assert.match(output, /- Main: index\.js/);
    assert.match(output, /- Dependencies: left-pad@1\.0\.0/);
    assert.match(output, /- Dev dependencies: Not Found/);
    assert.match(output, /- Test command: node --test/);
    assert.match(output, /- Author: Fixture Author/);
    assert.match(output, /- License: MIT/);
    assert.match(output, /- Last commit author: Grace Hopper/);
    assert.match(output, /- Unknown: Not Found/);

    const originalTemplate = fs.readFileSync(templatePath, 'utf8');
    assert.equal(originalTemplate, TEMPLATE_TEXT);
  } finally {
    removeDir(repoDir);
  }
});

test('run(): template with no placeholders is copied through unchanged', () => {
  const repoDir = createTempDir();
  try {
    const templatePath = path.join(repoDir, 'template.md');
    fs.writeFileSync(templatePath, '# Just static text\n');
    const outPath = path.join(repoDir, 'output.md');

    const result = run({ templatePath, repoPath: repoDir, outPath });

    assert.equal(result.total, 0);
    assert.equal(result.found, 0);
    assert.equal(fs.readFileSync(outPath, 'utf8'), '# Just static text\n');
  } finally {
    removeDir(repoDir);
  }
});
