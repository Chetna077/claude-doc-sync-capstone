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
