# Discovery Phase 10U — Candidate Extraction Admin UI Dry-Run Invocation Wiring Plan

## 1. Title and Phase Summary

Phase 10U is a docs-only UI wiring implementation plan for a future dry-run-only admin invocation control.

This plan defines how a future admin UI could call the already verified dry-run Candidate Extraction Invocation API route without enabling production writes, crawler automation, LLM automation, publishing, or live executor behavior.

This phase does not implement UI, modify source code, modify tests, change API routes, change packages, run database commands, rerun live verification, run live smoke, or add production wiring.

## 2. Current State Recap

Current completed foundation:

- Phase 10O implemented the dry-run-only internal invocation helper.
- Phase 10Q implemented the admin API route.
- Phase 10R/10S verified and documented a successful live authenticated dry-run route verification.
- Phase 10T approved readiness to begin UI wiring planning.
- Latest pushed commit is:

```text
705a14f Document extraction invocation UI readiness gate
```

The verified route is:

```text
POST /api/admin/discovery/candidate-extraction/invoke
```

Current boundaries:

- The route remains dry-run-only.
- `dry_run: false` remains blocked.
- No production writes are enabled.
- No admin UI wiring exists yet.
- No crawler automation exists for this invocation path.
- No LLM automation exists for this invocation path.
- No live executor wiring exists for this invocation path.

## 3. UI Implementation Goal

Future implementation goal:

Add an admin-only dry-run invocation control that lets an authenticated admin manually trigger the existing route for an exact source/run context and view a sanitized response summary.

The UI should:

- use trusted source/run context from an admin-only page or trusted selector;
- call the verified admin API route;
- always send `dry_run: true`;
- display safe summaries only;
- communicate that no production writes occur;
- prevent accidental production staging, publishing, crawler execution, or LLM execution.

## 4. Recommended UI Placement

### Preferred placement

Add a small dry-run action panel inside an existing Discovery Runs admin detail/review area if that area already has trusted `discovery_run_id` and `discovery_source_id`.

Rationale:

- The route contract requires exact run/source IDs.
- Discovery Runs UI already models run state, run expansion, and safe results review.
- A run-scoped context reduces manual ID entry risk.
- The action can be disabled if `source_id` is missing.
- The action can sit near read-only run/result summaries without becoming an approval or publishing control.

### Fallback placement

If exact source/run context is not available in the current UI, create a dedicated admin utility panel with trusted selectors.

Fallback requirements:

- Select source/run IDs from trusted admin data, not free-form untrusted text where avoidable.
- Keep the utility separate from public publishing and approval flows.
- Preserve dry-run-only copy and disabled states.

### Explicitly not recommended

Do not place this control in:

- homepage/public UI;
- public submit UI;
- public tool pages;
- crawler automation UI;
- LLM automation UI;
- publishing/approval flows.

## 5. Proposed Component Structure

Possible future component path:

```text
components/admin/discovery-candidate-extraction-dry-run-panel.tsx
```

If repo conventions prefer discovery-specific nesting, a more scoped option is:

```text
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
```

Recommended first choice:

```text
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
```

This follows the existing `components/admin/discovery/...` pattern used by Discovery Runs and results review components.

Planned responsibilities:

- receive trusted `discovery_source_id` and `discovery_run_id` from parent context;
- display dry-run-only status;
- collect or derive a safe invocation reason;
- use fixed `dry_run: true`;
- use bounded `max_candidates`;
- use fixed schema version `candidate_extraction_invocation.v1`;
- generate a valid UUID `audit_correlation_id`;
- call `POST /api/admin/discovery/candidate-extraction/invoke`;
- render sanitized success summaries;
- render safe rejection/error summaries;
- never render raw payloads or raw HTML;
- never expose secrets, CSRF tokens, cookies, service-role details, stack traces, environment values, or DB credentials.

Do not create the component in Phase 10U.

## 6. Future Request Contract From UI

Future UI request body:

