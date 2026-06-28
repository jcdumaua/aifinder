# Discovery Phase 10R — Candidate Extraction Invocation API Route Live Verification Gate

## 1. Title and Phase Summary

Phase 10R is a docs-only live verification gate for the existing admin API route:

```text
POST /api/admin/discovery/candidate-extraction/invoke
```

This phase does not run the live verification. It defines the exact prerequisites, approval phrase, safe execution shape, expected assertions, stop conditions, and post-run documentation requirements for a future single authenticated dry-run route verification.

The route under review is the Phase 10Q admin-only dry-run boundary for the internal candidate extraction production invocation helper. The route must remain dry-run-only and safe-summary-only.

## 2. Current State Recap

Current completed foundation:

- Phase 10K live smoke passed exactly once with James approval.
- Phase 10L documented the live smoke result.
- Phase 10M approved production integration readiness planning.
- Phase 10N documented the production invocation contract.
- Phase 10O implemented the dry-run-only internal invocation helper.
- Phase 10P documented the admin API route design.
- Phase 10Q implemented the admin API route and pushed commit:

```text
17cd9b3 Add extraction invocation admin API route
```

Current route behavior:

- The route is admin-only.
- The route requires admin session verification.
- The route requires CSRF verification.
- The route requires admin rate limiting.
- The route remains dry-run-only.
- `dry_run: false` remains blocked with `live_invocation_not_enabled`.
- Client-supplied `invoked_by_admin_user_id` is rejected.
- The route derives admin identity server-side.
- No UI or admin dashboard wiring exists yet.
- No crawler, LLM, or live executor wiring exists yet.
- No production staging writes are enabled.

## 3. Purpose of the Future Live Verification

The future live verification should confirm only the authenticated dry-run route boundary.

The verification should prove:

- Next.js route resolution works for `POST /api/admin/discovery/candidate-extraction/invoke`.
- Admin session protection works.
- CSRF protection works.
- The admin rate-limit boundary is active.
- JSON parsing works.
- Server-side admin identity derivation works.
- The internal dry-run helper is reached.
- `dry_run: true` returns a safe accepted summary.
- `dry_run: false` remains blocked.
- Responses stay sanitized.
- No production writes occur.

This is not a staging pipeline live smoke. It is a route-boundary dry-run verification.

## 4. Strict Non-Goals

Phase 10R explicitly forbids:

- running the live verification;
- live smoke execution;
- database writes;
- database commands;
- remote SQL;
- `supabase db push`;
- migrations;
- Supabase type regeneration;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- UI or admin dashboard wiring;
- crawler automation;
- LLM automation;
- live executor wiring;
- scheduled jobs;
- background jobs;
- production staging enablement;
- public publishing;
- enabling `dry_run: false`;
- source code changes;
- test changes;
- package changes.

## 5. Required Approval Phrase for Future Live Verification

The future live authenticated dry-run route verification must not run unless James explicitly approves with this exact phrase:

```text
Approve run Phase 10R live dry-run route verification
```

Without that approval phrase, only local inspection and safe non-live verification are allowed.

## 6. Verification Environment Prerequisites

Before any future live route verification:

- The repo must be clean and up to date.
- The latest commit must be `17cd9b3` or a later approved commit.
- A local app/server must be running in a controlled environment using the existing project pattern.
- The verifying browser/client must be authenticated as an admin.
- A valid CSRF token must be available through the existing admin CSRF pattern.
- No extraction staging smoke opt-in environment variable may be set.
- No candidate staging RLS smoke opt-in environment variable may be set.
- No Supabase migration commands may be run.
- No Supabase type generation commands may be run.
- The request must use `dry_run: true`.
- `max_candidates` must remain within the Phase 10O helper bound of `25`.
- No public publishing workflow should be active.
- No crawler, LLM, scheduled job, background job, or live executor path should be active.
- No DB write verification step may be added unless it is explicitly reviewed and confirmed to be read-only.

## 7. Future Request Shape

Safe future request body:

```json
{
  "discovery_source_id": "00000000-0000-4000-8000-000000000001",
  "discovery_run_id": "00000000-0000-4000-8000-000000000002",
  "audit_correlation_id": "phase-10r-route-live-dry-run:<unique-marker>",
  "invocation_reason": "Phase 10R authenticated dry-run route verification",
  "dry_run": true,
  "max_candidates": 1,
  "source_scope": "single_run",
  "schema_version": "candidate_extraction_invocation.v1"
}
```

Important request rules:

- Do not send `invoked_by_admin_user_id`.
- The route must derive admin identity server-side from the authenticated admin session.
- Use placeholder UUIDs only while the helper accepts structurally valid IDs without DB lookup.
- If the route or helper later requires real source/run rows, this live verification plan must be revised before execution.
- Do not include raw extracted payloads.
- Do not include raw HTML.
- Do not include prompt or model output.
- Do not include service-role details.
- Do not include secrets or environment values.

## 8. Expected Successful Dry-Run Assertions

The future successful dry-run verification should assert:

