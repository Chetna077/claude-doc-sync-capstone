# Architecture - claude-doc-sync (SCRUM-1)

Status: APPROVED (Step 2) - the human resolved all 7 open questions (section 11); planned changes are listed in section 12. Input: `generatedDocs/requirements.md` (Step 1, approved). Grounded in the code in `src/`, `bin/` and `.github/workflows/ci.yml` as of branch `feature/implementation`. Jira/Confluence were not read or written. Anything not traceable to `package.json`, `git log`, or the code is marked `Not Found` or listed under Open questions.

## 1. Design principles

- Read the data and decide what a placeholder means are separate modules. Sources report facts; resolvers interpret them. (NFR-2, NFR-3)
- Every resolver is a pure function of already-read data, so it is unit-testable without touching the filesystem (except the two git resolvers, which delegate to the git source). (Testing bar, section 8 of requirements)
- Failure is a value, not an exception: every source returns `null` on any failure and every resolver returns a string or `null`. `null` becomes the literal `Not Found` at render time. (FR-3, AC-2)
- Zero runtime dependencies; Node built-ins only: `fs`, `path`, `child_process`. Node >= 20 (`package.json` `engines`). (NFR-1)
- The input template is only ever read. (FR-6, AC-3)

## 2. Components and responsibilities

| Component | File | Responsibility | Traces to |
|---|---|---|---|
| CLI entry point | `bin/claude-doc-sync.js` | Parse `--template`, `--repo`, `--out`; apply defaults; validate inputs (`run()` owns the `--out` == `--template` check, not the CLI); call `run`; print the summary line; map outcomes to exit codes. The only module that calls `process.exit` or writes to stdout/stderr. | FR-5, FR-6, FR-7, FR-8, S1-S3, S6 |
| Orchestrator | `src/run.js` | Read template text; extract names; read `package.json` once; resolve each name; count found; substitute; write output file; return `{ total, found, values }`. Throws on filesystem errors (read template, write output). | FR-1 to FR-4, FR-5 (counts) |
| Template engine | `src/templateEngine.js` | `extractPlaceholders(text)`: distinct token names in first-seen order. `substitute(text, values)`: replace every occurrence, `Not Found` for `null`/missing. Token syntax: `/\{\{([A-Za-z0-9_]+)\}\}/g`. No file or git access. | FR-1, FR-3, FR-4 |
| Resolver registry | `src/resolvers/index.js` | Maps each of the 10 supported names to a resolver; `resolve(name, ctx)` returns `null` for unregistered names (`Object.hasOwn` guard, so `{{constructor}}` etc. cannot hit the prototype). | FR-2, FR-3 |
| package.json resolvers | `src/resolvers/packageJsonResolvers.js` | One function per placeholder: `projectName`, `description`, `mainEntryPoint`, `dependencies`, `devDependencies`, `testCommand`, `author`, `license`. Input is the parsed object or `null`. Non-empty-string check; `name@version` joined with `, ` in key order. | FR-2, requirements section 5 |
| Git resolvers | `src/resolvers/gitResolvers.js` | `lastCommitDate` (`%cI`), `lastCommitAuthor` (`%an`); thin wrappers over the git source. | FR-2, requirements section 5 |
| package.json source | `src/sources/readPackageJson.js` | Read and `JSON.parse` `<repo>/package.json`; `null` on missing, unreadable or invalid JSON. | S4, NFR-2 |
| git source | `src/sources/readGitLog.js` | `execFileSync('git', ['log','-1','--format=<fmt>'])` with `cwd=repo`, 5000 ms timeout, stderr ignored; trimmed output, `null` on any failure or empty output. No shell is used, so arguments are not shell-interpreted. | S5, NFR-2 |
| CI workflow | `.github/workflows/ci.yml` | Runs `npm test` on push and pull request. See section 7. | NFR-5, AC-6 |

Not components of the tool (listed so scope is clear): `demo.html`, `templates/project-doc.template.md`, `.claude/` agents/skills/hooks, `generatedDocs/`. `package.json` also defines `build`, `deploy:local` and `release` scripts pointing at `scripts/`; these are not in the requirements and were not reviewed here (`Not Found` in requirements, so out of scope for this document).

