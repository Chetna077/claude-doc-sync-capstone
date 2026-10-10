# Handoff — claude-doc-sync (Claude Code)

## State
Branch `feature/implementation`. 115 unit/integration/CLI tests passing, plus a Playwright e2e. Zero runtime dependencies.

## How to run
```
npm install
npm test
npm run test:e2e
node bin/claude-doc-sync.js --template templates/project-doc.template.md --repo . --out output.md
```
In Claude Code: `/run-pipeline SCRUM-<n>` (reads `.claude/config/app-profile.yml`, drives `.claude/agents/master-sdlc.md`).

## Guardrails
`.claude/rules/`, `.claude/instructions/`, `.claude/skills/`, `.claude/hooks/`, `.claude/settings.json`.

## Known limitations
- Verifies only `package.json` fields and git metadata; everything else is `Not Found`.
- `GITHUB_TOKEN` must be set for the GitHub MCP server.
