# Design Review — claude-doc-sync

Self-review of `architecture.md` before implementation. Each finding lists the
gap, the risk it creates, and the resolution applied to the design.

## Findings

### 1. `author` field shape is underspecified
`package.json`'s `author` field can be a string (`"Jane Doe <jane@x.com>"`) or
an object (`{ "name": "Jane Doe", "email": "..." }`). Requirements say "object
form uses `.name`" but the architecture doesn't say what happens if `author`
is present but is neither a string nor has a usable `.name` (e.g. `author: 123`
or `author: {}`).

**Resolution**: `Author` resolver: if `typeof author === 'string'` and
non-empty, use it directly; else if `author` is a non-null object with a
non-empty string `.name`, use that; otherwise `null` (`Not Found`).

### 2. `bin` fallback shape is underspecified
`bin` can be a string or an object of `{ commandName: path }`. Architecture
says "fallback to `bin`" without saying which value to use when `bin` is an
object with multiple entries.

**Resolution**: `MainEntryPoint`: if `main` is a non-empty string, use it.
Else if `bin` is a non-empty string, use it. Else if `bin` is a non-empty
object, use the value of its first key (insertion order). Otherwise `null`.

### 3. No timeout on `git log` subprocess call
`execFileSync('git', ...)` has no timeout set. A pathological repo (e.g. a
git hook that hangs, or a network-mounted `.git` with a slow filesystem)
would hang the whole CLI run indefinitely instead of failing gracefully.

**Resolution**: add `timeout: 5000` to the `execFileSync` call in
`readGitLog`; a timeout is treated the same as any other failure → `null`.

### 4. Output-path write failure would crash with a raw stack trace
`run.js` calls `fs.writeFileSync(outPath, ...)` with no guard. If `--out`
points at a nonexistent directory, this throws `ENOENT` uncaught, and the
user sees a Node stack trace instead of a clean CLI error.

**Resolution**: `bin/claude-doc-sync.js` wraps the entire `run()` call
(including the write) in try/catch; any thrown error is printed as
`Error: <message>` to stderr with exit code `1`. `run.js` itself stays
simple and lets errors propagate — the CLI shim is the single place that
translates exceptions into user-facing output, per the "only the shim
touches process-level state" principle already in the architecture.

### 5. Integration test fixture can't safely be a committed nested git repo
The architecture describes a fixture repo under `test/integration/fixtures/`.
A real nested `.git` directory can't be committed cleanly inside this repo's
own git history (nested repos are either ignored, added as a broken
submodule reference, or silently swallowed depending on how `git add` is
invoked) — this is a real gap, not a style choice.

**Resolution**: the fixture repo is **not** committed as a static directory
with its own `.git`. Instead, the integration test creates a temp directory
at test-run time (`fs.mkdtempSync`), writes a fixture `package.json` and
template into it, runs `git init` + `git commit` in it programmatically, runs
`run()` against it, asserts, then cleans up the temp directory. This is more
robust than a committed fixture anyway — the git history is always fresh
relative to "when the test ran," avoiding any stale-date assertions.

### 6. Placeholder name matching is case-sensitive with no normalization step called out
The regex extracts exactly what's between `{{` and `}}`. If a template author
writes `{{projectname}}` (wrong case), the architecture doesn't say what
happens.

**Resolution**: explicitly case-sensitive, exact match against the resolver
registry keys (`ProjectName`, not `projectname`). A near-miss is treated
identically to any unregistered placeholder: `Not Found`. This matches
requirements §7 ("unrecognized placeholders ... left as literal `Not Found`")
and avoids adding fuzzy-matching logic, which would violate the
no-guessing principle.

### 7. `Dependencies`/`DevDependencies` rendering has no defined separator/order guarantee documented
Architecture says "comma-separated `name@version` list" but doesn't pin the
separator spacing or ordering, which matters for reproducible test
assertions.

**Resolution**: format is `name@version` pairs joined by `, ` (comma +
single space), in the key order `Object.keys()` returns (JSON object
insertion order, which V8 preserves for string keys) — i.e., the order
they appear in `package.json`. This is now a locked contract that unit
tests assert against directly.

### 8. No `engines` constraint despite depending on `node:test`
`node:test` as a built-in stable module needs Node ≥ 18 (and some APIs used
require ≥ 20). Nothing in the architecture pins a minimum Node version, so
`npm test` could fail confusingly on an old Node install.

**Resolution**: add `"engines": { "node": ">=20" }` to `package.json` and
document the requirement in `README.md`. Not a functional risk to the tool
itself, just to test execution.

## Non-Findings (considered, not changed)

- **Windows path separators**: `path.join`/`path.resolve` are used
  throughout instead of string concatenation, so this is already handled
  correctly by construction — no change needed.
- **Security of `execFileSync`**: arguments are passed as an array (not
  through a shell string), so there's no shell-injection surface even though
  `repoPath` is user-controlled. No change needed.

## Outcome

All 8 findings are folded into the implementation plan (`impl-plan.md`) as
explicit line items rather than left as follow-up work.
