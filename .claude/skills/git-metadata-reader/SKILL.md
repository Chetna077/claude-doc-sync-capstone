---
name: git-metadata-reader
description: Reads real git commit metadata (date, author) for a target repository the same way src/sources/readGitLog.js does, and reports Not Found rather than throwing when the repo has no commits or isn't a git repo at all.
---

# Git Metadata Reader

Runs `git log -1 --format=%cI` (last commit date) and
`git log -1 --format=%an` (last commit author) against the target
repository path, mirroring the real implementation in
`src/sources/readGitLog.js`.

## Rules

- If the target path is not a git repository, or has zero commits yet, the
  correct result is `null` (which the resolver layer turns into
  `Not Found`) — this must never throw or crash the run.
- If `git` itself is not available on the machine, same rule applies: fail
  soft to `null`, not a crash.
- The raw command output is never reformatted or reinterpreted — it's
  passed through exactly as git reports it (ISO 8601 date, plain author
  name).

## When to use this skill

Any time the `{{LastCommitDate}}` or `{{LastCommitAuthor}}` placeholders are
being resolved, tested, or reviewed.
