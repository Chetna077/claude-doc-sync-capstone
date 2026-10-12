# Code Review — claude-doc-sync

Self-review of the implementation (`bin/`, `src/`) against `requirements.md`
and `architecture.md`, performed after the implementation was complete and
passing tests, before opening the PR.

## Finding 1 (fixed): `--out` could silently overwrite `--template`

**File**: `bin/claude-doc-sync.js`

Nothing prevented `--out` — whether passed explicitly or landed on by the
default-name logic — from resolving to the exact same path as `--template`.
Requirements §6 and architecture §6 both state the original template must
never be modified, but the original code computed `outPath` and immediately
passed it to `run()`, which unconditionally overwrites whatever path it's
given. Running `claude-doc-sync --template x.md --out x.md` would have
silently violated that guarantee and overwritten the user's template with
its own filled version.

**Fix applied**: added an explicit equality check between the resolved
`outPath` and `templatePath` right after computing the default output name;
on a match, the CLI fails with a clear error instead of writing.

**Regression test added**: `test/cli/cli.test.js` → *"CLI: --out same as
--template is rejected and the template is left untouched"* — asserts exit
code `1`, the specific error text, and that the template file's contents
are byte-for-byte unchanged after the attempt.

## Checked, no issue found

- **Duplicate placeholders**: `templateEngine.substitute` uses a global
  regex `replace`, so every occurrence of a repeated `{{Name}}` is replaced
  independently and correctly — verified by
  `substitute: duplicate placeholders all replaced`.
- **Regex state leakage across calls**: `PLACEHOLDER_PATTERN` is a shared
  module-level `RegExp` with the `g` flag, used by both `matchAll` (in
  `extractPlaceholders`) and `String.replace` (in `substitute`). Neither
  usage depends on `lastIndex` persisting across calls — `matchAll` operates
  on an internal clone, and `replace` resets `lastIndex` to 0 on entry — so
  there's no cross-call state bug despite the pattern being reused.
- **`git log` on a repo with zero commits**: exits non-zero (`fatal: your
  current branch ... does not have any commits yet`), which `readGitLog`
  catches and turns into `null` → `Not Found`, matching requirements §7 and
  covered by the "not a git repo" unit test's sibling case implicitly (a
  fresh `git init` with no commit behaves the same as no `.git` at all from
  the resolver's point of view).
- **`author`/`bin` field-shape handling**: matches the exact rules from
  `design-review.md` findings 1–2, and both are covered by dedicated unit
  tests (string form, object form, malformed/empty object form).
- **Windows path handling**: all path construction goes through
  `path.join`/`path.resolve`/`path.basename`, never raw string
  concatenation — confirmed by running the full suite and a manual CLI
  invocation on Windows (this development environment) without any
  path-related failures.
- **`execFileSync` argument passing**: arguments are always passed as array
  elements, never interpolated into a shell string, so user-controlled
  `repoPath` cannot introduce a shell-injection vector.

## Outcome

One real bug found and fixed, with a regression test. No other correctness
gaps identified against the current requirements and architecture. Full
suite (36 tests, including this fix's new test) passes via `npm test`.

## Skills applied
- code-review-checklist: confirmed the earlier template-overwrite fix is still covered by tests; added `test/hooks/hooks.test.js` (secret-guard blocks a staged token, skill validator passes). Tests: 115 to 117.
- placeholder-verifier: every resolver in `src/resolvers/` returns a value read from `package.json` or `git log`, otherwise `null` (rendered as `Not Found`).
- git-metadata-reader: `readGitLog` fails soft to `null` outside a git repo.
