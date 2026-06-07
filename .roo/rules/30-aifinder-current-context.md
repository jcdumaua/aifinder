# AiFinder Current Urgent Context

## Current Status

- `urgent-responsive-modals` was merged into `main` and deployed.
- A real-device modal issue still exists in production.
- `security-hardening-pass` exists separately.
- Do not touch `security-hardening-pass` until the modal issue is verified and fixed.

## Next Priority

The next priority is production modal reproduction using Playwright/browser screenshots against:

```text
https://aifinder.to
```

Use visual evidence only when needed for UI verification. Prefer CCR reports for normal progress reporting.

## Boundaries For The Next Modal Task

- Keep the work focused on reproducing and fixing the production modal issue.
- Do not change database, auth, security, or admin protections.
- Do not perform unrelated UI cleanup.
- Preserve existing UI patterns.
- Run the responsive and accessibility QA expected for modal fixes.

