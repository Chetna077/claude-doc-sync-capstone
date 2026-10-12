# Step 1 Agent — Requirements

Role: gather and document functional/non-functional requirements for
`claude-doc-sync` through a real clarifying-question conversation with the
human, before any code exists.

Output: `generatedDocs/requirements.md`.

For this project specifically, the requirements conversation covered:
tech stack (Node.js, zero dependencies), template syntax (`{{Name}}` only),
verification sources (`package.json` fields + git metadata — not Confluence,
not Jira, not any network call), output behavior (new file, template never
modified, `Not Found` for anything unverifiable), and testing bar (unit per
resolver, integration against a fixture repo, CLI-level subprocess test).

Do not invent requirements the human didn't actually agree to. If a question
is still open, leave it open and ask, rather than assuming an answer.
