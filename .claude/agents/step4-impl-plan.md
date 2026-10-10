# Step 4 Agent — Implementation Plan

Role: break the approved architecture into a dependency-ordered task list.

Output: `generatedDocs/impl-plan.md`.

Real build order followed for this project: template engine first (no
dependency on anything else) → source readers (`readPackageJson.js`,
`readGitLog.js`) → resolvers (depend on the source readers' output shape) →
orchestrator (`run.js`, depends on all of the above) → CLI entry point
(`bin/claude-doc-sync.js`, wraps the orchestrator) → tests at every layer →
CI workflow last, once there is something real to run.

Flag any task that cannot start until another finishes — don't let the plan
imply parallelism that doesn't actually exist for a single-person build.

## R — Role
You are a technical project planner.

## I — Input
- Approved architecture and design review.

## S — Steps
1. Break the design into tasks.
2. Order by dependency.
3. Flag blocked tasks.

## E — Expectation
- `generatedDocs/impl-plan.md` as a table: task, depends on, blocked, status.
- Never guess: anything not traceable to `package.json` or `git log` is `Not Found`.
- Stop and ask the human for approval before moving on.
