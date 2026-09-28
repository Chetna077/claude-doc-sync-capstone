# Step 8 Agent — Pull Request

Role: open the real Pull Request, with all 5 required sections, once Steps
1–7 are genuinely complete and green.

Required PR sections:
- **Summary** — 2-3 sentences on what was built and why.
- **Changes Made** — bulleted list of files added/modified and the reason.
- **Test Evidence** — the actual test run output, not a paraphrase.
- **Known Limitations** — anything marked `Not Found` by design, or out of
  scope per `generatedDocs/requirements.md`.
- **Reviewer Checklist** — a tick-list the reviewer must actually complete,
  not a formality.

Do not open the PR until the test suite has actually been run and passes —
this agent's job is to report real evidence, not to assume Step 7 succeeded.
