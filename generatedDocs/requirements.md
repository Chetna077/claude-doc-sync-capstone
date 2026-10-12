# Requirements — claude-doc-sync

## 1. Overview

`claude-doc-sync` is a Node.js CLI tool that reads a Markdown template containing
`{{Placeholder}}` tokens, scans a target repository, and fills in every placeholder
it can verify from real, inspectable sources. Any placeholder it cannot verify is
rendered as the literal text `Not Found`. It never guesses.

## 2. Goals

- Deterministic, auditable extraction — every filled value must be traceable to a
  concrete file, command output, or git metadata field.
- Zero runtime dependencies — use only Node.js built-in modules (`fs`, `path`,
  `child_process`, etc.).
- Never modify the input template; always write a new output file.

## 3. Non-Goals

- No AI/LLM-based guessing anywhere in the extraction logic.
- No network calls.
- No support for non-Markdown templates.
- No monorepo / multi-package support — single repo only.
- No hard performance targets — just needs to run reasonably on a typical
  small-to-medium repo.

## 4. Tech Stack

- Node.js, built-in modules only (`fs`, `path`, `child_process` for git commands).
- CLI tool (not a library, no published package exports).

## 5. Inputs

- A single Markdown template file (`.md`) containing zero or more `{{PlaceholderName}}`
  tokens. Placeholder syntax is strict: `{{PlaceholderName}}` only — no nested paths,
  default values, or formatting hints are supported.
- A target repository path to scan (defaults to the current working directory if
  not specified).

## 6. Outputs

- A new Markdown file with every recognized placeholder replaced by its verified
  value, or the literal text `Not Found` if it could not be verified. The original
  template file is never modified.
- A one-line summary printed to stdout at the end of the run, e.g.:
  `8 / 10 placeholders found.`
- Non-zero exit code on fatal errors (e.g., template file missing, target repo path
  does not exist); zero exit code on a successful run, regardless of how many
  placeholders resolved to `Not Found`.

## 7. Supported Placeholders & Verification Rules

Verification rules are deterministic — each placeholder is resolved from exactly
one authoritative source, in a fixed, defined way. If the source is missing,
malformed, or ambiguous, the result is `Not Found`.

| Placeholder | Source | Rule |
|---|---|---|
| `{{ProjectName}}` | `package.json` | `name` field |
| `{{Description}}` | `package.json` | `description` field |
| `{{MainEntryPoint}}` | `package.json` | `main` field (fallback: `bin` if `main` absent) |
| `{{Dependencies}}` | `package.json` | `dependencies` object, rendered as a comma-separated `name@version` list (empty object → `Not Found`) |
| `{{DevDependencies}}` | `package.json` | `devDependencies` object, rendered as a comma-separated `name@version` list (empty object → `Not Found`) |
| `{{TestCommand}}` | `package.json` | `scripts.test` field |
| `{{Author}}` | `package.json` | `author` field (string form only; object form uses `.name`) |
| `{{License}}` | `package.json` | `license` field |
| `{{LastCommitDate}}` | git metadata | `git log -1 --format=%cI` in the target repo |
| `{{LastCommitAuthor}}` | git metadata | `git log -1 --format=%an` in the target repo |

Notes:
- `package.json`-sourced placeholders resolve to `Not Found` if `package.json` is
  missing, unparsable, or the specific field is absent/empty.
- Git-sourced placeholders resolve to `Not Found` if the target path is not a git
  repository, has no commits yet, or the `git` command is unavailable/fails.
- `README.md` is listed as an available verification source for future placeholders
  but no placeholder in the current starter list is sourced from it.
- Any `{{Token}}` found in the template that is not in this table is left as
  literal `Not Found` output (unrecognized placeholders are not errors).

## 8. CLI Behavior

- Invoked as a Node script, e.g.:
  `node src/index.js --template <template.md> --repo <repo-path> --out <output.md>`
- Missing `--repo` defaults to the current working directory.
- Missing `--out` defaults to a sensible generated filename (e.g. `<template-basename>.filled.md`).
- Prints the summary line on success; prints a clear error message and exits
  non-zero on fatal input errors.

## 9. Testing Requirements

- **Unit tests**: one per verification rule (each placeholder's resolver), covering
  both the "found" and "Not Found" cases.
- **Integration test**: runs the full fill pipeline against a small fixture repo
  (fixture `package.json`, fixture git history, fixture template) and asserts on
  the resulting output file content.
- **CLI-level subprocess test**: spawns the actual CLI script as a child process,
  checks exit codes and printed stdout/stderr output, not just internal function
  calls.

## 10. CI Requirements

- GitHub Actions workflow, present from the first commit, that runs `npm test` on
  every push and pull request.

## 11. Edge Cases to Handle

- Template file has zero placeholders → output is just a copy of the template,
  summary reports `0 / 0 placeholders found.`
- Target repo is not a git repository → all git-sourced placeholders are `Not Found`;
  this is not a fatal error.
- `package.json` missing entirely → all package.json-sourced placeholders are
  `Not Found`; this is not a fatal error.
- Duplicate placeholder tokens in the template are all replaced with the same
  resolved value.

## Skills applied
_Recorded in the skills-enforcement pass: each skill was checked against this document after it was written._
- jira-story-readiness: user story and acceptance criteria present.
- placeholder-verifier: requirement that every placeholder resolves from a verified source or `Not Found`.
