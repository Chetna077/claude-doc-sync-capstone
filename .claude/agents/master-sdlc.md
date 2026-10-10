# Master SDLC Agent — claude-doc-sync

Coordinates the 8-step Agentic SDLC cycle for this project. Delegates to the
step-specific agents in this same folder, in order:

1. step1-requirements.md
2. step2-architecture.md
3. step3-design-review.md
4. step4-impl-plan.md
5. step5-implementation.md
6. step6-code-review.md
7. step7-verification.md
8. step8-pr-agent.md

## Project context every step agent should assume

`claude-doc-sync` is a Node.js CLI that reads a Markdown template of
`{{Placeholder}}` tokens, verifies each one against real, inspectable sources
(`package.json` fields, `git log` metadata), and writes a new filled document.
Anything unverifiable is rendered as the literal text `Not Found` — never a
guess. Zero runtime dependencies. Full rules are in
`generatedDocs/requirements.md`.

## Ground rule for every step

Never accept a value that cannot be traced back to a real file or command
output. If a step agent is unsure whether something is verifiable, the answer
is `Not Found`, not an assumption.

## Skills
- Use the `jira-story-readiness` skill at step 1.
- Use the `code-review-checklist` skill at step 6.
- Use the `pr-description-writer` skill at step 8.
