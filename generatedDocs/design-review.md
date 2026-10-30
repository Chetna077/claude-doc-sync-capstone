# Design Review - claude-doc-sync (SCRUM-2)

Status: APPROVED (Step 3) - the human resolved open questions 8-10 (section 5); planned changes are now P1-P7. (Originally a draft for human approval.) Inputs: `generatedDocs/requirements.md` (Step 1, approved) and `generatedDocs/architecture.md` (Step 2, approved with the decisions below), checked against the code in `src/`, `bin/` and `.github/workflows/ci.yml` on branch `feature/implementation`. Jira/Confluence were not read or written. No source code was changed. Anything not traceable to `package.json`, `git log` or the code is marked `Not Found`.

## 1. Step 2 and Step 3 decisions recorded

| Q | Decision | Recorded as |
|---|---|---|
| 1 | Add `master` to the CI trigger | P1 |
| 2 | Keep code (M = distinct token names); reword FR-5 | P2 (FR-5 reworded in requirements.md, done) |
| 3 | `{{ ProjectName }}` stays as-is, not counted; document in README | P3 |
| 4 | Move the `--out` equals `--template` check into `run()` | P4 |
| 5 | Argument parsing accepted as is | No change |
| 6 | Hard links undetectable by the overwrite check | Accepted known limitation |
| 7 | `build`, `deploy:local`, `release` scripts | Out of scope |
| 8 | YES: strip a leading UTF-8 BOM before `JSON.parse` of `package.json` (F5) | P5, in scope |
| 9 | YES: a dependency version that is not a string renders `Not Found` (F6) | P6, in scope |
| 10 | YES: accept the subdirectory-of-a-larger-git-repo behaviour (F7) and document it in the README | P7 |

## 2. Findings

Severity: High = wrong output or data loss; Medium = real gap a user can hit; Low = edge case or hygiene; Info = checked, no action.

