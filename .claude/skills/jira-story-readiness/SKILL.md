---
name: jira-story-readiness
description: Decides whether the input is a new or existing Jira story, validates completeness and acceptance criteria, and flags dependencies and missing information before requirements are written. Use during intake.
---
# Jira Story Readiness
1. Determine: new requirement or existing story (SCRUM-n)? Reuse an existing story; never create a duplicate.
2. Check the story has: summary, description, business value, preconditions, scenarios, expected result, affected areas, acceptance criteria.
3. List missing items as numbered clarifying questions for the human.
4. Flag dependencies and out-of-scope items.
5. Return: key, link, summary, acceptance criteria, open questions marked `[pending]`.

If this skill conflicts with project-specific instructions or the human's answers, the project instructions win.
