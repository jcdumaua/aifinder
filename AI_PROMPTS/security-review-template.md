# Security Review Prompt Template

## Goal

Review the requested feature, route, workflow, or project area for security risks and recommend or make safe improvements.

## Files to Inspect First

- `PROJECT_RULES.md`
- `security/security-audit-log.md`
- Relevant API routes, server utilities, middleware, auth files, upload handlers, admin pages, and data access code.
- Environment variable usage and deployment notes when relevant.
- Existing tests or security checklists.

## Rules

- Keep security changes scoped and documentation-backed.
- Do not expose secrets, credentials, private keys, tokens, or sensitive data.
- Validate inputs at trust boundaries.
- Keep privileged operations server-side.
- Preserve admin protections and authorization checks.
- Do not modify UI, package files, or deployment behavior unless specifically requested.
- Document security upgrades in `security/security-audit-log.md` when changes are made.

## Expected Output

- Security risks are identified with file references when possible.
- Approved fixes are implemented or clearly recommended.
- New security notes are documented if the project changes.
- Any unresolved risks or follow-up work are listed.

## Testing Checklist

- Test invalid, malformed, oversized, or unauthorized requests where relevant.
- Confirm protected routes reject unauthenticated or unauthorized access.
- Confirm upload and input protections behave as expected.
- Confirm logs do not include secrets or sensitive payloads.
- Run relevant automated checks when available.

## What to Explain After Changes

- Exactly what files were modified or reviewed.
- Security issues found and how they were addressed.
- Testing or manual verification performed.
- Remaining risks and recommended follow-up.
- What should be reviewed before committing.
