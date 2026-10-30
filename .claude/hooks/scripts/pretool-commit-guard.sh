#!/usr/bin/env bash
# PreToolUse(Bash) hook: only runs the secret scan when the command is a git commit.
# Exit 2 blocks the tool call in Claude Code.
INPUT=$(cat)
if echo "$INPUT" | grep -qE '"command"\s*:\s*"[^"]*git commit'; then
  bash "$(dirname "$0")/pre-commit-secret-guard.sh" || exit 2
fi
exit 0
