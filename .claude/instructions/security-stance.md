# Security Stance — claude-doc-sync

- No network calls anywhere in this codebase. All verification sources are
  local: `package.json` on disk, `git log` on the local repo.
- No secrets, tokens, or credentials are read, stored, or required by this
  tool — it has no accounts of its own to authenticate.
- User-controlled paths (`--repo`, `--template`, `--out`) are only ever
  passed to `child_process` calls as array arguments, never interpolated
  into a shell string — this closes the shell-injection path a naive
  implementation could otherwise open.
- The tool never writes to its own input (the template file) — only to the
  explicitly requested output path, and it refuses to run if the two
  resolve to the same file.
- The pre-commit hook (`.claude/hooks/scripts/pre-commit-secret-guard.sh`)
  scans staged changes for secret-shaped patterns before every commit.