- The response is HTTP success or the expected accepted route status.
- The response contains `accepted: true`.
- The response contains `rejected: false`.
- The response contains the same `audit_correlation_id`.
- The response confirms `no_public_write_confirmed: true`.
- The response confirms `no_discovered_write_confirmed: true`.
- The staged count is `0` for the dry-run boundary unless helper semantics are changed in a separately approved phase.
- The response contains `dry_run: true`.
- The response safety flags include dry-run/no-write semantics.
- No raw payload appears.
- No raw HTML appears.
- No secrets appear.
- No stack trace appears.
- No service-role details appear.
- No environment values appear.
- No DB credentials appear.

## 9. Expected Rejection Assertions

Future negative checks should remain bounded and should not include secrets in logs or documentation.

Expected rejection assertions:

- Anonymous request is rejected.
- Missing CSRF is rejected.
- Invalid CSRF is rejected.
- Client-supplied `invoked_by_admin_user_id` is rejected with `client_admin_identity_not_allowed`.
- `dry_run: false` is rejected with `live_invocation_not_enabled`.
- Invalid schema version is rejected.
- Exceeded max candidate bound is rejected.
- Invalid source ID is rejected.
- Invalid run ID is rejected.
- Unsupported raw payload fields are rejected without leakage.
- Rate-limit rejection is safe if the verification includes a bounded rate-limit check.

The negative checks should stop before creating noisy logs, exhausting shared admin limits, or requiring DB access.

## 10. No-Write Verification Assertions

Future verification must confirm no writes to:

- `public.tools`;
- `discovered_tools`;
- candidate staging tables;
- discovery source rows;
- discovery run rows;
- audit events.

Because this route verification should not perform DB writes, DB readback checks must be planned carefully and must remain read-only.

If no safe DB readback is available without credentials or remote SQL, the verification should rely on:

- route source inspection;
- helper source inspection;
- Phase 10Q route tests;
- Phase 10O invocation helper tests;
- response no-write flags;
- safe opt-out smoke evidence.

Remote SQL and ad hoc DB commands are not part of this gate.

## 11. Stop Conditions

Immediately stop the future verification if any of the following occur:

- The route attempts a DB mutation.
- The route returns raw payload.
- The route leaks raw HTML.
- The route leaks a stack trace.
- The route leaks secrets or environment values.
- `dry_run: false` succeeds.
- An unauthenticated request succeeds.
- Invalid CSRF succeeds.
- Client-supplied admin identity is accepted.
- `public.tools` writes occur.
- `discovered_tools` writes occur.
- candidate rows are created.
- discovery source rows are created.
- discovery run rows are created.
- audit rows are created.
- live smoke env vars are needed.
- migration or type generation is suggested.
- an unexpected server error occurs.

If any stop condition is hit, do not retry automatically. Capture safe summaries only and request James direction before any follow-up.

## 12. Future Execution Shape

The future execution should be described and captured without secret-bearing commands.

High-level execution outline:

1. Start the local app/server using the existing project pattern.
2. Authenticate as an admin through the existing admin login/session flow.
3. Obtain a CSRF token through the existing project CSRF pattern.
4. Send one authenticated `dry_run: true` `POST` request to:

```text
/api/admin/discovery/candidate-extraction/invoke
```

5. Capture the safe response summary.
6. If explicitly approved, send bounded negative requests for anonymous, CSRF, client admin identity, `dry_run: false`, invalid schema, invalid IDs, and max-candidate-bound checks.
7. Capture response summaries only.
8. Do not document cookies, tokens, secrets, CSRF values, session values, environment values, DB credentials, or full request headers.

## 13. Post-Run Documentation Requirement

If the future live verification is approved and run later, create a follow-up result document:

```text
docs/discovery-phase-10s-candidate-extraction-invocation-api-route-live-verification-result.md
```

The result document must include:

- approval phrase;
- exact high-level commands/actions without secrets;
- timestamp;
- route tested;
- request summary;
- response summary;
- assertions passed or failed;
- no-write confirmation;
- final repo status;
- whether any follow-up fixes are required.

Do not include:

- cookies;
- CSRF tokens;
- session values;
- secrets;
- environment values;
- DB credentials;
- raw payloads;
- raw HTML;
- stack traces;
- service-role details.

## 14. Rollout Gates After 10R

Before any UI or admin dashboard wiring:

- Phase 10R plan must be Gemini-reviewed.
- James must explicitly approve the live dry-run route verification.
- The live dry-run route verification must pass.
- A Phase 10S result document must be created.
- The Phase 10S result document must be reviewed.
- A separate Gemini review must approve any UI wiring plan.
- No crawler or LLM automation may be added yet.
- No live production staging writes may be enabled yet.
- No public publishing path may be added yet.

The route remains an admin-only dry-run server boundary until a later approved phase changes that scope.

## 15. Recommended Next Phase

Recommended next phase:

```text
Phase 10S — Candidate Extraction Invocation API Route Live Dry-Run Verification Result
```

This phase should happen only after James explicitly approves and the single live dry-run route verification is executed.
