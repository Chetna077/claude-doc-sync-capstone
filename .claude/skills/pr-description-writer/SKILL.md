---
name: pr-description-writer
description: Writes the pull request body with the five required sections (Summary, Changes Made, Test Evidence, Known Limitations, Reviewer Checklist) from real artifacts. Use during the publish stage.
---
# PR Description Writer
Sections, in order:
1. Summary: 2-3 sentences, what was built and why.
2. Changes Made: bullet per file or group, with the reason.
3. Test Evidence: paste real `npm test` output; link the verification report.
4. Known Limitations: anything Not Found or out of scope.
5. Reviewer Checklist: tick-list the reviewer completes before approving.
Also add a changelog entry. Never post without the human's explicit approval.
