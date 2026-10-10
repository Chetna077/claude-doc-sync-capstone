# Test Cases (Gherkin) and Traceability

Gherkin source: `features/placeholder-sync.feature`. Each scenario is automated by existing tests (Node test runner) or by the Playwright check on `demo.html`.

| # | Scenario | Automated by | Result |
|---|---|---|---|
| 1 | A value present in package.json is rendered exactly | `run(): fills verifiable placeholders and marks the rest Not Found`; `run(): all ten placeholders resolve on a complete repo` | Pass |
| 2 | A missing source renders Not Found | `run(): empty directory resolves nothing and never throws`; `every resolver returns null when pkg is null` | Pass |
| 3 | A malformed package.json does not crash the run | `run(): corrupt package.json only affects package placeholders` | Pass |
| 4 | Git metadata is read from the real repository | `lastCommitDate/lastCommitAuthor: repo with a commit resolves both`; `CLI: full happy path against a real git repo resolves every git placeholder` | Pass |
| 5 | Git metadata is Not Found outside a git repository | `lastCommitDate/lastCommitAuthor: not a git repo returns Not Found`; `run(): valid package.json without git only loses git placeholders` | Pass |
| 6 | The template file is never overwritten | `CLI: --out same as --template is rejected and the template is left untouched`; `run(): template bytes are unchanged after a run` | Pass |
| 7 | Every placeholder occurrence is replaced | `run(): a repeated placeholder counts once and is replaced everywhere` | Pass |
| 8 | Before and after demo page shows real output | Playwright `e2e/demo.spec.js` | Run locally with `npm run test:e2e` (needs `npx playwright install`); not run in the build sandbox |

## Execution evidence
- Command: `npm test` - 117 tests, 117 pass, 0 fail.
- Build: `npm run build` creates `dist/claude-doc-sync-0.1.0.tgz` and `dist/BUILD-INFO.json`.
- Local deployment: `npm run deploy:local` installs the artifact into `.deploy/` and smoke-tests the installed CLI.

## Skills applied
- placeholder-verifier: confirmed scenarios 1 to 3 assert values come only from package.json fields.
- git-metadata-reader: confirmed scenarios 4 and 5 cover real git and no-git cases.
- code-review-checklist: test coverage area checked: happy path and Not Found edge cases are both covered.
