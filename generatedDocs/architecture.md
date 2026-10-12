# Architecture — claude-doc-sync

## 1. Design Principles

- **Deterministic and auditable**: every resolver is a pure function from
  "repo state on disk" → `string | null`. No heuristics, no fuzzy matching,
  no LLM calls.
- **Zero runtime dependencies**: only Node.js built-ins (`fs`, `path`,
  `child_process`). `node:test` + `node:assert` (built-in) cover testing, so
  `devDependencies` stays empty too.
- **Separation of concerns**: parsing the template, resolving placeholder
  values, and CLI plumbing (argv parsing, exit codes, stdout) are three
  independent layers that can be unit-tested in isolation.
- **Testability**: the piece that does the actual work (`run()`) is a plain
  function that takes explicit arguments and returns a result object — it
  never calls `process.exit` or reads `process.argv` itself. Only the CLI
  entry wrapper touches process-level state, which is what the subprocess
  test exercises end-to-end.

## 2. Module Layout

```
claude-doc-sync/
├── bin/
│   └── claude-doc-sync.js      # thin executable shim: parses argv, calls run(), sets exit code
├── src/
│   ├── run.js                  # orchestrator: reads template, resolves placeholders, writes output
│   ├── templateEngine.js       # {{Placeholder}} tokenizer + substitution
│   ├── resolvers/
│   │   ├── index.js            # registry mapping placeholder name -> resolver function
│   │   ├── packageJsonResolvers.js  # ProjectName, Description, MainEntryPoint,
│   │   │                             # Dependencies, DevDependencies, TestCommand,
│   │   │                             # Author, License
│   │   └── gitResolvers.js     # LastCommitDate, LastCommitAuthor
│   └── sources/
│       ├── readPackageJson.js  # loads + parses package.json, returns null on any failure
│       └── readGitLog.js       # runs `git log -1 --format=...`, returns null on any failure
├── test/
│   ├── unit/
│   │   ├── templateEngine.test.js
│   │   ├── packageJsonResolvers.test.js
│   │   └── gitResolvers.test.js
│   ├── integration/
│   │   ├── fixtures/
│   │   │   └── sample-repo/    # fixture package.json + template + its own tiny git history
│   │   └── run.test.js
│   └── cli/
│       └── cli.test.js         # spawns bin/claude-doc-sync.js as a child process
├── package.json
└── requirements.md / architecture.md / etc.
```

## 3. Data Flow

```
argv --template --repo --out
        │
        ▼
bin/claude-doc-sync.js  (parses argv, validates required args)
        │
        ▼
src/run.js: run({ templatePath, repoPath, outPath })
        │
        ├─► fs.readFileSync(templatePath)              → template text
        ├─► templateEngine.extractPlaceholders(text)     → Set<string> of names
        ├─► for each unique name:
        │        resolvers/index.js[name]?.(repoPath) ?? null
        │        (unregistered name → null, same as a failed lookup)
        ├─► templateEngine.substitute(text, valuesMap)  → output text
        ├─► fs.writeFileSync(outPath, output text)
        └─► returns { total, foundCount, values }  (no process.exit here)
        │
        ▼
bin/claude-doc-sync.js: prints "N / M placeholders found.", sets exit code
```

## 4. Resolver Contract

Every resolver has the signature:

```js
(repoPath: string) => string | null
```

Returning `null` means "could not verify" and the template engine renders
`Not Found`. Resolvers never throw — any internal error (missing file,
malformed JSON, git not installed, non-repo directory) is caught and turned
into `null`. This keeps `run.js` free of per-placeholder error handling.

- `readPackageJson(repoPath)`: reads and `JSON.parse`s
  `<repoPath>/package.json`; returns the parsed object, or `null` if the file
  is missing or invalid JSON. Called once per run and passed into all
  `package.json` resolvers (avoids re-reading the file per placeholder).
- `readGitLog(repoPath, format)`: runs
  `git log -1 --format=<format>` via `child_process.execFileSync` with
  `cwd: repoPath`, `stdio: ['ignore', 'pipe', 'ignore']`; returns trimmed
  stdout, or `null` on any non-zero exit / thrown error (not a repo, no
  commits, git missing).

## 5. Template Engine

- `extractPlaceholders(text)`: regex `/\{\{([A-Za-z0-9_]+)\}\}/g`, returns the
  de-duplicated list of names in first-seen order. Only bare
  `{{Word}}` tokens match — this is intentional per requirements (no nested
  paths, no whitespace inside braces).
- `substitute(text, valuesByName)`: replaces every occurrence of
  `{{Name}}` with `valuesByName.get(name) ?? "Not Found"`. Global
  replacement handles duplicate placeholders automatically since it operates
  on the pattern, not a single match.

## 6. CLI Contract (`bin/claude-doc-sync.js`)

- Flags: `--template <path>` (required), `--repo <path>` (default: `process.cwd()`),
  `--out <path>` (default: `<template-basename-without-ext>.filled.md` next to
  the current working directory).
- Validates `--template` exists and `--repo` exists before calling `run()`;
  prints `Error: ...` to stderr and exits `1` on failure.
- On success: prints `${found} / ${total} placeholders found.` to stdout and
  exits `0`.
- Unknown/unregistered placeholder names in the template are not an error —
  they resolve to `Not Found` like any other unverifiable value (per
  requirements §7).

## 7. Why This Shape

- Splitting `run()` from the `bin/` shim makes the integration test
  independent of process exit codes and stdout — it can call `run()` directly
  and assert on the returned object and the written file.
- The `bin/` shim is still covered separately by the CLI subprocess test,
  which is the only place that verifies actual exit codes and printed output
  match what a real user would see.
- Centralizing all `package.json` reads through `readPackageJson` (called once,
  cached in `run.js`, passed to resolvers) avoids reading/parsing the file
  once per placeholder.

## Skills applied
_Recorded in the skills-enforcement pass: each skill was checked against this document after it was written._
- placeholder-verifier: resolvers return a value only when verified from files or git.
- git-metadata-reader: git facts are read from real repo history, with a no-git fallback.