| # | Severity | Finding | Evidence | Disposition |
|---|---|---|---|---|
| F1 | Medium | Template-overwrite guard exists only in the CLI. `run()` is the package `main`, so a direct call with `outPath == templatePath` overwrites the template, breaking FR-6/AC-3 for that entry point. | `bin/claude-doc-sync.js` lines 65-68 (`samePath`); `src/run.js` line 30 writes unconditionally | Fix: P4. **Resolved in Step 5:** the guard now lives in `run()` (`src/samePath.js`); the line references here describe the pre-fix code and are kept as a historical record. |
| F2 | Medium | CI does not run on pushes to `master` (trigger is `main`; default branch is `master`). AC-6 says "pull requests and pushes". | `.github/workflows/ci.yml` line 5; `git branch -a` shows `master`, no `main` | Fix: P1 |
| F3 | Low | P4 design risk: moving the guard must not change observable CLI behaviour. Three existing tests match stderr `/--out must not be the same path as --template/` and exit 1. The guard must run before `readFileSync`/`writeFileSync`, and `samePath` (currently private to the CLI) must move to a shared module so there is one implementation. | `test/cli/cli.test.js:67`, `test/cli/cli.edge.test.js:188,208` | Constraint on P4 |
| F4 | Low | FR-5 wording said "total tokens found" while code counts distinct names (`names.length` from a de-duplicated list). Mismatch is resolved by rewording; code is unchanged. | `src/templateEngine.js` `extractPlaceholders`; `src/run.js` line 32 | Closed: P2 done. Step 5/6 should confirm a test asserts a triple-repeated token gives `M = 1` (existence of that test: Not Found, tests not re-read in this step) |
| F5 | Low | A `package.json` saved with a UTF-8 BOM (common on Windows) is valid for editors but `JSON.parse` rejects it, so all 8 package placeholders render `Not Found` although the data is present. Verified: `JSON.parse('﻿{...}')` throws. Fails safe (never a wrong value) but is a false `Not Found`. | `src/sources/readPackageJson.js` | Fix: P5 (Q8 resolved YES) |
| F6 | Low | `formatDependencies` interpolates any version value. A malformed `dependencies` entry such as `{"a": {"b": 1}}` renders `a@[object Object]`. Verified by running the resolver. This is not a value read from the file, which weakens "every value is traceable" (NFR-3) for malformed input only. | `src/resolvers/packageJsonResolvers.js` line 14 | Fix: P6 (Q9 resolved YES) |
| F7 | Low | `LastCommitDate`/`LastCommitAuthor` use `git log` with `cwd=repo`. If `--repo` is a subdirectory of a larger git repository, git walks up and reports the parent repository's last commit. The value is real git output, but the requirements do not say whether this is intended. Requirement on this: Not Found. | `src/sources/readGitLog.js` | Accepted; document in README: P7 (Q10 resolved YES) |
| F8 | Low | On `win32`, `samePath` lower-cases both paths. On a case-sensitive Windows directory two different files differing only by case would be refused as the same. Fails safe (refuses, nothing written). | `bin/claude-doc-sync.js` lines 26-29 | Accept; carry into the shared module unchanged |
| F9 | Low | Hard links to the template are not detected. | `samePath` uses realpath only | Accepted limitation (Q6); add one line to README known limitations |
| F10 | Low | Argument parsing: option without a value swallows the next argument; unknown flags ignored. | `parseArgs`, lines 8-18 | Accepted (Q5), no change |
| F11 | Info | Malformed or hostile `package.json` cannot crash the tool: missing, unreadable, invalid JSON, `null`, `[]`, a number or a string all yield `null` for every package resolver (verified by running `projectName(5)`, `projectName([])`, `license('str')`). | `readPackageJson`, `nonEmptyString` | No action |
| F12 | Info | Non-determinism: the tool has no run-time timestamp field. `LastCommitDate` is the committer date of HEAD, so output depends only on repo state. | `gitResolvers`, git format `%cI` | No action |
| F13 | Info | Resolver lookup is an explicit table with an `Object.hasOwn` guard, so `{{constructor}}` and `{{__proto__}}` cannot reach the prototype. An explicit table was kept over reflection for traceability. | `src/resolvers/index.js` line 31 | No action |
| F14 | Info | Duplicate-placeholder correctness: `substitute` uses a replacer function, so `$&`-style sequences in values are inserted literally, and every occurrence gets the same value from one lookup per distinct name. | `src/templateEngine.js` lines 33-36 | No action |
| F15 | Info | Missing-path handling: template missing/not a file, repo missing/not a directory, and output directory missing/output is a directory all exit 1 with an `Error:` line and write nothing (the last via the `try/catch`). | `bin/claude-doc-sync.js` lines 45-76 | No action |
| F16 | Info | The CI `e2e` job (Playwright and `validate-skills.sh`) goes beyond NFR-5. It is existing behaviour and will make PR checks fail if the demo or skill wiring breaks. | `ci.yml` lines 33-53 | Retain; not required by SCRUM-2 |

No High findings. Because a first pass with no High finding deserves suspicion, the architecture was re-checked against each requirement line (section 3); the findings F5-F7 came from that second pass.

## 3. Requirement-to-design traceability

| Requirement | Design element | Gap |
|---|---|---|
| FR-1 | `extractPlaceholders`, regex `[A-Za-z0-9_]+` | None. Spaced tokens excluded by decision Q3; README must say so (P3) |
| FR-2 / AC-1 | registry + 8 package resolvers + 2 git resolvers | None; 10 names match requirements section 5 |
| FR-3 / AC-2 | `null` contract, `substitute` | None. F5/F6 are malformed-input edges only |
| FR-4 | one value per distinct name, `substitute` | None |
| FR-5 / AC-4 | `run()` counts, CLI prints | Wording gap closed (F4) |
| FR-6 / AC-3 / S6 | CLI `samePath` only | Gap: not enforced in `run()` (F1) until P4 |
| FR-7 / S2 / S3 | CLI validation order, `try/catch` | None |
| FR-8 | `parseArgs` defaults | None (argument robustness accepted, F10) |
| S4 / S5 | `null` from both sources | None (BOM edge F5) |
| NFR-1 | built-ins only; `package.json` has no `dependencies` | None |
| NFR-2 / NFR-3 | two sources only | F6, F7 are edge cases |
| NFR-4 | process rule, no code | None |
| NFR-5 / AC-6 | `ci.yml` | Gap: push to `master` not covered (F2) until P1 |
| AC-5 | `npm test` | Pass status not run in this step: Not Found (verified in Step 7) |
| Testing bar (requirements section 8) | architecture section 8 lists test files | Per-case coverage Not Found (test contents not reviewed here); check in Steps 4 and 6 |

