# Implementation Plan — claude-doc-sync

Ordered so each step is independently testable before moving to the next.
Incorporates all resolutions from `design-review.md`.

## Step A — Project scaffolding
- `package.json`: `name: claude-doc-sync`, `private: true`, `bin` entry
  pointing at `bin/claude-doc-sync.js`, `scripts.test: "node --test"`,
  `engines.node: ">=20"`, no `dependencies`/`devDependencies`.
- `.gitignore`: `node_modules/`, editor cruft.

## Step B — Template engine (`src/templateEngine.js`)
- `extractPlaceholders(text)` — regex `/\{\{([A-Za-z0-9_]+)\}\}/g`, returns
  de-duplicated names, first-seen order.
- `substitute(text, valuesByName)` — global replace, `?? "Not Found"` per
  design-review §6.
- Unit tests: no placeholders, one placeholder, duplicate placeholders,
  unregistered placeholder name, adjacent placeholders with no text between.

## Step C — Source readers (`src/sources/`)
- `readPackageJson(repoPath)` — try/catch around read + `JSON.parse`;
  `null` on any failure.
- `readGitLog(repoPath, format)` — `execFileSync('git', ['log', '-1',
  `--format=${format}`], { cwd: repoPath, timeout: 5000, stdio: ['ignore',
  'pipe', 'ignore'] })`; trims stdout; `null` on any thrown error
  (design-review §3).
- Unit tests: missing file, invalid JSON, valid JSON; non-repo dir, repo with
  no commits, repo with a commit (using a temp git repo created in the test).

## Step D — Resolvers (`src/resolvers/`)
- `packageJsonResolvers.js`: `ProjectName`, `Description`, `MainEntryPoint`
  (with `bin` fallback per design-review §2), `Dependencies`,
  `DevDependencies` (format per design-review §7), `TestCommand`, `Author`
  (per design-review §1), `License`. Each takes the already-parsed
  `package.json` object (not a path) so `run.js` reads it once.
- `gitResolvers.js`: `LastCommitDate` (`--format=%cI`), `LastCommitAuthor`
  (`--format=%an`). Each takes `repoPath` directly.
- `index.js`: registry object `{ ProjectName: (ctx) => ..., ... }` where
  `ctx = { pkg, repoPath }`; unifies the two different input shapes above
  behind one call signature so `run.js` doesn't need to special-case them.
- Unit tests per resolver, both found and Not-Found branches.

## Step E — Orchestrator (`src/run.js`)
- `run({ templatePath, repoPath, outPath })`:
  1. Read template text.
  2. Extract placeholder names.
  3. Read `package.json` once (`readPackageJson`).
  4. Resolve each unique name via the registry (unregistered → `null`).
  5. Substitute → output text.
  6. Write output text to `outPath`.
  7. Return `{ total, found, values: Map<name, string|null> }`.
- No `process.exit`, no `console.log` — pure I/O + return value, per
  architecture §3/§7.

## Step F — CLI shim (`bin/claude-doc-sync.js`)
- Parse `--template`, `--repo` (default `process.cwd()`), `--out` (default
  `<basename(template, '.md')>.filled.md` in the current working directory).
- Validate `--template` given and exists; validate `--repo` exists and is a
  directory. Missing `--template` or nonexistent paths → print
  `Error: ...` to stderr, exit `1`.
- Wrap the `run()` call (steps E.1–E.6, including the write) in try/catch
  per design-review §4; any thrown error → `Error: <message>` to stderr,
  exit `1`.
- On success: print `${found} / ${total} placeholders found.`, exit `0`.

## Step G — Integration test (`test/integration/run.test.js`)
- Build a fresh temp dir per test (`fs.mkdtempSync`), write a fixture
  `package.json` + template into it, `git init` + `git config user.*` +
  `git commit` inside it via `execFileSync`, per design-review §5.
- Call `run()` directly (not via subprocess), assert on the returned summary
  and on the written output file's exact content.
- Clean up the temp dir in an `after`/`finally` block even on assertion
  failure.

## Step H — CLI subprocess test (`test/cli/cli.test.js`)
- `child_process.spawnSync(process.execPath, [binPath, ...args])` against a
  temp fixture dir (same construction as Step G, reused via a shared test
  helper).
- Assert exit code `0` and stdout matches `N / M placeholders found.` on a
  valid run.
- Assert exit code `1` and stderr starts with `Error:` when `--template`
  points at a nonexistent file.

## Step I — CI workflow (`.github/workflows/ci.yml`)
- Trigger on `push` and `pull_request`.
- `actions/checkout@v4` → `actions/setup-node@v4` (node 20) → `npm test`.

## Step J — README
- Usage, flags, placeholder table (mirrors requirements §7), example
  before/after.

## Execution Order
A → B → C → D → E → F → G → H → I → J, committing after each logical group
(engine+resolvers, orchestrator+CLI, tests, CI+docs) rather than one giant
commit, so the history reads as a real build-up.

## Skills applied
_Recorded in the skills-enforcement pass: each skill was checked against this document after it was written._
- jira-story-readiness: tasks ordered by dependency and traceable to requirements.
- code-review-checklist: tests planned for edge cases and Not Found paths.
