#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { run } = require('../src/run');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--template' || arg === '--repo' || arg === '--out') {
      args[arg.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function fail(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.template) {
    fail('--template <path> is required');
    return;
  }

  const templatePath = path.resolve(args.template);
  if (!fs.existsSync(templatePath) || !fs.statSync(templatePath).isFile()) {
    fail(`template file not found: ${templatePath}`);
    return;
  }

  const repoPath = path.resolve(args.repo || process.cwd());
  if (!fs.existsSync(repoPath) || !fs.statSync(repoPath).isDirectory()) {
    fail(`repo path not found or not a directory: ${repoPath}`);
    return;
  }

  const defaultOutName = `${path.basename(templatePath, path.extname(templatePath))}.filled.md`;
  const outPath = path.resolve(args.out || path.join(process.cwd(), defaultOutName));

  // run() rejects --out equal to --template; its error flows to fail() below.
  try {
    const { total, found } = run({ templatePath, repoPath, outPath });
    process.stdout.write(`${found} / ${total} placeholders found.\n`);
    process.exit(0);
  } catch (err) {
    fail(err.message);
  }
}

main();