## 3. Data flow

```
 CLI args (--template, --repo, --out)
        |
        v
 bin/claude-doc-sync.js --- validate: template is file? repo is dir?
        |                         \-- fail: stderr "Error: ...", exit 1 (nothing written)
        |                         (out != template is checked inside run(), first statement)
        v
 src/run.js
   1. fs.readFileSync(template)  ---------------------------> templateText
   2. templateEngine.extractPlaceholders(templateText) -------> names[] (distinct)
   3. sources/readPackageJson(repo) --------------------------> pkg | null
   4. for each name: resolvers.resolve(name, {pkg, repoPath})
          |-- registry -> packageJsonResolvers(pkg) ----------> string | null
          |-- registry -> gitResolvers(repoPath)
          |                 -> sources/readGitLog -> git log -1 -> string | null
          '-- unregistered name --------------------------------> null
      found += 1 when value !== null
   5. templateEngine.substitute(templateText, values) --------> outputText (null -> "Not Found")
   6. fs.writeFileSync(out, outputText)
        |
        v  returns { total, found, values }
 CLI prints "<found> / <total> placeholders found." to stdout, exit 0
```

Key properties:
- `package.json` is read once per run and shared by all eight package resolvers; git is invoked once per git placeholder name present in the template (distinct names only, so at most 2 invocations).
- The only filesystem reads are template and `package.json`; the only write is the output file. No network. (NFR-2)
- The summary line is printed only after the output file has been written successfully.

## 4. Resolver contract

- Signature: `(ctx: { pkg: object|null, repoPath: string }) => string | null` in the registry; the underlying resolver functions take `pkg` or `repoPath` directly.
- Return a non-empty string only when the value is read directly from the source field or git output; otherwise `null`. Never infer, reformat from another field, or reuse a value from another repo or run (`placeholder-verifier`, `.claude/rules/not-found.md`).
- Rules as implemented (match requirements section 5, no discrepancy found):
  - `ProjectName`, `Description`, `TestCommand` (`scripts.test`), `License`: non-empty (after trim) string.
  - `MainEntryPoint`: `main`, else `bin` as string, else first value of `bin` object.
  - `Author`: string, or `author.name` when an object.
  - `Dependencies`, `DevDependencies`: `name@version` joined by `, `; missing or empty object gives `null`.
  - `LastCommitDate`: `git log -1 --format=%cI`; `LastCommitAuthor`: `git log -1 --format=%an`.
- Adding a placeholder = add one resolver function + one registry line + tests. No change to the engine or orchestrator.

## 5. Not Found policy

`Not Found` is produced in exactly one place: `substitute()` in `src/templateEngine.js`, when a name's value is `null` or absent. Everything upstream signals "unverifiable" with `null`.

| Case | Mechanism | Result |
|---|---|---|
| `package.json` missing, unreadable, invalid JSON (S4) | `readPackageJson` returns `null`; all package resolvers return `null` on `null` pkg | 8 package placeholders `Not Found`; git ones unaffected; exit 0 |
| Field absent, wrong type, or empty/whitespace string | `nonEmptyString` / `formatDependencies` return `null` | that placeholder `Not Found` |
| Not a git repo, no commits, git missing, timeout > 5 s, empty output (S5) | `readGitLog` catches everything and returns `null` | 2 git placeholders `Not Found`; exit 0 |
| Unrecognised `{{Token}}` | `resolve` returns `null` for unregistered names | counted in M, rendered `Not Found`, not an error (FR-3, resolved Q3) |
| Duplicate tokens | one value per distinct name, applied to every occurrence | identical output for all occurrences (FR-4) |

Only the exact `{{Name}}` form with `[A-Za-z0-9_]` is a token (FR-1). Text like `{{ Name }}`, `{{a.b}}` or `{{Name|default}}` is not matched: it is neither counted nor replaced and stays in the output unchanged. This is consistent with FR-1 ("strict syntax"). Decision (Q3): spaced tokens stay as-is and are not counted; this must be documented in the README (planned change P3).

