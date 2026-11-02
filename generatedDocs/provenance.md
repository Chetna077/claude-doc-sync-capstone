# Provenance - which tool did what (claude-doc-sync, SCRUM-2)

This page records, step by step, which tool produced each part of this project and where the evidence is.
It is a plain record, written 2 Nov 2026. Commit counts are as of that date.

## Who did what

| Part | Tool used | Human approval | Evidence |
|---|---|---|---|
| Steps 1 to 8 of the pipeline (requirements, architecture, design review, plan, implementation, code review, verification, PR text) | Claude Code, `/run-pipeline SCRUM-2` (master-sdlc agent and step agents) | Chetna Deshwal approved each step in the terminal | `generatedDocs/trace-log.md`, `generatedDocs/clarifying-qa.md` |
| Claude Code layer: agents, skills, rules, hooks, templates, `.mcp.json` | Claude Code | Chetna Deshwal reviewed each change | `.claude/` |
| Commits | Claude Code co-authored 37 of the 38 commits on the feature branch; every one carries `Co-Authored-By: Claude`, which the organization requires | Chetna Deshwal made and pushed the commits | `git log` |
| PR #2 title and body | Claude Code through the GitHub MCP, with Chetna Deshwal approving each write | Chetna Deshwal reviewed, ticked the checklist and merged | PR #2, merge commit `d9e7a7e` |
| CI | GitHub Actions: 5 of 5 checks passed on the final commit (`0318587`); run #21 on `master` passed | n/a | `.github/workflows/ci.yml`, Actions tab |
| Jira SCRUM-2 summary, description and PR link | Claude Code through the Atlassian MCP, with approval | Chetna Deshwal approved each write | Jira history for SCRUM-2 |
| Jira SCRUM-2 description with tables, and the verification comment (id 10012) | Claude Code through the Atlassian MCP, 2 Nov 2026 | Chetna Deshwal approved each write | Jira history for SCRUM-2 |
| Jira SCRUM-2 status move to Done and the comment "PR #2 merged" (id 10011) | GitHub Copilot Chat through the Atlassian MCP, 2 Nov 2026, because the Claude Code login had expired at that moment | Chetna Deshwal approved the write | Jira history for SCRUM-2 |

## Corrections kept on record

- On 30 Oct 2026 the first Jira writes landed on SCRUM-1 by mistake. SCRUM-1 belongs to the Copilot project (`automated-doc-sync`). They were restored, a correction comment (id 10009) was added on SCRUM-1, and this project uses SCRUM-2. See `generatedDocs/trace-log.md`.
- Older commit messages and an earlier merged PR in this repository still say SCRUM-1. They were not rewritten.

## Keeping the numbers current

`generatedDocs/verification-report.md` carries a marker `<!-- test-count: N -->`. CI runs `scripts/check-doc-counts.js`, which runs `npm test` and fails if the real total differs from the marker. Update the marker and the report together after any change to the tests.
