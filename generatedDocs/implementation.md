# Implementation - claude-doc-sync (SCRUM-1, Step 5)

Status: DONE and APPROVED by the user (Step 5); Step 6 (code review) in progress. Implemented in the working tree on `feature/implementation`. Nothing committed, pushed, or written to Jira/Confluence. Input: approved `generatedDocs/impl-plan.md` (Q-A to Q-E resolved by the user and recorded there). Zero new runtime dependencies (`package.json` untouched; new module uses `fs` and `path` only).

## Task results

| Task | Result | Files |
|---|---|---|
| T1 CI trigger | `branches: [main, master]`. Not testable locally; verified by reading the diff. First push to `master` result: Not Found. | `.github/workflows/ci.yml` |
| T2 BOM | A single leading `U+FEFF` is stripped before `JSON.parse`; invalid JSON still returns `null`. 3 unit tests + 1 integration test. | `src/sources/readPackageJson.js`, `test/unit/sources.test.js`, `test/integration/run.edge.test.js` |
| T3 Non-string version | Any non-string version makes the whole `Dependencies`/`DevDependencies` field `null` (`Not Found`). Empty string still renders `name@` (Q-A). 3 unit tests. | `src/resolvers/packageJsonResolvers.js`, `test/unit/packageJsonResolvers.edge.test.js` |
| T4 `samePath` | Verbatim move into a shared module. 5 unit tests (symlink test skips on `EPERM`, which happened on this machine). | `src/samePath.js`, `test/unit/samePath.test.js` |
| T5 Guard in `run()` | First statement of `run()` throws `--out must not be the same path as --template (the template is never modified)`. The CLI check was removed (Q-D); the error flows through the existing `try/catch` to `fail()`. 3 integration tests; the 3 existing CLI tests pass unchanged. | `src/run.js`, `bin/claude-doc-sync.js`, `test/integration/run.edge.test.js` |
| T6 Run-level P2/P3 | 2 new tests: unresolved repeated token gives `0 / 1` and `Not Found` x3; spaced token left literal and not counted. They pin existing behaviour. | `test/integration/run.edge.test.js` |
| T7 README | Notes on strict tokens, `N / M` meaning, BOM, non-string versions, enclosing-repo behaviour, hard-link limitation. Fixed the "no devDependencies" sentence (Q-B) and the Design links to `generatedDocs/` (Q-C). | `README.md` |
| T8 Verification | Full `npm test` below; changed-file list matches the plan. | none |

## Test results (real output of `npm test`)

```
ℹ tests 142
ℹ pass 141
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
```

Baseline was 125 pass. After T1-T3 the run was 131 tests, 131 pass, 0 fail. New tests total 17 (3+1 BOM, 3 non-string, 5 `samePath`, 3 guard, 2 run-level), matching the minimums in Q-E. The 1 skipped test is the `samePath` symlink case (`cannot create symlink here (EPERM)`), a Windows-privilege limit planned for in the plan; symlink canonicalisation is NOT exercised on this machine. The existing CLI spelling test covers `.`/`..` path spellings only, not symlinks. The symlink test is expected to run on the Ubuntu CI runner (result: Not Found until CI runs). `npm run test:e2e` was not run: `demo.html` and its inputs were not touched and the plan says it is not required (browser setup status: Not Found).

## Deviations from the plan (recorded)

1. T4 said the CLI would import `samePath` from the new module at the end of T4. Because T5 removes the CLI's check (Q-D), the CLI never imports it; the helper was deleted from the CLI in the same step. End state is the same as the plan's T5 end state.
2. The CLI keeps a one-line comment where the check was. The message string now exists only in `src/run.js` (single source of truth).
3. Docs kept consistent: `generatedDocs/requirements.md` FR-6 and `generatedDocs/architecture.md` (error table row, FR-6 trace row) now say the guard lives in `run()`. `design-review.md` is a historical record of findings and was not edited (its line references to the old CLI location are now stale by design).
4. `design-review.md`, `architecture.md` and `requirements.md` already had uncommitted modifications before this step (from earlier steps); this step only touched the two lines above in the latter two.

## Open questions

- None blocking. For Step 6: `package.json` `files`/build scripts and `features/placeholder-sync.feature` / `generatedDocs/test-cases.md` were not reviewed for references to the moved CLI check (Not Found).
- Line-ending warnings (`LF will be replaced by CRLF`) appear from git on this Windows checkout; no change made.

## Skills applied
- placeholder-verifier: re-checked the two resolver-layer changes (`readPackageJson` BOM strip, `formatDependencies` type check). Every value still comes only from parsed `package.json`; the changes make the tool stricter (non-string version gives `Not Found`) or tolerant of file encoding only, never inventing a value. Tests assert real source values or `Not Found`, including BOM plus invalid JSON staying `null`.
- git-metadata-reader: not applicable because no change was made to `src/sources/readGitLog.js` or the git resolvers; the only git-related item (enclosing-repo behaviour) is a README note.