Counting: `total` (M) = number of distinct token names; `found` (N) = number of those with a non-`null` value. Zero tokens gives `0 / 0 placeholders found.` and an identical copy of the template (FR-5).

## 6. Error handling, exit codes and template-overwrite protection

Exit codes (FR-7), all decided in `bin/claude-doc-sync.js`:

| Condition | Where detected | stderr | Exit |
|---|---|---|---|
| Completed run, any number of `Not Found` | `main` after `run()` | none; stdout summary | 0 |
| `--template` missing | arg check | `Error: --template <path> is required` | 1 |
| Template path missing or not a file (S2) | `existsSync` + `statSync().isFile()` | `Error: template file not found: <path>` | 1 |
| Repo path missing or not a directory (S3) | `existsSync` + `statSync().isDirectory()` | `Error: repo path not found or not a directory: <path>` | 1 |
| `--out` same file as `--template` (S6) | `samePath` (in `run()`, Step 5) | `Error: --out must not be the same path as --template ...` | 1 |
| Unexpected error in `run()` (template unreadable, output dir missing, output path is a directory, permission denied) | `try/catch` around `run` | `Error: <err.message>` | 1 |

Order of checks: template argument, template exists, repo exists (all in the CLI), then `run()`, whose first statement is the out-vs-template check. All validation happens before any file is written.

Template-overwrite protection (FR-6, AC-3, resolved Q5): `samePath(outPath, templatePath)` compares canonical paths using `fs.realpathSync.native` (falls back to `path.resolve` when the path does not exist yet), normalised, and lower-cased on `win32`. So relative vs absolute spellings, case differences on Windows, and symlinks to the template are all caught. `run()` owns this check (first statement, via `src/samePath.js`) and throws before reading or writing anything; the CLI has no check of its own and reports the error with exit 1 rather than silently redirecting the output. The invariant therefore holds for both entry points, including direct callers of `run()`. Decision (Q4, implemented in Step 5 as P4): the `samePath` guard lives in `run()`. Hard links cannot be detected by `samePath`; accepted as a known limitation (Q6).

Defaults (FR-8): `--repo` = `process.cwd()`; `--out` = `<template-basename-without-extension>.filled.md` in `process.cwd()` (not next to the template).

## 7. CI (in scope, NFR-5 / AC-6)

`.github/workflows/ci.yml`, workflow `CI`:
- Triggers: `push` to `main`, and every `pull_request`. Permissions `contents: read`. Concurrency group `ci-${{ github.ref }}` with cancel-in-progress.
- Job `test`: matrix `ubuntu-latest` and `windows-latest` x Node `20` and `22`, `fail-fast: false`, 10 min timeout. Steps: checkout, setup-node, `npm test`. No `npm install` is needed because the tool has no runtime dependencies (this also proves NFR-1 in CI).
- Job `e2e` (ubuntu, Node 20): `npm ci`, install Chromium, `npm run test:e2e`, upload `test-results/` on failure, then `.claude/hooks/scripts/validate-skills.sh .claude`. The Playwright and skill-validation steps go beyond NFR-5 (which only requires `npm test`); they are existing behaviour, retained, not required by SCRUM-1.
- Windows is in the matrix deliberately: `samePath` has Windows-specific case handling that only a Windows runner exercises.
- Issue: the push trigger names `main`, but this repo's default branch is `master` (`git branch -a`). Pushes to `master` do not start CI; pull requests do. Decision (Q1): add `master` to the push trigger (planned change P1).

## 8. Testing approach

Node's built-in runner, no framework (`npm test` = `node --test`, NFR-1). Layers, from the existing `test/` tree (file names only; test contents were not re-reviewed in this step):

