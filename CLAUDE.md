# claude-doc-sync

A Node.js CLI that reads a Markdown template full of `{{Placeholder}}`
tokens, verifies each one against real, inspectable sources (`package.json`
fields, `git log` metadata), and writes a new filled document. Anything it
can't verify is rendered as the literal text `Not Found` — it never
guesses. Zero runtime dependencies.

## Key commands

```bash
npm install        # dev dependency only (Playwright); the tool itself needs nothing
npm test            # unit + integration + CLI subprocess tests (node --test)
npm run test:e2e    # Playwright test against demo.html
npm run test:all    # both of the above
node bin/claude-doc-sync.js --template <template.md> --repo <repo-path> --out <output.md>
```

## Project layout

- `src/templateEngine.js` — finds and substitutes `{{Placeholder}}` tokens.
- `src/sources/` — raw readers (`package.json`, `git log`); report facts only.
- `src/resolvers/` — one small function per placeholder, resolves to a real
  value or `null`.
- `src/run.js` — orchestrates the full pipeline.
- `bin/claude-doc-sync.js` — CLI entry point.
- `templates/project-doc.template.md` — the shipped example template.
- `demo.html` — a real before/after: raw template next to the actual filled
  output from running this tool against its own repo.
- `generatedDocs/` — every SDLC phase's artifact (requirements, architecture,
  design review, implementation plan, code review, verification report).
- `.claude/agents/` — one agent definition per SDLC step this project
  actually followed.
- `.claude/skills/` — `placeholder-verifier` and `git-metadata-reader`,
  matching this tool's two real verification sources.
- `.claude/hooks/` — pre-commit secret scan, post-implementation doc-drift
  check.

## Conventions

See `.claude/instructions/coding-conventions.md` and
`.claude/instructions/security-stance.md` for the full rules. In short:
plain Node.js, zero dependencies, deterministic resolvers only, never modify
the input template.

## Skills, hooks and MCP
- Skills in `.claude/skills/`: `placeholder-verifier`, `git-metadata-reader`, `jira-story-readiness`, `code-review-checklist`, `pr-description-writer`. Each step agent preloads its skills via frontmatter and must end its document with `## Skills applied`.
- Hooks in `.claude/settings.json`: PreToolUse blocks secret commits; PostToolUse and Stop warn on doc drift; Stop blocks a document missing `## Skills applied`; SessionStart validates skills.
- MCP in `.mcp.json`: Atlassian and GitHub (needs `GITHUB_TOKEN`).
- Start the pipeline with `/run-pipeline SCRUM-n`.
