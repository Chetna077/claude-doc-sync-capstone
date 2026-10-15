# SCRUM-1: claude-doc-sync - harden the placeholder filler and its overwrite guard

Status: DRAFT for human approval. Nothing committed, pushed, opened as a PR, or written to Jira/Confluence.

- Jira: https://chetnadeshwal24.atlassian.net/browse/SCRUM-1
- Base branch: `master`
- Head branch: `feature/implementation`
- Repository: https://github.com/Chetna077/claude-doc-sync-capstone (from `git remote -v`)

---

## PR body (copy from here)

## Summary

claude-doc-sync reads a Markdown template of `{{Placeholder}}` tokens, verifies each against `package.json` and `git log`, and writes a filled copy, rendering anything unverifiable as `Not Found`. This change closes the gaps found in the Step 6 code review: the "never overwrite the template" guard now lives in `run()` and compares real paths (symlinks, other spellings), a UTF-8 BOM no longer makes `package.json` unreadable, a non-string dependency version no longer renders a bogus value, and a repeated token is counted once. Requirements, architecture, review and verification artifacts are in `generatedDocs/`.

## Changes Made

Source:
- `src/samePath.js` (new): realpath-based path comparison, case-insensitive on win32. Moved out of `bin/` so the guard can be reused and tested.
- `src/run.js`: `run()` now throws if `outPath` is the same file as `templatePath`, before anything is read or written.
- `bin/claude-doc-sync.js`: removed the inline `samePath`; the CLI relies on the `run()` guard and reports its error (exit 1).
- `src/sources/readPackageJson.js`: ignores a single leading UTF-8 BOM before `JSON.parse`.
- `src/resolvers/packageJsonResolvers.js`: `dependencies` / `devDependencies` resolve to `Not Found` for the whole field if any version is not a string.

Tests:
- `test/unit/samePath.test.js` (new): identical path, different spelling, nonexistent paths, win32 case-only difference, symlink (skipped locally).
- `test/unit/sources.test.js`, `test/unit/packageJsonResolvers.edge.test.js`, `test/integration/run.edge.test.js`: BOM, non-string version, repeated-token and `--out` == `--template` cases (the BOM character is written as an escape in the tests).

CI and docs:
- `.github/workflows/ci.yml`: `push` trigger now `[main, master]` (was `[main]`) so CI runs on this repo's `master`.
- `README.md`: documents token rules, BOM handling, non-string versions, the enclosing-repo behaviour and the known limitations; fixes `generatedDocs/` links and the dependency statement (the only devDependency is `@playwright/test`).
- `generatedDocs/`: `requirements.md`, `architecture.md`, `design-review.md`, `impl-plan.md`, `code-review.md`, `test-cases.md`, `verification-report.md` rewritten or updated for SCRUM-1; `implementation.md` (new); `pr-description.md` (new, this file).

Scope note, the branch carries earlier, unrelated commits. `git log origin/feature/implementation..HEAD` lists six commits not yet on the remote head branch, all about token saving, not about SCRUM-1:
- `c4cd399` feat: token-saver hooks (read guard and Atlassian output trimmer)
- `dafabbc` feat: token-saving rule, Atlassian write guard and agent wiring
- `3d02015` docs: add orchestrator.md and pull request ownership rule
- `54af595` feat: stop images and base64 data from wasting tokens
- `5e75cf3` feat: trimmer logs every Atlassian call to token-usage.log
- `fb5fff3` fix: tests must not write to the real token-usage.log

Their diff (15 files, 318 insertions, under `.claude/`, `.gitignore`, `test/hooks/`) is not part of SCRUM-1. Also, `origin/master` is at `009d0d4`, so a PR against `master` shows 26 commits (`git log origin/master..HEAD`), including all earlier pipeline work, not only this change.

## Test Evidence

Real output of `npm test` (`node --test`), run in Step 8 after the last doc edit, exit code 0. Only the summary and the one skipped line are shown; the full run printed 142 test lines.

```
﹣ samePath: a symlink to the same file is true (2.0757ms) # cannot create symlink here (EPERM)
ℹ tests 142
ℹ suites 0
ℹ pass 141
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 3652.6528
```

- Skipped: `samePath: a symlink to the same file is true`, because this Windows machine cannot create symlinks (EPERM). Symlink handling is NOT exercised locally. Ubuntu CI result: Not Found until CI runs.
- e2e: NOT RUN. `npm run test:e2e` was attempted in Step 7 and failed with `browserType.launch: Executable doesn't exist ... npx playwright install`. By the user's decision the Playwright browsers are not installed, so the demo check is Not Found here (the CI `e2e` job would run it). `demo.html` is untouched by this diff.
- AC-6 (CI runs `npm test` on PRs and pushes): verified by inspection only, until the first CI run. `ci.yml` triggers on `push` to `[main, master]` and on `pull_request`, and runs `npm test` on ubuntu and windows, Node 20 and 22. No CI run has been observed.
- AC-1 to AC-5: PASS on this machine, per `generatedDocs/verification-report.md` (8 / 10 placeholders found against this repo, 0 / 10 in a non-git dir, template SHA-256 identical before and after).
- Full report: `generatedDocs/verification-report.md`; traceability: `generatedDocs/test-cases.md`.

