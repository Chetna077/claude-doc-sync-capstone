# Coding Conventions — claude-doc-sync

- Plain Node.js only. No runtime dependencies — every `require` must resolve
  to a Node built-in module (`fs`, `path`, `child_process`).
- Every resolver in `src/resolvers/` returns a value or `null`. Never throw
  for "the data legitimately isn't there" — that's a `Not Found` case, not
  an error. Only throw for genuinely fatal input problems (missing template
  file, missing repo path).
- Source-reading (`src/sources/`) and meaning-deciding (`src/resolvers/`)
  stay in separate files. Don't collapse them — this split is what makes
  each resolver testable without touching the filesystem.
- Never write to the input template path. Only the resolved output path.
- No comments explaining what code does when the naming already makes it
  obvious. Comments are for non-obvious "why," not "what."
