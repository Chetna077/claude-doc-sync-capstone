#!/usr/bin/env bash
# Scans staged changes for patterns that look like accidentally-committed
# secrets (API keys, tokens, private keys). This project makes no network
# calls and has no credentials of its own, so any match here is almost
# certainly something that should never be committed.
set -euo pipefail

PATTERN='(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?i)api[_-]?key["'\'']?\s*[:=]\s*["'\''][A-Za-z0-9]{16,})'

MATCHES=$(git diff --cached -U0 | grep -P "$PATTERN" || true)

if [ -n "$MATCHES" ]; then
  echo "pre-commit-secret-guard: possible secret found in staged changes:"
  echo "$MATCHES"
  echo "Commit blocked. Remove the secret before committing."
  exit 1
fi

echo "pre-commit-secret-guard: no secret patterns found."
exit 0