## Known Limitations

- Hard links to the template are not detected by the overwrite guard (accepted, README).
- On Windows the path comparison is case-insensitive (accepted); on other platforms it is case-sensitive.
- Symlink guard test is skipped on Windows; its result on Ubuntu CI is Not Found.
- `--repo` that is a subdirectory of a larger git repository reports the last commit of the enclosing repository (README).
- `dependencies: ["a"]` (an array instead of an object) renders `0@a` and is not rejected (R7, README, `requirements.md` A4); only malformed `package.json` files are affected.
- Playwright demo test not run (browsers not installed, by decision); AC-6 verified by inspection only until the first CI run.
- Values not traceable to `package.json` or `git log` render as `Not Found` by design (for this repo: `Author`, `Dependencies`).

## Reviewer Checklist

- [ ] Run `npm test` yourself; expect 142 tests, 141 pass, 0 fail, 1 skipped (symlink, EPERM on Windows)
- [ ] On Linux or macOS, confirm the symlink test `samePath: a symlink to the same file is true` runs and passes
- [ ] Run `npm run test:e2e` after `npx playwright install`, or confirm the CI `e2e` job passes (not run locally)
- [ ] Confirm the first CI run on this PR is green on ubuntu and windows (AC-6 is verified by inspection only)
- [ ] Run the CLI with `--out` equal to `--template`, including a symlink or different spelling; confirm exit 1 and the template unchanged
- [ ] Confirm every filled value in a run against this repo traces to `package.json` or `git log`, and absent fields show exactly `Not Found`
- [ ] Decide whether the six unrelated token-saving commits belong in this PR or should be split out
- [ ] No secrets in the diff
- [ ] `generatedDocs/` matches the code
- [ ] Known Limitations above are acceptable

🤖 Generated with [Claude Code](https://claude.com/claude-code)

---

## Changelog entry (draft, not written to any file; no `CHANGELOG*` file exists in the repo)

```
## [Unreleased] - SCRUM-1
### Fixed
- --out equal to --template is rejected inside run() by real path (symlinks and different spellings); template is never modified.
- A leading UTF-8 BOM in package.json is ignored.
- A non-string version in dependencies or devDependencies makes the whole field Not Found.
- A repeated placeholder counts once in the "N / M placeholders found" summary and is replaced everywhere.
### Changed
- CI triggers on pushes to main and master.
### Known limitations
- Hard links to the template are not detected; dependencies given as an array render oddly (0@a).
```

## Confluence summary (draft, not published; target page: Not Found)

SCRUM-1 claude-doc-sync: built a Node.js CLI that fills {{Placeholder}} tokens from package.json and git log, and renders anything unverifiable as Not Found. Hardened the overwrite guard (real-path comparison inside run()), BOM handling, non-string dependency versions and repeated tokens. npm test: 142 tests, 141 pass, 0 fail, 1 skipped (symlink, EPERM on Windows). e2e not run; AC-6 (CI) verified by inspection until the first CI run. Known limitations: hard links, case-insensitive compare on Windows, subdirectory of a larger repo, dependencies as an array renders 0@a. PR: Not Found (not yet opened).

## Proposed commit (not run)

Message:

```
fix: harden overwrite guard, BOM, non-string versions and repeated tokens (SCRUM-1)

Move the --out == --template check into run() using a real-path samePath,
ignore a leading UTF-8 BOM in package.json, render a non-string dependency
version as Not Found, count repeated tokens once, run CI on master, and
update generatedDocs and README for Steps 1-8.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

Files to stage (exact list, 20 files; from `git status`, plus this file):

```
.github/workflows/ci.yml
README.md
bin/claude-doc-sync.js
generatedDocs/architecture.md
generatedDocs/code-review.md
generatedDocs/design-review.md
generatedDocs/impl-plan.md
generatedDocs/implementation.md
generatedDocs/pr-description.md
generatedDocs/requirements.md
generatedDocs/test-cases.md
generatedDocs/verification-report.md
src/resolvers/packageJsonResolvers.js
src/run.js
src/samePath.js
src/sources/readPackageJson.js
test/integration/run.edge.test.js
test/unit/packageJsonResolvers.edge.test.js
test/unit/samePath.test.js
test/unit/sources.test.js
```

Not staged: `test-results/` and `output.md` (both git-ignored).

## Skills applied
- pr-description-writer: wrote the five sections in order (Summary, Changes Made, Test Evidence, Known Limitations, Reviewer Checklist) from `git status`, `git diff`, `git log origin/feature/implementation..HEAD`, `generatedDocs/*` and a fresh `npm test` (142 / 141 pass / 0 fail / 1 skipped, exit 0). Result: every claim traced to those sources; e2e, Ubuntu symlink result, CI run, Confluence page and PR number are marked Not Found; nothing posted.
