# Implementation Plan - claude-doc-sync (SCRUM-1)

Status: APPROVED (Step 4) by the user; open questions Q-A to Q-E resolved in section 6. Step 5 (implementation) in progress. Inputs: `generatedDocs/requirements.md` (Step 1, approved), `generatedDocs/architecture.md` (Step 2, approved), `generatedDocs/design-review.md` (Step 3, approved with decisions 8-10 recorded). Grounded in `src/`, `bin/`, `test/` and `.github/workflows/ci.yml` on branch `feature/implementation`. Jira/Confluence were not read or written. No source code was changed in this step. Anything not traceable to `package.json`, `git log` or the code is marked `Not Found`.

Note on the file: `generatedDocs/impl-plan.md` already existed (committed in `1ce869e`; a retrospective build plan, steps A onward). It is replaced by this plan because the user named this exact filename. No other implementation-plan file exists in `generatedDocs/`. The previous text remains in git history.

## 1. Baseline (verified in this step)

- The tool is already built: `src/templateEngine.js`, `src/sources/{readPackageJson,readGitLog}.js`, `src/resolvers/{index,packageJsonResolvers,gitResolvers}.js`, `src/run.js`, `bin/claude-doc-sync.js`.
- `npm test` (`node --test`) ran in this step: 125 tests, 125 pass, 0 fail. This is the baseline; every task below must keep it green.
- This plan therefore covers only the planned changes P1-P7, not a from-scratch build. The original build order (engine, sources, resolvers, `run.js`, CLI, tests, CI) is already done and is not repeated.
- Existing tests relevant to the changes: `test/integration/run.edge.test.js:123` (repeated token gives `total 1`, `found 1`), `:201` (template bytes unchanged after a run); `test/cli/cli.test.js:57`, `test/cli/cli.edge.test.js:178,195` (the three `--out` equals `--template` CLI tests, matching stderr `/--out must not be the same path as --template/`, exit 1); `test/unit/templateEngine.edge.test.js:23,39` (spaced tokens ignored at engine level only).

## 2. Task table

Single-person build, so tasks run strictly in the order below. "Blocked" means it cannot start until the listed task is finished. T1, T2, T3 do not depend on each other, but are still done one at a time.

| Task | Change | Depends on | Blocked | Status |
|---|---|---|---|---|
| T1 | CI trigger includes `master` (P1) | none | No | Done (Step 5) |
| T2 | Strip UTF-8 BOM in `readPackageJson` (P5) | none | No | Done (Step 5) |
| T3 | Non-string dependency version gives `Not Found` (P6) | none | No | Done (Step 5) |
| T4 | Extract `samePath` into `src/samePath.js` (P4, part 1) | none | No | Done (Step 5) |
| T5 | Guard at the top of `run()`, CLI relies on it (P4, part 2) | T4 | Yes, until T4 is done | Done (Step 5) |
| T6 | Run-level tests for repeated token and spaced token (P2, P3 tests) | T5 (same test file, avoids merge churn; no code dependency) | Soft | Done (Step 5) |
| T7 | README notes (P3, P7, hard-link limitation) | T2, T3, T5 (so the text matches final behaviour) | Yes, until T2, T3, T5 are done | Done (Step 5) |
| T8 | Final verification: full `npm test`, `git diff` review, doc-drift check | T1-T7 | Yes, until all done | Done (Step 5) |

## 3. Task detail

### T1 - CI trigger (P1)
- Files: `.github/workflows/ci.yml` line 5: `branches: [main]` becomes `branches: [main, master]`.
- Tests: none possible locally (workflow file). Verify by reading the YAML, and on the first push to `master` (outside this plan; pushing needs separate approval).
- Traces to: NFR-5, AC-6, F2, architecture Q1.
- `npm test` role: unaffected; must stay at 125 pass.
- Risk: very low. A typo breaks the workflow silently. Mitigation: one-line diff, review `git diff` before moving on.

