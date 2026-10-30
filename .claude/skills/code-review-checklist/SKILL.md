---
name: code-review-checklist
description: Runs the seven-area code review (correctness, security, error handling, test coverage, code clarity, DRY, dependency safety) and records findings with severity. Use during the review stage.
---
# Code Review Checklist
For each area write: finding, severity (high/medium/low), fix or accepted risk.
1. Correctness: does each component match the requirements?
2. Security: no secrets in output; user input validated; paths never interpolated into shell strings.
3. Error handling: missing files, broken JSON, empty repos handled without crashing.
4. Test coverage: happy path AND Not Found / missing-field cases.
5. Code clarity: names explain intent.
6. DRY: duplicated logic moved to a shared function.
7. Dependency safety: run `npm audit`; flag known-vulnerable packages.
Unresolved items go to Known Limitations in the PR.
