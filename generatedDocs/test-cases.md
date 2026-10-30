# Test Cases (Gherkin) and Traceability

Gherkin source: `features/placeholder-sync.feature`. Each scenario is automated by existing tests (Node test runner) or by the Playwright check on `demo.html`.

| # | Scenario | Automated by | Result |
|---|---|---|---|
| 1 | A value present in package.json is rendered exactly | `run(): fills verifiable placeholders and marks the rest Not Found`; `run(): all ten placeholders resolve on a complete repo` | Pass |
| 2 | A missing source renders Not Found | `run(): empty directory resolves nothing and never throws`; `every resolver returns null when pkg is null` | Pass |
| 3 | A malformed package.json does not crash the run | `run(): corrupt package.json only affects package placeholders` | Pass |
| 4 | Git metadata is read from the real repository | `lastCommitDate/lastCommitAuthor: repo with a commit resolves both`; `CLI: full happy path against a real git repo resolves every git placeholder` | Pass |
| 5 | Git metadata is Not Found outside a git repository | `lastCommitDate/lastCommitAuthor: not a git repo returns Not Found`; `run(): valid package.json without git only loses git placeholders` | Pass |
| 6 | The template file is never overwritten | `CLI: --out same as --template is rejected and the template is left untouched`; `run(): template bytes are unchanged after a run`; `run(): outPath equal to templatePath throws and leaves the template untouched`; `run(): a different spelling of the template path is also rejected`; `run(): the rejected run creates or changes no other file`; `samePath` unit tests (symlink case skipped locally, EPERM) | Pass (symlink test skipped on Windows; Ubuntu CI result: Not Found) |
| 7 | Every placeholder occurrence is replaced | `run(): a repeated placeholder counts once and is replaced everywhere` | Pass |
| 8 | Before and after demo page shows real output | Playwright `e2e/demo.spec.js` | Not Found: not run (Playwright browsers not installed, by user decision); the CI `e2e` job would run it |
| 9 | A UTF-8 BOM at the start of package.json is ignored (hardening, added in Step 5/6; no scenario in `features/placeholder-sync.feature`) | `readPackageJson: a leading UTF-8 BOM is ignored`; `readPackageJson: BOM followed by invalid JSON still returns null`; `readPackageJson: a BOM that is not leading is not stripped`; `run(): a BOM-prefixed package.json still resolves its fields` | Pass |
| 10 | A non-string dependency version renders Not Found (hardening, added in Step 5/6; no feature scenario) | `dependencies and devDependencies: a non-string version is Not Found`; `dependencies: one invalid version makes the whole field Not Found, not a partial string`; `dependencies: string versions, ranges and an empty string are still rendered` | Pass |
| 11 | An unresolved repeated token counts once and renders Not Found everywhere (hardening, added in Step 5/6; extends scenario 7) | `run(): an unresolved repeated placeholder counts once as 0 / 1 and renders Not Found each time` | Pass |

## Execution evidence
- Command: `npm test` (fresh run, Step 8) - 142 tests, 141 pass, 0 fail, 0 cancelled, 1 skipped (`samePath: a symlink to the same file is true`, EPERM on Windows).
- Build: `npm run build` creates `dist/claude-doc-sync-0.1.0.tgz` and `dist/BUILD-INFO.json`.
- Local deployment: `npm run deploy:local` installs the artifact into `.deploy/` and smoke-tests the installed CLI.

## Skills applied
- placeholder-verifier: confirmed scenarios 1 to 3 assert values come only from package.json fields.
- git-metadata-reader: confirmed scenarios 4 and 5 cover real git and no-git cases.
- code-review-checklist: test coverage area checked: happy path and Not Found edge cases are both covered.