| Layer | Files | What it proves |
|---|---|---|
| Unit - engine | `test/unit/templateEngine.test.js`, `templateEngine.edge.test.js` | token extraction, de-dup, substitution, `Not Found` for null (FR-1, FR-3, FR-4) |
| Unit - resolvers | `test/unit/packageJsonResolvers.test.js`, `.edge.test.js`, `gitResolvers.test.js`, `registry.test.js` | per-placeholder found and `Not Found` cases (AC-1, AC-2) |
| Unit - sources | `test/unit/sources.test.js` | `null` on missing/invalid `package.json`, non-git dir, no commits |
| Integration | `test/integration/run.test.js`, `run.edge.test.js` | full `run()` against a fixture repo built by `test/helpers/tempRepo.js`; assertions on output content and counts (FR-4, FR-5) |
| CLI subprocess | `test/cli/cli.test.js`, `cli.edge.test.js` | exit codes, stdout/stderr, `Not Found` cases, template-overwrite refusal (FR-6, FR-7, S1-S6) |
| Tooling hooks | `test/hooks/*.test.js` | project hook scripts (read-guard, Atlassian write guard, MCP trimmer); not part of the tool's requirements |
| e2e | Playwright against `demo.html` (`npm run test:e2e`) | demo page only; dev dependency, not part of the tool |

Design choices that keep tests deterministic: fixtures are built in temp directories per test; resolvers take plain objects; git behaviour is tested against throwaway repos, never the real repo history. Whether every requirements-section-8 case is covered by an existing test is a Step 3 / Step 6 check, not asserted here.

## 9. Technology choices (justification)

| Choice | Why | Traces to |
|---|---|---|
| Plain Node.js >= 20, CommonJS | No build step; `String.prototype.matchAll`, `Object.hasOwn` and the built-in test runner are available; one runtime to install. | NFR-1 |
| `child_process.execFileSync('git', [...])` | Authoritative git output; no shell, so no injection via `--repo`; explicit timeout bounds a hung git. Synchronous is fine for at most 2 short calls. | NFR-2, NFR-3, S5 |
| `fs` + `JSON.parse` for `package.json` | The authoritative source; no parser dependency. | NFR-2 |
| Regex tokens, no templating library | The syntax is deliberately minimal (no paths, defaults, formatting); a library would add features the requirements exclude. | FR-1 |
| `null` as the "unverifiable" signal, `Not Found` rendered once | One place to change the literal; resolvers stay free of presentation. | FR-3 |
| `node --test` | Zero dependencies; runs unit, integration and subprocess tests with one command. | NFR-1, AC-5 |
| Playwright (dev only) | Only for the demo page; excluded from the published package (`files`: `bin`, `src`, `templates`, `README.md`). | Requirements section 9 |
| GitHub Actions | CI is in scope; matrix covers both OSes the path logic differs on. | NFR-5 |

Rejected: a plugin/config system for placeholders, YAML templates, caching git results, and any network lookup (all outside the scope in requirements section 3).

## 10. Requirement traceability

| Requirement | Components |
|---|---|
| FR-1 | `templateEngine.extractPlaceholders` |
| FR-2 | `resolvers/index.js`, `packageJsonResolvers.js`, `gitResolvers.js`, both sources |
| FR-3 | `null` contract of sources and resolvers + `templateEngine.substitute` + registry `hasOwn` guard |
| FR-4 | `run.js` (one value per distinct name) + `templateEngine.substitute` |
| FR-5 | `run.js` (`total`, `found`) + CLI print |
| FR-6 | `samePath` guard at the top of `run()` (`src/samePath.js`; the CLI relies on it, Step 5); `run.js` never writes to the template path argument |
| FR-7 | CLI validation order and `try/catch` |
| FR-8 | CLI `parseArgs` and defaults |
| NFR-1 | Built-ins only; `package.json` has no `dependencies` |
| NFR-2, NFR-3 | Two sources only; every value flows from `readPackageJson` or `readGitLog` |
| NFR-4 | Process rule (`.claude/rules/human-in-the-loop.md`); no code component |
| NFR-5, AC-6 | `.github/workflows/ci.yml` |
| AC-1 to AC-5 | Sections 4, 5, 6 and 8 |

## 11. Open questions (all resolved by the human at the Step 2 approval)