## 4. Planned changes for Step 4 (implementation plan) and Step 5

| ID | Change | Files | Tests to add or adjust |
|---|---|---|---|
| P1 | `on.push.branches: [main, master]` | `.github/workflows/ci.yml` | None (workflow); verify by reading the YAML and on the first push to `master` |
| P2 | FR-5 reworded (done in this step); no code change | `generatedDocs/requirements.md` | Confirm or add a test: a template with one token repeated three times reports `1 / 1` (or `0 / 1` when unresolved) |
| P3 | README note: only exact `{{Name}}` tokens (letters, digits, underscore) are recognised; `{{ Name }}` is left unchanged and not counted. Also note M counts distinct names and the hard-link limitation (F9) | `README.md` | Confirm or add a test that `{{ ProjectName }}` stays literal and is not counted |
| P4 | Extract `samePath` into a shared module (for example `src/samePath.js`); call it at the top of `run()` before any read or write and throw an `Error` with the existing message `--out must not be the same path as --template (the template is never modified)`; CLI drops its own pre-check or keeps it only if the message stays identical; CLI `try/catch` prints `Error: <message>` and exits 1 | `src/run.js`, `src/samePath.js` (new), `bin/claude-doc-sync.js` | New integration test: `run()` with equal paths throws and leaves the template byte-identical; existing three CLI tests must still pass unchanged |
| P5 | Strip a leading UTF-8 BOM (`﻿`) from the raw text before `JSON.parse` in `readPackageJson` (F5). Added to scope by the human; not in the SCRUM-2 requirements as originally written | `src/sources/readPackageJson.js` | Unit test in `test/unit/sources.test.js`: a BOM-prefixed valid `package.json` parses; BOM plus invalid JSON still returns `null` |
| P6 | In `formatDependencies`, if any dependency version is not a string, return `null` (whole field `Not Found`) instead of interpolating `[object Object]` (F6). Added to scope by the human | `src/resolvers/packageJsonResolvers.js` | Unit tests in `test/unit/packageJsonResolvers.edge.test.js`: `{a: {b: 1}}`, `{a: 1}`, `{a: null}` give `null`; string versions and ranges unchanged |
| P7 | README note: when `--repo` is a subdirectory of a larger git repository, git reports the enclosing repository's last commit (F7) | `README.md` | None (documentation) |

No change: parseArgs (Q5), hard links (Q6, README line only), scripts `build`/`deploy:local`/`release` (Q7).

## 5. Open questions (8-10 resolved by the human at the Step 3 approval)

8. [resolved: YES] BOM in `package.json` (F5): strip a leading BOM before `JSON.parse` (small Step 5 change plus one test), or accept `Not Found` for such files? Recommended: strip the BOM.
9. [resolved: YES] Non-string dependency versions (F6): return `Not Found` for the whole field, or skip, when a version is not a string, instead of rendering `[object Object]`? Recommended: treat the field as unverifiable (`null`).
10. [resolved: YES] Subdirectory of a larger git repo (F7): accept that git reports the enclosing repo's last commit and mention it in the README? Recommended: accept and document.

Items 8 and 9 are additions to scope beyond the SCRUM-2 requirements as written; the human accepted them, so Step 4 covers P1-P7 (see `generatedDocs/impl-plan.md`).

## Addendum (Step 6/7): known limitation carried forward

- R7 (found in Step 6, no code change): `dependencies: ["a"]` renders `0@a`. Recorded as a Known Limitation in `README.md` and `requirements.md` (A4).

## Skills applied
- placeholder-verifier: re-checked, against `src/resolvers/`, `src/sources/` and `src/templateEngine.js`, that all 10 placeholder values come only from parsed `package.json` fields or `git log -1 --format=%cI|%an`, and that unrecognised names and failed lookups render `Not Found`. Result: traceable, with two malformed-input edges where output is not a verbatim source value or is a false `Not Found` (F5 BOM, F6 `[object Object]`), raised as open questions rather than guessed. Items not traceable to code, `package.json` or git (per-test coverage, `npm test` result, `build`/`deploy:local`/`release` behaviour) are marked `Not Found`.