```ts
{
  discovery_source_id: string;
  discovery_run_id: string;
  audit_correlation_id: string;
  invocation_reason: string;
  dry_run: true;
  max_candidates: number;
  source_scope: "single_source" | "single_run";
  schema_version: "candidate_extraction_invocation.v1";
}
```

Strict request rules:

- UI must not collect `invoked_by_admin_user_id`.
- UI must not send `invoked_by_admin_user_id`.
- UI must not allow `dry_run: false`.
- UI must not allow unbounded `max_candidates`.
- UI must not allow arbitrary schema versions.
- UI must generate or request a valid UUID `audit_correlation_id`.
- If marker text is needed, place it in `invocation_reason`, not in `audit_correlation_id`.
- UI should derive `source_scope` from the page context where possible.
- UI should default to `source_scope: "single_run"` for a run-scoped panel.

## 7. CSRF / Fetch Plan

Future UI fetch must follow existing admin CSRF/fetch patterns.

Observed project patterns:

- Admin components fetch `/api/admin/csrf` before unsafe admin actions.
- Unsafe admin requests include the CSRF token in the `x-csrf-token` header.
- Admin fetches use same-origin requests and safe JSON responses.
- Admin UI handles loading and errors with safe messages.

Future fetch plan:

1. Obtain CSRF using the existing project pattern through `/api/admin/csrf`.
2. Do not log the CSRF token.
3. Send a same-origin `POST` request to:

```text
/api/admin/discovery/candidate-extraction/invoke
```

4. Use `Content-Type: application/json`.
5. Include `x-csrf-token`.
6. Send only the approved dry-run request body.
7. Handle `401`, `403`, `429`, `400`, and `500` safely.
8. Do not log tokens, cookies, CSRF values, session values, request headers, or secrets.
9. Do not expose secrets or service-role values in the client bundle.

Response handling guidance:

- `200`: render safe accepted dry-run summary.
- `400`: render safe validation/rejection summary.
- `401`: render admin session expired/unauthorized message.
- `403`: render CSRF or authorization failure message.
- `429`: render rate-limit safe message and do not auto-retry.
- `500`: render generic internal error summary without stack traces.

## 8. UI State Management Plan

Future UI states:

### `idle`

Render dry-run-only copy, trusted source/run context, `max_candidates`, and a disabled or enabled trigger based on context availability.

### `missing_context`

Render a safe warning that exact source/run context is unavailable. Trigger must be disabled.

### `confirmation_required`

Render a confirmation dialog before sending the request. The dialog must state that this is dry-run-only and creates no production writes.

### `submitting`

Render a loading state. Disable the trigger. Do not start background polling. Do not retry automatically.

### `success`

Render only the safe accepted summary fields and no-write confirmations.

### `rejected_validation`

Render safe validation failures or helper rejection code. Do not render raw request payloads.

### `unauthorized`

Render a safe admin session message and suggest re-authentication through existing admin flow.

### `csrf_failed`

Render a safe security-token-expired message and allow a deliberate retry after obtaining a fresh CSRF token.

### `rate_limited`

Render the safe rate-limit response. Do not retry automatically.

### `failed_internal_error`

Render a generic safe error summary. Do not display stack traces, raw server errors, secrets, or environment values.

## 9. Confirmation and Safety Messaging

Future UI must include:

- confirmation dialog before triggering;
- clear “Dry run only” badge;
- warning that no production writes will occur;
- warning that `dry_run: false` is unavailable;
- clear source/run context display;
- bounded `max_candidates` display;
- no automatic retries;
- no background polling;
- no scheduled triggering;
- no crawler or LLM trigger copy;
- no “publish” or “approve” wording.

Recommended copy principles:

- Use “Run dry-run check” rather than “Run extraction” or “Stage candidates.”
- State “No candidates will be staged from this control.”
- State “This verifies the invocation boundary only.”
- State “Production staging remains disabled.”

