# Code Review - claude-doc-sync (SCRUM-1, Step 6)

Status: APPROVED by the user (Step 6). R1, R2, R3, R5, R6 and R7 (as a Known Limitation, no code change) were applied before Step 7; R4 and R8 need no action. Original review only: no source code was changed. Nothing committed, pushed, or written to Jira/Confluence.

Scope: the uncommitted working-tree diff on `feature/implementation` (base commit `fb5fff3`): `.github/workflows/ci.yml`, `README.md`, `bin/claude-doc-sync.js`, `src/run.js`, `src/samePath.js` (new), `src/sources/readPackageJson.js`, `src/resolvers/packageJsonResolvers.js`, and tests under `test/`. Checked against `generatedDocs/requirements.md`, `architecture.md`, `design-review.md`, `impl-plan.md`, `implementation.md`. Anything not traceable to `package.json`, `git log` or the code is `Not Found`.

## Evidence (run by this review)

- `npm test`: tests 142, pass 141, fail 0, cancelled 0, skipped 1. This matches `implementation.md`. The skipped test is `samePath: a symlink to the same file is true` (`cannot create symlink here (EPERM)`).
- `npm audit`: found 0 vulnerabilities.
- `package.json` is unchanged by the diff (zero new dependencies; the new module uses only `fs` and `path`).
- `npm run test:e2e` was not run (`demo.html` untouched; browser setup: Not Found).
- First CI run on `master`: Not Found.

## Findings by severity

No High findings. No Medium findings in code. Documentation findings are Low but should be fixed before the PR so the docs do not contradict the code.

| # | Severity | Finding | Location | Suggested fix / disposition |
|---|---|---|---|---|
| R1 | Low | `architecture.md` still contradicts the implemented design in three places. Section 3 CLI row and the flow diagram say the CLI refuses `--out == --template`. Line 103 says "The CLI refuses ..." and "`run()` does not repeat the check today". Section 11 Q4 and P4 (line 184) still read as planned or open ("CLI keeps the same message"). Step 5 updated only the error table row (line 98) and the FR-6 trace row (line 156). | `generatedDocs/architecture.md` lines 17, 35, 103, 172, 184 | Edit these lines to say the guard lives in `run()` and the CLI has no check of its own. |
| R2 | Low | `design-review.md` findings F1, F3, F8, F9, the FR-6 row (line 54) and P4 (line 72) cite `bin/claude-doc-sync.js` line numbers and describe a gap that is now closed. Step 5 deliberately left them as a historical record. Nothing marks them resolved, so a reader sees an open Medium finding (F1). | `generatedDocs/design-review.md` lines 26, 28, 33, 34, 40, 54, 72 | Add one "Resolved in Step 5" note (or a Resolution column) rather than rewriting the history. User decision (open question 1). |
| R3 | Low | `generatedDocs/test-cases.md` is stale. Execution evidence says "117 tests, 117 pass" (actual: 142 / 141 pass / 1 skip; it was already behind the 125 baseline). Scenario 6 maps only to the CLI test and the "bytes unchanged" test, not the new `run()`-level guard tests. No rows for BOM, non-string version, or the run-level repeated and spaced token tests. | `generatedDocs/test-cases.md` lines 12, 17 | Update counts and add the new test names to the mapping. Do not change `features/` (see R4). |
| R4 | Info | `features/placeholder-sync.feature` is NOT stale. Scenario "The template file is never overwritten" (lines 37-41) is behavioural and entry-point neutral ("I run claude-doc-sync", "refused with an error"). It stays true. It has no scenarios for BOM or non-string versions, which is acceptable (edge behaviour is covered by unit and integration tests). | `features/placeholder-sync.feature` | No action. Optional: add scenarios for the two new Not Found rules. |
| R5 | Low | Two BOM tests and one integration test embed a literal invisible U+FEFF character in the source (`grep` finds 3 lines in `test/unit/sources.test.js` and 1 in `test/integration/run.edge.test.js`). It is easy to lose in an editor or a lint pass and unreadable in review. | `test/unit/sources.test.js` (3 tests), `test/integration/run.edge.test.js` (1 test) | Replace with the escape `'﻿'`. Behaviour identical; the fixture assertion on byte `0xef` in the first test already proves the BOM is present. |
| R6 | Low | Symlink canonicalisation, the main reason `samePath` uses `realpath`, is not exercised on this machine (test skipped with EPERM). `implementation.md` says it is "covered by the existing CLI spelling test", but that test covers `.`/`..` spellings, not symlinks. The claim is slightly overstated. | `test/unit/samePath.test.js` line 69; `implementation.md` section "Test results" | Accepted risk locally. The test should run on `ubuntu-latest` CI (Linux symlinks are unprivileged); Windows runner behaviour: Not Found. Reword the `implementation.md` sentence. |
| R7 | Low (pre-existing, not part of this diff) | `formatDependencies` accepts an array: `dependencies: ["a"]` renders `0@a`. The array is not a valid `package.json` dependencies object, so the value is not a verifiable name/version pair. Reproduced by running the resolver. The new non-string check does not catch it because array elements here are strings. | `src/resolvers/packageJsonResolvers.js` line 13 | Out of scope for SCRUM-1. Optional one-line fix: `Array.isArray(deps)` returns `null`. Otherwise record under Known Limitations. User decision (open question 3). |
| R8 | Info | `samePath` still compares case-insensitively on win32 (design-review F8) and cannot see hard links (F9). Both were accepted at Step 3. README now documents the hard-link limitation. | `src/samePath.js`, `README.md` | Accepted risk, no change. |

## Area results (code-review-checklist)