Decisions: Q1 add `master` to the CI trigger [resolved]; Q2 keep distinct-name counting, reword FR-5 [resolved]; Q3 keep strict tokens, document in README [resolved]; Q4 move the guard into `run()` [resolved]; Q5 accept argument parsing as is [resolved]; Q6 hard links accepted as known limitation [resolved]; Q7 `build`, `deploy:local`, `release` out of scope [resolved]. Original question text kept below for the record.

1. CI push trigger: `ci.yml` triggers on `push` to `main`, but the default branch is `master`. Pushes to `master` will not run CI; only pull requests will. Change the trigger to include `master` (a one-line change in Step 5), or confirm the branch is intentionally different? Recommended: add `master`.
2. Meaning of M with duplicates: FR-5 says M is "total tokens found in the template". The code counts distinct names, so a template with `{{ProjectName}}` three times reports `M = 1`. Confirm distinct-name counting is intended, or change the requirement/code to count occurrences. Recommended: keep distinct names and reword FR-5.
3. Whitespace and malformed tokens: `{{ ProjectName }}` is left literally in the output and not counted. Acceptable under strict FR-1, or should it render `Not Found` and count in M? Recommended: keep strict, document it in the README.
4. [Resolved in Step 5: the guard now lives in `run()`, not the CLI.] Overwrite protection lived only in the CLI. `run()` called directly (it is `package.json` `main`, so it is importable) with `outPath == templatePath` would overwrite the template. Move the `samePath` guard into `run()` so the invariant holds for both entry points? Recommended: yes (small Step 5 change); otherwise record it as a known limitation.
5. Argument parsing is minimal: an option given without a value takes the next argument as its value (for example `--template --repo x` sets template to `--repo`) or `undefined`, and unknown flags are silently ignored. Not covered by FR-7/FR-8. Accept as-is, or add an "unknown/missing option value" usage error with exit 1?
6. Hard links: `samePath` resolves symlinks but cannot detect a hard link to the template; writing to such a path would modify the template. Practically negligible; accept as a known limitation?
7. `package.json` `build`, `deploy:local`, `release` scripts reference `scripts/`; no requirement mentions them. Confirm they are out of scope for SCRUM-1 (not reviewed here).

## 12. Planned changes (from Step 2 decisions; implemented in Step 5, no source changed yet)

| ID | Change | Files |
|---|---|---|
| P1 | Add `master` to the CI `push` trigger (`branches: [main, master]`) | `.github/workflows/ci.yml` |
| P2 | No code change: M stays "distinct token names"; FR-5 reworded | `generatedDocs/requirements.md` (done) |
| P3 | Document in README that only exact `{{Name}}` tokens count; `{{ Name }}` is left as-is and not counted | `README.md` |
| P4 | Move the `--out` equals `--template` check into `run()` (shared `samePath`); `run()` owns the check, the CLI has none of its own and reports the same message with exit 1 (done in Step 5) | `src/run.js`, `bin/claude-doc-sync.js` (+ tests) |
| P5 | Strip a leading UTF-8 BOM before `JSON.parse` in `readPackageJson` (Step 3 decision 8, added scope) | `src/sources/readPackageJson.js` |
| P6 | A non-string dependency version makes the whole `Dependencies`/`DevDependencies` value `Not Found` (Step 3 decision 9, added scope) | `src/resolvers/packageJsonResolvers.js` |
| P7 | README note: `--repo` inside a larger git repo reports the enclosing repo's last commit (Step 3 decision 10) | `README.md` |

Accepted as is, no change: argument parsing (Q5), hard links (Q6 known limitation). Out of scope: `build`, `deploy:local`, `release` scripts (Q7).

## Skills applied
- placeholder-verifier: checked that every placeholder name, source and rule in section 4 and the Not Found table in section 5 is read directly from `package.json` fields or `git log -1 --format=%cI|%an` in `src/resolvers/` and `src/sources/`, and that unrecognised names, failed lookups and empty values resolve to `null` and render exactly `Not Found`. Result: all 10 traceable, no discrepancy with requirements section 5; no untraceable value is introduced by the architecture. Items not traceable to code or requirements (the `build`/`deploy:local` scripts, per-test coverage) are listed as open questions or deferred rather than guessed.
