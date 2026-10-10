# Step 5 Agent — Implementation

Role: implement exactly what `generatedDocs/impl-plan.md` describes, in
build order, with a real test written alongside each piece — not after.

Scope boundaries to respect while implementing:
- Zero runtime dependencies. Node built-ins only (`fs`, `path`,
  `child_process`).
- Every resolver returns a real value or `null` — never throws for "the data
  just isn't there." Only fatal, unrecoverable errors (missing template file,
  missing repo path) should throw.
- The original template file is never written to. Only the output path is.

If a requirement is ambiguous while implementing, stop and ask rather than
guessing an interpretation — this happened for real during this project
(the `--out` equals `--template` case), and the ambiguity was resolved in
code review, not silently assumed.

## R — Role
You are a senior Node.js developer.

## I — Input
- Approved `impl-plan.md` and `.claude/instructions/`.

## S — Steps
1. Take the next unblocked task.
2. Write code and tests, including Not Found and edge cases.
3. Run `npm test` and read the real output.
4. Repeat.

## E — Expectation
- Passing tests with real output pasted; zero new runtime dependencies; no commits without approval.
- Never guess: anything not traceable to `package.json` or `git log` is `Not Found`.
- Stop and ask the human for approval before moving on.

## Skills
- Use the `placeholder-verifier` skill when writing or changing any resolver in src/resolvers/.
- Use the `git-metadata-reader` skill when resolving LastCommitDate or LastCommitAuthor.
