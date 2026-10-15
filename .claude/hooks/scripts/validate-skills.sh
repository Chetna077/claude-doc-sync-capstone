#!/usr/bin/env bash
# Proves skills are wired: every skill has valid frontmatter, and every skill an agent names exists.
ROOT="${1:-.claude}"; SK="$ROOT/skills"; AG="$ROOT/agents"; fail=0
for d in "$SK"/*/; do
  n=$(basename "$d"); f="$d/SKILL.md"
  [ -f "$f" ] || { echo "FAIL: $n has no SKILL.md"; fail=1; continue; }
  grep -q "^name: $n$" "$f" && grep -q '^description: ' "$f" || { echo "FAIL: $n frontmatter invalid"; fail=1; }
done
for a in "$AG"/*; do
  for s in $(grep -o 'Use the `[a-z-]*` skill' "$a" | sed 's/Use the `\(.*\)` skill/\1/'); do
    [ -f "$SK/$s/SKILL.md" ] || { echo "FAIL: $(basename "$a") references missing skill $s"; fail=1; }
  done
done
for d in "$SK"/*/; do n=$(basename "$d"); grep -rq "\`$n\` skill" "$AG" || { echo "WARN: skill $n is not used by any agent"; }; done
[ $fail -eq 0 ] && echo "validate-skills: OK ($(ls "$SK" | wc -l) skills, all referenced skills exist)"
exit $fail
