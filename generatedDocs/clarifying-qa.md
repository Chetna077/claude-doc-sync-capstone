# Step 1 clarifying questions and answers - claude-doc-sync (SCRUM-2)

Source: section 10 of `requirements.md`, where the human (Chetna Deshwal) resolved each open question at the Step 1 approval. This file lists them in question-and-answer form. It records the decisions, not a word-for-word chat transcript.

| # | Question from the Step 1 agent | Human's answer |
|---|---|---|
| 1 | What is the Jira link for the story? | https://chetnadeshwal24.atlassian.net/browse/SCRUM-2 (added to section 1 of requirements.md) |
| 2 | Should the summary line keep the trailing period? | Yes: `N / M placeholders found.` |
| 3 | Do unrecognised `{{Token}}` names count toward M, and what do they render? | Yes, they count toward M and render `Not Found` (FR-3, FR-5) |
| 4 | Is CI (GitHub Actions running `npm test`) in scope for SCRUM-2? | Yes, in scope (section 3, NFR-5, AC-6) |
| 5 | Should `--out` equal to `--template` be refused with a non-zero exit? | Yes, refuse it (FR-6, FR-7) |

Earlier scoping choices from the requirements conversation (see `.claude/agents/step1-requirements.md`): Node.js with zero runtime dependencies; strict `{{Name}}` syntax; verification only from `package.json` fields and git metadata (no Confluence, Jira or network calls); the output goes to a new file and the template is never modified; anything unverifiable renders `Not Found`; testing bar of unit tests per resolver, an integration test against a fixture repo, and CLI subprocess tests.

## Skills applied
- jira-story-readiness: the questions above come from its readiness check of the story (summary, scope, acceptance criteria, dependencies). Result: all 5 resolved by the human.
