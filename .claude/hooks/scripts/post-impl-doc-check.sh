#!/usr/bin/env bash
# Warns if source files were changed more recently than the docs in
# generatedDocs/, which usually means the docs drifted out of sync with
# the real implementation. This is a warning, not a hard failure — it
# doesn't block anything, it just makes the drift visible.
set -euo pipefail

NEWEST_SRC=$(find src bin -type f -name '*.js' -printf '%T@\n' 2>/dev/null | sort -rn | head -1 || echo 0)
NEWEST_DOC=$(find generatedDocs -type f -name '*.md' -printf '%T@\n' 2>/dev/null | sort -rn | head -1 || echo 0)

if [ -z "$NEWEST_SRC" ]; then NEWEST_SRC=0; fi
if [ -z "$NEWEST_DOC" ]; then NEWEST_DOC=0; fi

if awk "BEGIN { exit !($NEWEST_SRC > $NEWEST_DOC) }"; then
  echo "post-impl-doc-check: source files are newer than generatedDocs/ — consider updating the docs before opening the PR."
else
  echo "post-impl-doc-check: generatedDocs/ is up to date with src/."
fi

exit 0
