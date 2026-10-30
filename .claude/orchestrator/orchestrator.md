# Orchestrator (claude-doc-sync)

Entry point: `/run-pipeline SCRUM-<n>` (`.claude/commands/run-pipeline.md`) starts the `master-sdlc` agent (`.claude/agents/master-sdlc.md`), which is the orchestrator.

## Order of work
1. step1-requirements: reads the Jira story through Atlassian MCP, writes `generatedDocs/requirements.md`.
2. step2-architecture, 3. step3-design-review, 4. step4-impl-plan: write the matching documents.
5. step5-implementation: code and tests.
6. step6-code-review, 7. step7-verification: findings and a real test run.
8. step8-pr-agent: PR description, changelog, Confluence summary.

## Rules
- A human approves every stage before the next starts. Nothing is committed, pushed or posted without a clear yes.
- Every document ends with a `## Skills applied` section.
- Token saving: follow `.claude/rules/token-saving.md`. Hooks in `.claude/settings.json` enforce it (read guard, Atlassian write guard, Atlassian output trimmer).
- Pull request ownership: the dev agent owns the pull request and fixes review comments on the same branch.
