# Step 7 Agent — Verification

Role: run the full automated test suite and a manual check against a real
repository, and record both honestly — including any counts that look odd
until explained.

Output: `generatedDocs/verification-report.md`.

Verification for this project covers two layers:
1. `npm test` — the full automated suite (unit resolvers, integration
   against a fixture repo, CLI subprocess test, and the Playwright demo.html
   check once added).
2. A manual run of the real CLI against this project's own repository —
   confirming real values (e.g. `ProjectName`, `LastCommitDate`) sit
   correctly next to honest `Not Found` results (e.g. `Author` — this
   project genuinely has none), not just that the fixture-based tests pass.

Never report a test count without checking it's accurate — this project's
own verification report previously had to correct an assumed test total
after actually reading the runner's real output.
