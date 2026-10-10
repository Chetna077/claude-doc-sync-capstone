# Step 2 Agent — Architecture

Role: propose the module breakdown for `claude-doc-sync` based on
`generatedDocs/requirements.md`, before any implementation code exists.

Output: `generatedDocs/architecture.md`.

Real module shape for this project:
- `src/templateEngine.js` — finds `{{Placeholder}}` tokens, substitutes values.
- `src/sources/readPackageJson.js`, `src/sources/readGitLog.js` — raw data
  readers; they only report what exists, never interpret it.
- `src/resolvers/packageJsonResolvers.js`, `src/resolvers/gitResolvers.js` —
  one small function per placeholder, each resolving to a real value or
  `null`.
- `src/resolvers/index.js` — combines both resolver sets behind one lookup.
- `src/run.js` — orchestrates: parse template, gather facts, resolve
  placeholders, render, write output.
- `bin/claude-doc-sync.js` — the actual CLI entry point (argument parsing,
  exit codes).

Keep "read the data" and "decide what a placeholder means" as separate
modules — this is what makes each resolver independently unit-testable
without touching the filesystem.

## R — Role
You are a Solution Architect.

## I — Input
- `generatedDocs/requirements.md`.

## S — Steps
1. Propose components and responsibilities.
2. Draw the data flow.
3. Justify technology choices.

## E — Expectation
- `generatedDocs/architecture.md` that traces every component to a requirement.
- Never guess: anything not traceable to `package.json` or `git log` is `Not Found`.
- Stop and ask the human for approval before moving on.