1. Correctness: PASS. The guard is the first statement of `run()` (`src/run.js` lines 17-20), before any read or write, so a direct caller of `run()` is protected (closes design-review F1). Message text is identical to the old CLI text, so the three existing CLI tests pass unchanged. `samePath` is a verbatim move (diff against the removed CLI function is identical). BOM strip removes one leading U+FEFF only; invalid JSON still returns `null`. `formatDependencies` returns `null` for the whole field if any version is not a string; an empty string still renders `name@` (decision Q-A). CI now triggers on `main` and `master` (T1). Severity of open items: Low (R1-R3 are doc drift).
2. Security: PASS. No user-controlled path reaches a shell string: `src/sources/readGitLog.js` uses `execFileSync` with an argument array; the changed files add no `exec`/`spawn`. The overwrite guard strengthens the "never modify the template" rule. No secrets are written to output. No new dependency. Windows path handling goes through `path.resolve`, `path.normalize`, and `realpathSync.native`, lower-cased on win32. Residual: hard links (R8, accepted).
3. Error handling: PASS. The guard error flows through the CLI `try/catch` to `fail()`: `Error: --out must not be the same path as --template ...`, exit 1 (bin lines 47-55). A missing template or repo is still validated first by the CLI, so the guard does not change that order. A nonexistent `--out` falls back to `path.resolve`, so it cannot throw inside `samePath`. Malformed or BOM-only-corrupt `package.json` returns `null`, which resolves to `Not Found`. Regex state: `PLACEHOLDER_PATTERN` is a module-level `/g` regex, but it is used only through `matchAll` (clones the regex) and `replace` (resets `lastIndex`), so no state leaks across calls (unchanged by this diff).
4. Test coverage: PASS with notes. 17 new tests, matching the minimums in the plan (Q-E): 3+1 BOM, 3 non-string versions, 5 `samePath` (1 skipped), 3 `run()` guard, 2 run-level repeated/spaced token. Both happy path and Not Found cases are covered, including "one bad version nulls the whole field", "BOM then invalid JSON stays null", "BOM not leading is not stripped", and "rejected run creates or changes no other file". Gaps: symlink case skipped locally (R6); no test for the guard when the template itself is missing (the CLI checks first, so `run()` would throw on the path match, an acceptable order); no array-dependencies test (R7).
5. Code clarity: PASS. Names state intent (`samePath`, `formatDependencies`); JSDoc is updated for the new behaviour and the `@throws`; the CLI keeps a one-line comment pointing to `run()`. Note R5 (invisible BOM character in tests).
6. DRY: PASS. `samePath` now has one implementation and the error message string exists only in `src/run.js`. The CLI no longer has a copy. Tests repeat a `setup/try/finally` block, which matches the existing style of the file; not worth abstracting.
7. Dependency safety: PASS. `npm audit` reports 0 vulnerabilities. `package.json` is untouched; no new runtime or dev dependency. The only devDependency is `@playwright/test` (documented correctly in the README, closing Q-B).

## Requirement traceability

| Requirement | Implemented by | Evidence | Result |
|---|---|---|---|
| FR-6 / AC-3 / S6 template never modified, including `--out == --template` | `src/run.js` guard + `src/samePath.js` | 3 new `run()` tests plus 3 existing CLI tests (all pass) | Met (hard-link and win32 case-fold limits accepted) |
| FR-7 exit codes | `bin/claude-doc-sync.js` `try/catch` to `fail()` | CLI tests for exit 1 and message | Met |
| Placeholder values only from `package.json` / git (Not Found rule) | `readPackageJson`, `formatDependencies` | BOM and non-string unit tests; no value is invented | Met |
| Duplicate-placeholder handling and counts (`N / M`) | unchanged `templateEngine`, pinned by 2 new run-level tests | `total 1, found 0, Not Found x3` | Met |
| P1 CI branches (T1) | `.github/workflows/ci.yml` `[main, master]` | diff read; CI run result Not Found | Met by inspection |
| P5 BOM, P6 non-string version, P4 shared guard, README notes (T2-T7) | files listed in scope | `npm test` 142 / 141 pass / 1 skipped | Met |
| Docs consistent with code | `requirements.md` FR-6, `architecture.md` rows 98 and 156 | see R1-R3 | Partly: drift remains in R1-R3 |

## Verdict

APPROVE WITH MINOR DOC FIXES. The code changes are correct, minimal, and well tested; no High or Medium issues, no vulnerabilities, no new dependencies. Recommend fixing R1, R3 and R5 (and R2 per the user's choice) before Step 7. R6-R8 are accepted risks to carry into Known Limitations in the PR.

## Open questions for the user

1. R2: add a "Resolved in Step 5" note to `design-review.md`, or leave it untouched as a historical record?
2. Should I fix R1, R3 and R5 (docs and test escape only; no behaviour change) now, or hand them to Step 5 owner? Fixes require re-running `npm test` (expect 142 / 141 / 1 skipped).
3. R7: fix the array-dependencies edge now (one line plus one test), or list it as a Known Limitation?
4. Is the skipped symlink test acceptable until it is seen passing on the Ubuntu CI runner?

## Skills applied
- code-review-checklist: ran all seven areas against the working-tree diff, recorded finding, severity and disposition for each. Result: no High or Medium findings; 5 Low and 2 Info items; `npm audit` 0 vulnerabilities; `npm test` 142 tests, 141 pass, 0 fail, 1 skipped.
- placeholder-verifier: re-checked that the two resolver-layer changes (`readPackageJson` BOM strip, `formatDependencies` string-version check) only read from parsed `package.json` and return `Not Found` otherwise, and that no value comes from outside `package.json` or `git log`. Result: confirmed; the pre-existing array case (R7) was found by running the resolver. Items not traceable (CI result on `master`, Windows symlink behaviour, e2e status) are marked `Not Found`.
