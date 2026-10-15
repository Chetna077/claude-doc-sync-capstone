# Token saving rule

Every agent follows this when it reads from or writes to Jira, Confluence, GitHub or files.

## Reading
- Jira: ask only for the fields the stage needs (summary, description, acceptance criteria, status, labels). Never fetch comments, changelog, attachments or avatars unless the stage needs them.
- Confluence: fetch one page by id; do not list whole spaces.
- Files: use Grep or Read with offset and limit. Never read lockfiles, `node_modules`, binaries or whole large files.

## Writing
- Send only the changed field or one short comment. Do not re-send a whole description or page to change one line.
- One Jira or Confluence write per stage, after the human approves it. Keep each payload under 8,000 characters.

## Enforced by hooks (`.claude/settings.json`)
- `read-guard.js` (PreToolUse, Read): blocks lockfiles, vendored folders, binaries and large unbounded reads.
- `atlassian-write-guard.js` (PreToolUse, Atlassian writes): blocks payloads over 8,000 characters.
- `trim-mcp-output.js` (PostToolUse, Atlassian): strips avatar, self-link and icon noise from responses.
Set `TOKEN_SAVER=off` to disable the guards.

## Images and attachments
- Never fetch or attach images, screenshots, PDFs or base64 data through Jira, Confluence or GitHub tools. Link to them or describe them in one line.
- The trimmer replaces any image or base64 block in a response with a short note, and the read guard blocks image and PDF files.
