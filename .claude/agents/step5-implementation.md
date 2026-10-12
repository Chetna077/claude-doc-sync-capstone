# Step 5 Agent — Implementation

Role: implement exactly what `generatedDocs/impl-plan.md` describes, in
build order, with a real test written alongside each piece — not after.

Scope boundaries to respect while implementing:
- Zero runtime dependencies. Node built-ins only (`fs`, `path`,
  `child_process`).
- Every resolver returns a real value or `null` — never throws for "the data
  just isn't there." Only fatal, unrecoverable errors (missing template file,
  missing repo path) should throw.
- The original template file is never written to. Only the output path is.

If a requirement is ambiguous while implementing, stop and ask rather than
guessing an interpretation — this happened for real during this project
(the `--out` equals `--template` case), and the ambiguity was resolved in
code review, not silently assumed.
