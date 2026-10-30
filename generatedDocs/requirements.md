# Requirements - claude-doc-sync (SCRUM-1)

Status: APPROVED (Step 1) - the human resolved all 5 open questions (section 10). Source of truth: the human's answers to the clarifying questions (the agent did not read Jira; the human supplied the story). Placeholder table verified against `src/resolvers/` and `src/sources/`.

## 1. Story

- Key: SCRUM-1 (existing Jira issue, reused; no duplicate created). Link: https://chetnadeshwal24.atlassian.net/browse/SCRUM-1.
- How the story was supplied: the human gave the story and the Jira link to the pipeline in chat; the Step 1 agent did not fetch it through the Atlassian MCP. The clarifying questions and the human's answers are recorded in `clarifying-qa.md`. The SCRUM-1 issue was updated afterwards (title, description and acceptance criteria) so that Jira matches this document.
- Summary: Build the `claude-doc-sync` CLI. It reads a Markdown template with `{{Placeholder}}` tokens, verifies each value against real sources, and writes a new filled file.
- Change type: the original build of the tool itself, not a change to other work.
- Business value: developers and tech leads get project documentation that is never stale or wrong, because every value is traceable to a real source.
- Users: developers, tech leads.

## 2. Scenarios

| # | Scenario | Expected result |
|---|---|---|
| S1 | Happy path: valid template and repo | Output file written, `N / M placeholders found.` printed, exit 0 |
| S2 | Template file missing | Error message, exit non-zero |
| S3 | Repo path missing / not a directory | Error message, exit non-zero |
| S4 | `package.json` missing or broken (invalid JSON) | Affected placeholders render `Not Found`, exit 0 |
| S5 | Path is not a git repo (or no commits, git unavailable) | Git placeholders render `Not Found`, exit 0 |
| S6 | `--out` equals the template path | Template is not modified (see FR-6) |

## 3. Scope

In: the 10 placeholders, the CLI, the summary line, the exit codes, and CI (GitHub Actions running `npm test`).
Out: AI/LLM guessing, network calls, non-Markdown templates, monorepos / multi-package, performance targets, the `package.json` scripts `build`, `deploy:local` and `release` (Step 2 decision), hard-link detection for the overwrite check (known limitation), and stricter command-line argument validation (accepted as is).

## 4. Functional requirements

- FR-1: Read a Markdown template and find all `{{Name}}` tokens (strict syntax; no nested paths, defaults or formatting hints).
- FR-2: Resolve the 10 supported placeholders (section 5) from `package.json` fields and git metadata only.
- FR-3: Any value not verifiable renders exactly `Not Found`. This includes unrecognised `{{Token}}` names (not an error) and any failed or empty lookup.
- FR-4: Write the filled result to a new output file. Duplicate tokens all receive the same value.
- FR-5: Print the summary line `N / M placeholders found.` (N = number of distinct token names that resolved to a value, M = number of distinct token names in the template; a name used several times counts once; unrecognised names count in M; text such as `{{ Name }}` that is not an exact `{{Name}}` token is not counted) to stdout. A template with zero tokens yields `0 / 0 placeholders found.` and a copy of the template.
- FR-6: The input template is never modified, including when `--out` equals the template path. Implemented behaviour (Step 5): `run()` (`src/run.js`, using `src/samePath.js`) detects the same path (case-insensitive on Windows, via realpath) and throws before reading or writing anything; the CLI has no check of its own and reports that error with exit 1. Direct callers of `run()` are therefore protected too.
- FR-7: Exit codes: 0 on a completed run regardless of how many placeholders are `Not Found`; non-zero for fatal input errors (missing `--template`, template file not found, repo path not found or not a directory, `--out` same as template, unexpected runtime error).
- FR-8: CLI: `node bin/claude-doc-sync.js --template <template.md> --repo <repo-path> --out <output.md>`. `--repo` defaults to the current working directory. `--out` defaults to `<template-basename>.filled.md` in the current working directory.

## 5. Placeholders and verification rules (verified against code)