### T2 - BOM stripping (P5)
- Files: `src/sources/readPackageJson.js`. Strip a single leading `﻿` from `raw` before `JSON.parse`; keep the `try/catch` returning `null`.
- Tests (update `test/unit/sources.test.js`, which already has the five `readPackageJson` cases):
  - BOM-prefixed valid JSON returns the parsed object.
  - BOM followed by invalid JSON still returns `null`.
  - A BOM only in the middle of the file is not stripped (still `null` if invalid JSON), proving only a leading BOM is removed.
- Optional integration check in `test/integration/run.edge.test.js`: a repo whose `package.json` starts with a BOM resolves `{{ProjectName}}` (not `Not Found`). One extra test.
- Traces to: new scope A1 (requirements section 9a), F5, decision 8; protects AC-1/AC-2 for BOM files.
- `npm test`: the new tests fail before the change and pass after; all 125 existing tests unchanged.
- Risk: low. Does not weaken `Not Found` (invalid JSON still `null`). Note: this addition is beyond the original SCRUM-1 text; it is recorded in requirements section 9a.

### T3 - Non-string dependency version (P6)
- Files: `src/resolvers/packageJsonResolvers.js`, `formatDependencies`: if any value in `deps` is not a `typeof 'string'`, return `null` for the whole field. Decision for the human: should an empty-string version count as a string (rendered `name@`)? Plan default: keep current behaviour for strings including empty (only the type is checked), because the decision only mentions "not a string". See open question Q-A.
- Tests (update `test/unit/packageJsonResolvers.edge.test.js`, near the existing `dependencies:` cases at lines 53-70):
  - `{ a: { b: 1 } }`, `{ a: 1 }`, `{ a: null }` give `null` for both `dependencies` and `devDependencies`.
  - A mix (one valid, one invalid) gives `null` for the whole field, not a partial string.
  - String versions and ranges (`^1.0.0`, `file:../x`) are unchanged (existing test at line 63 keeps passing).
- Traces to: A2, F6, decision 9, NFR-3 (every value traceable).
- `npm test`: new tests fail before, pass after; existing 125 unchanged.
- Risk: low. Behaviour change only for malformed `package.json` that previously printed `[object Object]`.

### T4 - Extract `samePath` (P4, part 1)
- Files: new `src/samePath.js` exporting `samePath(a, b)`, a verbatim move of the function now at `bin/claude-doc-sync.js` lines 25-40 (realpath with `path.resolve` fallback, `path.normalize`, lower-case on `win32`). F8 (case-folding on win32) is carried over unchanged. At the end of T4 the CLI imports it from the new module and its own copy is deleted, so there is one implementation and the CLI behaviour is identical.
- Tests: new `test/unit/samePath.test.js`:
  - identical path returns `true`; different files return `false`.
  - different spelling of the same file (`dir/./f.md` vs `dir/f.md`) returns `true`.
  - a nonexistent path falls back to `path.resolve` and compares correctly (so a not-yet-created `--out` works).
  - case-only difference: `true` on `win32`, `false` otherwise (guard the assertion with `process.platform`).
  - symlink to the same file returns `true`: skip when the symlink cannot be created (Windows without privilege); this is a known portability risk, so use `t.skip` on `EPERM`.
- Existing CLI tests (`cli.test.js:57`, `cli.edge.test.js:178,195`) must pass unchanged; they are the regression guard for this task.
- Traces to: FR-6, AC-3, S6, F1, F3, F8.
- `npm test`: all existing CLI tests still green proves no behaviour change from the move.
- Risk: low; pure refactor. Wrong relative `require` path would fail every CLI test immediately.

### T5 - Guard in `run()` (P4, part 2)
- Files: `src/run.js` and `bin/claude-doc-sync.js`.
  - `run.js`: first statement of `run()` is `if (samePath(outPath, templatePath)) throw new Error('--out must not be the same path as --template (the template is never modified)');`. This happens before `readFileSync` and `writeFileSync`. Message text is identical to the current CLI message (F3).
  - `bin/claude-doc-sync.js`: remove the CLI pre-check (lines 65-68) so `run()`'s thrown error flows through the existing `try/catch` to `fail(err.message)`, giving `Error: --out must not be the same path as --template (the template is never modified)` and exit 1. Keep one source of the message string (preferably defined once in `run.js`; if the CLI keeps its own check instead, the strings must match). Validation order stays: template, repo, then the guard.
  - Note: `samePath` stays in `src/samePath.js`; the CLI no longer needs `fs`-based path checks for it, but `fs` and `path` are still used elsewhere in the CLI.