## 10. Safe Response Rendering Plan

UI may render only:

- accepted/rejected;
- candidates staged count;
- candidates skipped count;
- validation failures;
- duplicate/eligibility rejections;
- audit correlation ID;
- safety flags;
- no public write confirmation;
- no discovered write confirmation;
- error summary.

UI must never render:

- raw extracted payloads;
- raw HTML;
- secrets;
- service-role details;
- stack traces;
- environment values;
- DB credentials;
- unredacted unexpected errors;
- cookies;
- tokens;
- CSRF values;
- session values;
- full request headers.

Rendering should use defensive formatting and should treat all server-provided text as untrusted display text.

## 11. Accessibility and Responsive Requirements

Future UI implementation must include:

- accessible button labels;
- confirmation dialog focus handling;
- keyboard-accessible controls;
- clearly announced status messages;
- readable loading, success, rejected, and error states;
- visible focus states;
- no reliance on color alone for success/error state;
- desktop, tablet, and mobile smoke expectations;
- no horizontal overflow in the response summary;
- no layout shift that hides the trigger or result;
- no sticky/fixed elements covering the panel.

Responsive QA should include desktop, tablet/iPad, and mobile checks, following the existing AiFinder admin QA guidance.

## 12. Security Requirements

Future UI implementation must preserve:

- admin-only page or section;
- route protection by admin session;
- route protection by CSRF;
- route protection by rate limit;
- no client-supplied admin identity;
- no secrets in client bundle;
- no service-role values client-side;
- no raw payload logging;
- no raw HTML rendering;
- no automatic retries;
- no crawler automation;
- no LLM automation;
- no production staging writes;
- no public publishing;
- no background or scheduled execution.

Future audit writes remain out of scope unless separately planned and reviewed.

## 13. Testing Plan for Future UI Implementation

Future tests should cover:

- panel does not render or trigger without trusted source/run context;
- trigger button disabled when required context is missing;
- confirmation required before request;
- request sends `dry_run: true`;
- request never sends `invoked_by_admin_user_id`;
- request never sends `dry_run: false`;
- request uses bounded `max_candidates`;
- request uses schema version `candidate_extraction_invocation.v1`;
- request uses a valid UUID `audit_correlation_id`;
- CSRF included correctly;
- valid dry-run success summary renders safely;
- validation rejection renders safely;
- unauthorized response renders safely;
- CSRF response renders safely;
- rate-limit response renders safely;
- raw payload is not rendered;
- raw HTML is not rendered;
- secrets are not rendered;
- service-role details are not rendered;
- stack traces are not rendered;
- desktop/tablet/mobile smoke;
- accessibility smoke for controls and status messages.

Tests should also verify that no UI code imports service-role clients, no route bypass is introduced, and no crawler/LLM/live executor trigger is added.

## 14. Rollout Gates Before UI Implementation

Before UI implementation:

- Gemini must review Phase 10U.
- James must approve the next implementation phase.
- Codex must receive a separate implementation prompt.
- Gemini must review after implementation.
- No commit may occur without review.
- No push may occur without James approval.
- No live verification may be rerun unless explicitly approved.
- No live smoke may run unless explicitly approved.
- No production write enablement may be added.
- No crawler automation may be added.
- No LLM automation may be added.
- No public publishing may be added.

## 15. Non-Goals

Phase 10U explicitly forbids:

- UI implementation;
- source code changes;
- test changes;
- API route changes;
- package changes;
- migrations;
- generated type changes;
- admin dashboard wiring;
- live verification rerun;
- live smoke;
- database commands;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- production wiring;
- crawler automation;
- LLM automation;
- background jobs;
- scheduled jobs;
- enabling `dry_run: false`.

## 16. Recommended Next Phase

Recommended next phase:

```text
Phase 10V — Candidate Extraction Admin UI Dry-Run Invocation Panel Implementation
```

Phase 10V should happen only after Gemini review and James approval of Phase 10U.