| Placeholder | Source | Rule (as implemented) |
|---|---|---|
| `{{ProjectName}}` | `package.json` | `name`, non-empty string |
| `{{Description}}` | `package.json` | `description`, non-empty string |
| `{{MainEntryPoint}}` | `package.json` | `main`; if absent, `bin` (string form, or first entry of object form) |
| `{{Dependencies}}` | `package.json` | `dependencies` as comma-separated `name@version`; missing or empty object gives `Not Found` |
| `{{DevDependencies}}` | `package.json` | `devDependencies` as comma-separated `name@version`; missing or empty gives `Not Found` |
| `{{TestCommand}}` | `package.json` | `scripts.test`, non-empty string |
| `{{Author}}` | `package.json` | `author` string, or `author.name` when an object |
| `{{License}}` | `package.json` | `license`, non-empty string |
| `{{LastCommitDate}}` | git metadata | `git log -1 --format=%cI` in the repo |
| `{{LastCommitAuthor}}` | git metadata | `git log -1 --format=%an` in the repo |

All 10 names, sources and rules match the previous draft (git HEAD) and the code; no discrepancies found. `package.json` placeholders are `Not Found` when the file is missing, unreadable, or invalid JSON. Git placeholders are `Not Found` when the path is not a git repo, has no commits, git is unavailable, or the command fails or exceeds its 5 s timeout.

## 6. Non-functional requirements

- NFR-1: Zero runtime dependencies; Node.js built-ins only (`fs`, `path`, `child_process`).
- NFR-2: Verification sources are `package.json` and `git log` only. No network calls, no AI guessing.
- NFR-3: Deterministic and auditable: every filled value is traceable to a source field or git output.
- NFR-4: Never write to Jira/Confluence, commit, or push without explicit approval (project rules).
- NFR-5: CI (GitHub Actions, `.github/workflows/ci.yml`) runs `npm test` and fails the build when it fails.

## 7. Acceptance criteria

- AC-1: The 10 placeholders resolve from `package.json` fields and git metadata per section 5.
- AC-2: Unverifiable values render exactly `Not Found`.
- AC-3: The input template is never modified, including when `--out` equals the template path.
- AC-4: The summary line is printed.
- AC-5: `npm test` passes.
- AC-6: The CI workflow runs `npm test` on pull requests and pushes (NFR-5).

## 8. Testing bar

- Unit tests: one per resolver, covering found and `Not Found`.
- Integration test: full pipeline against a fixture repo (fixture `package.json`, git history, template), asserting on output content.
- CLI subprocess tests: exit codes, stdout/stderr, including the Not Found cases (missing/broken `package.json`, no git repo) and template-overwrite protection.
- `npm test` must pass.

## 9. Dependencies and flags

- Dependencies: Node.js, and `git` on PATH (otherwise git placeholders are `Not Found`). Playwright is a dev dependency only (for the demo e2e test), not part of the tool.
- Out-of-scope items are listed in section 3.

## 9a. Scope additions (Step 3 decisions, human-approved)

- A1: A leading UTF-8 BOM in `package.json` is ignored when parsing (otherwise all 8 package placeholders would falsely render `Not Found`).
- A2: A `dependencies`/`devDependencies` entry whose version is not a string makes that placeholder `Not Found` (no `[object Object]` output).
- A3: Known behaviour, documented in the README: if `--repo` is a subdirectory of a larger git repository, git placeholders reflect the enclosing repository's last commit.
- A4 (Known Limitation, Step 6 R7, no code change): `dependencies` or `devDependencies` given as an array (for example `["a"]`) renders `0@a` instead of `Not Found`. Pre-existing, outside SCRUM-1 scope, documented in the README.

## 10. Open questions

All resolved by the human at the Step 1 approval:

1. [resolved] Jira link: https://chetnadeshwal24.atlassian.net/browse/SCRUM-1 (added to section 1).
2. [resolved] The summary line keeps the trailing period: `N / M placeholders found.`
3. [resolved] Unrecognised `{{Token}}` names count toward M and render `Not Found` (FR-3, FR-5).
4. [resolved] CI (GitHub Actions running `npm test`) IS in scope for SCRUM-1 (section 3, NFR-5, AC-6).
5. [resolved] Refusing `--out` equal to `--template` with a non-zero exit is correct (FR-6, FR-7).

## Skills applied
- jira-story-readiness: checked new vs existing (existing SCRUM-1, reused), summary, description, business value, scenarios, expected results, affected areas, acceptance criteria, dependencies and out-of-scope items against the human's answers. Result: READY; the 5 open questions were resolved by the human and Step 1 is approved.
- placeholder-verifier: checked all 10 placeholder names, sources and rules against `src/resolvers/` and `src/sources/`; all traceable to `package.json` or `git log`, anything else renders `Not Found`. Result: no discrepancies.