- Tests:
  - New integration tests in `test/integration/run.edge.test.js`: (a) `run()` with `outPath === templatePath` throws an error matching `/--out must not be the same path as --template/` and the template is byte-identical afterwards; (b) the same with a different spelling of the same path; (c) no file other than the template is created or changed.
  - The three existing CLI tests are unchanged and must pass (stderr match, exit 1, template untouched).
  - One new CLI subprocess assertion is not required; the existing three already prove stdout is empty on error via `cli.edge.test.js:59`.
- Traces to: FR-6, FR-7, AC-3, S6, F1, F3.
- `npm test`: new integration tests fail before T5 (the template would be overwritten, so the test must create its own temp template) and pass after.
- Risk: medium. (1) Message drift would break the CLI regex tests: guarded by those tests. (2) Order of checks: if the guard ran after `readFileSync`, a missing template with equal paths would report the read error instead; the guard goes first, and `samePath` handles nonexistent paths via the fallback. Check the existing `run(): a missing template throws` test (`run.edge.test.js:258`) still passes (it uses different paths). (3) The test must never run against a real template; always use temp dirs (`createTempDir`).

### T6 - Run-level tests for P2 and P3
- Files: `test/integration/run.edge.test.js` only (no source change).
- Tests:
  - Repeated token: already covered at `:123` for the resolved case (`total 1`, `found 1`). Add the unresolved case: `{{Unknown}}` three times gives `total 1`, `found 0`, all three occurrences render `Not Found` (the `0 / 1` case named in design-review P2).
  - Spaced token at run level: a template with `{{ ProjectName }}` and `{{ProjectName}}` leaves the spaced text literally in the output and counts only one name (`total 1`). The engine-level equivalents exist (`templateEngine.edge.test.js:23,39`); the run-level test is new.
- Traces to: FR-1, FR-5 (reworded), AC-4, F4, decision Q3.
- `npm test`: new tests pass against current code (they pin existing behaviour); they would fail if the counting semantics changed.
- Risk: low.

### T7 - README (P3, P7, hard-link limitation)
- Files: `README.md`, near "Supported Placeholders" (after line 39 "Any other `{{Token}}`...") and the Usage section.
- Content, each traceable to a design-review decision:
  - Only exact `{{Name}}` tokens (letters, digits, underscore, no spaces) are recognised; `{{ Name }}` is left unchanged and not counted (Q3, P3).
  - `N / M`: M is the number of distinct token names; a repeated name counts once (Q2, FR-5).
  - Known limitation: a hard link to the template is not detected by the overwrite check (Q6, F9).
  - `--repo` inside a larger git repository reports the enclosing repository's last commit (F7, decision 10, P7).
  - A UTF-8 BOM in `package.json` is ignored and a non-string dependency version gives `Not Found` (decisions 8 and 9).
- Tests: none for text. Verify by reading the rendered text and by checking each statement against a test from T2, T3, T5, T6.
- Traces to: FR-1, FR-5, FR-6, F7, F9, decisions Q2, Q3, Q6, 10.
- Risk: documentation drift. The repo has a post-implementation doc-drift hook (`.claude/hooks/`, per CLAUDE.md); contents Not Found in this step (hook scripts not read).
- Observations needing a decision (open questions Q-B, Q-C): README line 70 says "No `dependencies` or `devDependencies` are used anywhere in this project", but `package.json` has `devDependencies` with `@playwright/test ^1.47.0`; and README "Design" links `requirements.md`, `architecture.md`, `design-review.md`, `impl-plan.md` relative to the repo root, while these files are in `generatedDocs/` (a root-level copy: Not Found).

