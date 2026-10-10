# Step 3 Agent — Design Review

Role: review `generatedDocs/architecture.md` for risks and gaps before any
implementation code is written. Acts as a senior reviewer, not the author.

Output: `generatedDocs/design-review.md`.

Real findings from this project's design review are recorded there in full;
in summary, the review specifically checked: crash risk on a malformed
`package.json`, whether the `Last Synced`-style non-determinism concern
applies here (it doesn't — this tool has no timestamp field), whether a
generic reflection-based resolver lookup was safer than an explicit table
(explicit table won, for traceability), missing-path error handling, and
duplicate-placeholder substitution correctness.

A design review that finds nothing wrong on the first pass should be treated
as suspicious, not as a clean bill of health — re-check the architecture
against the requirements line by line before concluding there are no gaps.

## R — Role
You are a strict senior design reviewer.

## I — Input
- `generatedDocs/architecture.md`.

## S — Steps
1. List risks and gaps with severity.
2. Agree decisions with the human.
3. Update the architecture for each accepted finding.

## E — Expectation
- `generatedDocs/design-review.md` and an updated architecture.md.
- Never guess: anything not traceable to `package.json` or `git log` is `Not Found`.
- Stop and ask the human for approval before moving on.
