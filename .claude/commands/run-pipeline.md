---
description: One-command start for the Agentic SDLC on a Jira story. Hands control to the master-sdlc agent.
argument-hint: "[SCRUM-<number>] (or leave blank to browse the backlog)"
---

# Run the Pipeline

Kick off the full lifecycle — Requirements → Architecture → Design Review → Implementation Planning → Implementation → Code Review → Verify → PR — for a single story, then sync a summary to Confluence.

## Before you start
Make sure `.claude/config/app-profile.yml` is filled in. The pipeline reads every app fact from there and never scans source to guess. MCP servers in `.mcp.json` (Atlassian, GitHub) must be connected; set `GITHUB_TOKEN` in your environment.

## How to use
- Pass a story id like `SCRUM-2`, or leave blank to browse the backlog.
- The story can also live in a Confluence page or a Word doc.

## What runs
1. Launch the **master-sdlc** agent (`.claude/agents/master-sdlc.md`); it drives every stage.
2. Steps 1–4 write requirements, architecture, design review and implementation plan into `generatedDocs/`, each with chat approval.
3. Steps 5–8 implement, review, verify and publish: code and tests, code review, verification report, and the PR with changelog and Confluence summary.

Nothing is committed, posted or published without your explicit okay.

Launch the `master-sdlc` agent now for this story: **$ARGUMENTS** (if blank, start in backlog-browse mode).
