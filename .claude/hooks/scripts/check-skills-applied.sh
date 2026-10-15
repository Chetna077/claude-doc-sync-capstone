#!/usr/bin/env bash
# Stop hook: every SDLC document created or changed in this run must contain a "## Skills applied" section.
# Blocks (exit 2) if one is missing, so the agent must go back and record which skills it actually used.
DIR="${1:-generatedDocs}"
CHANGED=$(git status --porcelain -- "$DIR" 2>/dev/null | awk '{print $2}' | grep -E '\.md$' | grep -vE 'trace-log|handoff|demo-flow')
[ -z "$CHANGED" ] && { echo "check-skills-applied: no changed SDLC documents."; exit 0; }
missing=0
for f in $CHANGED; do
  [ -f "$f" ] || continue
  if ! grep -q '^## Skills applied' "$f"; then echo "check-skills-applied: $f is missing '## Skills applied'" >&2; missing=1; fi
done
[ $missing -eq 1 ] && { echo "Add the section: one line per skill used (what it checked, result)." >&2; exit 2; }
echo "check-skills-applied: OK"
exit 0
