# Verification Report - claude-doc-sync (SCRUM-1, Step 7)

Status: APPROVED by the user (Step 7), proceeding to Step 8 (pull request, prepare-only). User decisions: Playwright browsers not installed, e2e stays Not Found; AC-6 accepted as "verified by inspection" until the first CI run; overwrite of the old report confirmed. Nothing committed, pushed, or written to Jira/Confluence. Acceptance criteria are from `generatedDocs/requirements.md` section 7. Anything not traceable to `package.json`, `git log`, or output run here is `Not Found`.

## Environment

- Node.js v24.19.0, Windows 11, Git Bash. Branch `feature/implementation`, HEAD `fb5fff3` (working tree has uncommitted changes, listed in `code-review.md`).
- Step 6 is approved. Review fixes applied before verifying (docs and test escapes only, no behaviour change): R1 `architecture.md`, R2 `design-review.md` (F1 "Resolved in Step 5" note), R3 `test-cases.md`, R5 BOM escape `'﻿'` in `test/unit/sources.test.js` (3 lines) and `test/integration/run.edge.test.js` (1 line), R6 `implementation.md` wording, R7 Known Limitation in `README.md`, `requirements.md` (A4) and a `design-review.md` addendum. R4 and R8: no action.

## Automated tests (real output)

`npm test` run after all fixes:

```
tests 142
pass 141
fail 0
cancelled 0
skipped 1
todo 0
```

- The count is identical to the Step 5/6 count (142 / 141 / 1), so the R5 escape change did not alter behaviour; the 4 BOM tests still pass.
- The 1 skipped test is `samePath: a symlink to the same file is true` (`cannot create symlink here (EPERM)`, a Windows privilege limit). Symlink canonicalisation is therefore NOT exercised locally. Whether it passes on the Ubuntu runner: Not Found (CI has not run).
- `npm run test:e2e`: NOT RUN successfully. It was attempted and failed with `browserType.launch: Executable doesn't exist ... npx playwright install` (browsers not installed; extra setup needed). This is an environment gap, not evidence of a demo defect. `demo.html` is untouched by the diff. Demo check status: Not Found.

## CLI end-to-end (real runs; output files in the scratchpad)

| Case | Command (abridged) | Result |
|---|---|---|
| This repo | `--template templates/project-doc.template.md --repo . --out <scratch>/self.md` | stdout `8 / 10 placeholders found.`, exit 0 |
| Non-git dir | `--repo <scratch>/nogit` (empty dir) | `0 / 10 placeholders found.`, exit 0, every value `Not Found` |
| Missing template | `--template <scratch>/nope.md` | `Error: template file not found: ...`, exit 1, no output file created |
| Missing repo | `--repo <scratch>/none` | `Error: repo path not found or not a directory: ...`, exit 1 |
| `--out` == `--template` | same path | `Error: --out must not be the same path as --template (the template is never modified)`, exit 1 |
| `--out` == `--template`, other spelling | `t.md` vs `./../work/T.MD` | same error, exit 1 |

Template integrity: SHA-256 of `templates/project-doc.template.md` and of the scratch template copy is `886e5a90...27cf` both before and after all runs (byte-identical). `git status` shows no change to `templates/`.

### Placeholder value check (placeholder-verifier)

Values from the run against this repo, each traced to its source:

| Placeholder | Output | Source check | Result |
|---|---|---|---|
| ProjectName | `claude-doc-sync` | `package.json` `name` | Matches |
| Description | the `description` text | `package.json` `description` | Matches |
| MainEntryPoint | `src/run.js` | `package.json` `main` | Matches |
| Dependencies | `Not Found` | `package.json` has no `dependencies` | Correct |
| DevDependencies | `@playwright/test@^1.47.0` | `package.json` `devDependencies` | Matches |
| TestCommand | `node --test` | `package.json` `scripts.test` | Matches |
| Author | `Not Found` | `package.json` has no `author` | Correct (genuinely absent) |
| License | `MIT` | `package.json` `license` | Matches |
| LastCommitDate | `2026-10-15T18:07:52+05:30` | `git log -1 --format=%cI` | Matches |
| LastCommitAuthor | `Chetna Deshwal` | `git log -1 --format=%an` | Matches |

8 filled + 2 honest `Not Found` = 8 / 10, consistent with the printed summary. The non-git run confirmed no value leaks from another source: all 10 are `Not Found`.

## Acceptance criteria

| AC | Criterion | Verdict | Evidence |
|---|---|---|---|
| AC-1 | 10 placeholders resolve from `package.json` and git per section 5 | PASS | Table above (8 values traced to source); resolver unit tests and integration test "all ten placeholders resolve on a complete repo" in the 141 passing tests |
| AC-2 | Unverifiable values render exactly `Not Found` | PASS | `Author` and `Dependencies` in this repo; all 10 in the non-git dir; unit tests for null sources |
| AC-3 | Template never modified, including `--out` == `--template` | PASS (local) | Hashes identical before and after; both same-path spellings exit 1; 3 `run()` guard tests and 3 CLI tests pass. Limits: hard links not detected (accepted, README); symlink test skipped locally (Ubuntu CI result: Not Found) |
| AC-4 | Summary line printed | PASS | `8 / 10 placeholders found.` and `0 / 10 placeholders found.` on stdout |
| AC-5 | `npm test` passes | PASS | 142 tests, 141 pass, 0 fail, 1 skipped (EPERM symlink) |
| AC-6 | CI workflow runs `npm test` on PRs and pushes | NOT FOUND (partial) | By reading `.github/workflows/ci.yml`: triggers `push` on `[main, master]` and `pull_request`; job step runs `npm test` on ubuntu and windows, Node 20 and 22. The file is modified and uncommitted, and no CI run on `master` exists to check, so actual CI behaviour cannot be confirmed locally |

## Known limitations carried to the PR

- R7: `dependencies: ["a"]` renders `0@a` (README, `requirements.md` A4; no code change).
- Hard links not detected by the overwrite guard (R8, accepted); win32 case-insensitive path compare (accepted).
- Symlink guard test skipped on Windows; expected on Ubuntu CI (Not Found until CI runs).
- Playwright demo test not run here (browsers not installed).

## Verdict

PASS for AC-1 to AC-5 on this machine. AC-6 is Not Found (verified by inspection of the workflow only). No failures, no regressions from the Step 6 fixes.

## Open questions for the user

1. Install Playwright browsers (`npx playwright install`) and run `npm run test:e2e` before the PR, or accept the demo check as Not Found (the CI `e2e` job would run it)?
2. AC-6: accept "verified by inspection" for the PR, with the first CI result reported after the push?
3. The tracked `generatedDocs/verification-report.md` was overwritten (the previous version described an older state). Confirm that is intended.
4. A failed e2e attempt may leave a Playwright `test-results/` folder; `git status` showed no new untracked entry from it.

## Skills applied
- placeholder-verifier: traced every filled value from the real CLI run against this repo (8 values) to `package.json` fields or `git log` output, and confirmed `Author` and `Dependencies` are `Not Found` because the source fields are absent; confirmed all 10 are `Not Found` in a non-git empty dir. Result: all matches, no guessed values; CI on `master` and e2e status marked `Not Found`.