### T8 - Final verification
- Run `npm test` (expect baseline 125 plus the new tests, all pass) and `git diff --stat` to confirm the changed files are exactly: `.github/workflows/ci.yml`, `src/sources/readPackageJson.js`, `src/resolvers/packageJsonResolvers.js`, `src/samePath.js` (new), `src/run.js`, `bin/claude-doc-sync.js`, `README.md`, and test files.
- Optionally run `npm run test:e2e` only if `demo.html` or its inputs are touched (they are not planned to be); `npm run test:all` is not required for these changes.
- Not done here: Step 6 code review, Step 7 verification report. No commit, push or PR without separate approval.

## 4. Traceability

| Requirement / finding | Task(s) | Test(s) that prove it |
|---|---|---|
| FR-1 (strict tokens), Q3 | T6, T7 | new run-level spaced-token test; existing engine tests |
| FR-2 / AC-1 | T2, T3 | existing `run.edge.test.js:43` (all ten resolve) plus BOM integration check |
| FR-3 / AC-2 | T2, T3 | BOM plus invalid JSON stays `null`; non-string version gives `null` |
| FR-4 | none (no change) | existing `run.edge.test.js:123` |
| FR-5 / AC-4 / F4 / P2 | T6, T7 | existing `:123` plus new `0 / 1` test |
| FR-6 / AC-3 / S6 / F1 / F3 | T4, T5 | new `samePath` unit tests, new `run()` integration tests, three existing CLI tests |
| FR-7 | T5 | existing CLI tests (exit 1, stderr message) |
| NFR-1 | all | no new dependencies; new module uses `fs`, `path` only |
| NFR-3 / F6 | T3 | non-string version tests |
| NFR-5 / AC-6 / F2 / P1 | T1 | YAML review; first push to `master` (Not Found until it happens) |
| AC-5 | T8 | `npm test` |
| F5 / decision 8 / A1 | T2 | BOM unit tests |
| F7 / decision 10 / A3 | T7 | documentation only |
| F9 / Q6 | T7 | documentation only |
| F8, F10, F11-F16 | none | accepted or informational |

## 5. Risks (summary)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Changing the CLI/`run()` guard alters stderr text or exit code | Low | Message defined once; three existing CLI tests stay unchanged and must pass |
| New `run()` guard test overwrites a real file if written carelessly | Low | Use only temp-dir files from `test/helpers/tempRepo.js` |
| Symlink test fails on Windows without privilege | Medium | Skip on `EPERM`; the realpath behaviour is already exercised by the existing CLI spelling test |
| Scope creep: P5 and P6 are not in the original SCRUM-1 requirements | Low | Recorded in requirements 9a and design-review decisions 8-9; both approved by the human |
| CI workflow typo is invisible locally | Low | One-line change, diff review, observed on first push |
| README claims drift from behaviour | Low | Each README line is tied to a test or decision (T7) |

## 6. Open questions for the human

Resolved by the user (Step 4 approved):
- Q-A (T3): RESOLVED. Empty-string version: type check only (still renders `name@`).
- Q-B (T7): RESOLVED, YES. Fix the README sentence saying there are no `devDependencies` (`package.json` lists `@playwright/test`).
- Q-C (T7): RESOLVED, YES. Fix README "Design" links to point to `generatedDocs/`.
- Q-D (T5): RESOLVED. Remove the CLI's own `--out` equals `--template` check; `run()` is the single source of truth (same message, exit 1; the three existing CLI tests pass unchanged).
- Q-E: RESOLVED. Minimum new-test counts confirmed as listed (BOM: 3 unit + 1 integration; non-string versions: 3 unit; `samePath`: 4-5 unit; `run()` guard: 3 integration; run-level P2/P3: 2).

## Skills applied
- placeholder-verifier: checked, against `src/resolvers/`, `src/sources/` and `bin/claude-doc-sync.js`, that the planned changes P5 and P6 only make the tool stricter or more tolerant of how the source is read (BOM, non-string version) and never introduce a value from outside `package.json` or `git log`. Result: all planned tests assert either a real source value or `Not Found`. Items not traceable (first push to `master` result, hook script contents, a root-level copy of the design docs, final test count after changes) are marked `Not Found`.
- git-metadata-reader: not applicable because this step plans no change to `src/sources/readGitLog.js`; the one git-related item (F7, subdirectory of a larger repo) is documentation only (T7).
