---
name: placeholder-verifier
description: Checks whether a candidate value for a {{Placeholder}} token is actually traceable to a real source before it gets accepted, instead of trusting it at face value.
---

# Placeholder Verifier

Given a placeholder name and a candidate value, confirm the value genuinely
came from one of this project's two authoritative sources before it's
written to the output document:

1. **`package.json` fields** — the value must be read directly from a
   parsed `package.json`, not inferred or reformatted from something else.
2. **Git metadata** — the value must come directly from a real `git log`
   invocation against the target repo, not assumed from file timestamps or
   any other proxy.

If a candidate value cannot be traced to one of these two sources, the
correct output is the literal string `Not Found` — never a best guess, and
never a value carried over from a different repo or a previous run.

## When to use this skill

Any time a resolver in `src/resolvers/` is being written or reviewed, and
any time `generatedDocs/code-review.md` needs to check whether a specific
field's value is actually justified by real data.
