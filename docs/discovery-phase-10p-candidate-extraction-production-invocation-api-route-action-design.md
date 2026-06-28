# Discovery Phase 10P — Candidate Extraction Production Invocation API Route / Action Design

## 1. Title and Phase Summary

Phase 10P designs the future secure server boundary for invoking the existing internal dry-run-only Candidate Extraction Production Invocation helper.

This phase is documentation-only. It does not implement an API route, Server Action, admin UI integration, crawler automation, LLM automation, live executor wiring, background job, scheduled job, database command, migration, or production write path.

The design target is a future authenticated admin server boundary that can call `invokeCandidateExtractionStagingPipeline(...)` safely while preserving the current dry-run-only, staging-only, safe-summary-only constraints.

## 2. Current State Recap

The current Candidate Extraction Staging Pipeline foundation is validated but not exposed through a production server boundary:

- Phase 10K live smoke passed exactly once with James approval.
- Phase 10L documented the Phase 10K live smoke result.
- Phase 10M approved production integration readiness planning.
- Phase 10N documented the production invocation contract plan.
- Phase 10O implemented the internal dry-run-only invocation helper.
- `invokeCandidateExtractionStagingPipeline(...)` exists in `lib/discovery/discovery-candidate-extraction-invocation.ts`.
- The helper currently accepts `dry_run: true` only.
- `dry_run: false` fails closed with `live_invocation_not_enabled`.
- The helper does not create Supabase clients.
- The helper does not read environment values.
- The helper does not call real mapper/staging/database execution paths.
- No API route exists for candidate extraction production invocation.
- No Server Action exists for candidate extraction production invocation.
- No admin UI wiring exists.
- No crawler automation exists for this invocation path.
- No LLM automation exists for this invocation path.
- No live executor wiring exists.
- No production writes are enabled.

The pipeline remains staging-only. There is still no public publishing path, no direct `public.tools` write path, and no direct `discovered_tools` write path.

## 3. Purpose of the Future Server Boundary

Any future API route or Server Action must provide a narrow, auditable, server-only control point around the existing internal helper.

The future boundary must be:

- admin-only;
- authenticated;
- CSRF-protected if browser-triggered;
- rate-limited;
- audited in a separately approved audit phase;
- dry-run-only at first;
- staging-only;
- safe-summary-only;
- non-public;
- not crawler-triggered;
- not LLM-autonomous;
- not a background or scheduled job trigger;
- not a publishing path.

The future boundary must derive the admin actor from server-side session context. It must not trust client-supplied admin identity fields.

## 4. API Route vs Server Action Decision Analysis

### Option A — Next.js API route

Possible future route:

```text
POST /api/admin/discovery/candidate-extraction/invoke
```

Pros:

- Matches existing Discovery Engine admin route convention under `app/api/admin/discovery/...`.
- Can reuse existing `verifyAdminSession(request)` pattern.
- Can reuse existing `verifyAdminCsrfRequest(request)` pattern for browser-triggered POSTs.
- Can reuse or extend `checkAdminRateLimit(...)`.
- Produces explicit HTTP status codes and safe JSON responses.
- Easier to test as a request/response boundary.
- Easier to keep separate from admin UI implementation.
- Easier to inspect for accidental public exposure.
- Fits current `NextResponse.json(...)` response shaping.
- Consistent with existing manual intake, source, run, and discovered-tool admin endpoints.

Cons:

- Requires explicit CSRF handling for browser-triggered use.
- Requires a new route path and route-specific tests.
- Requires careful request-body validation.
- May be accidentally consumed by UI before the route is ready unless rollout is gated.
- Audit writes, if later added, must be carefully isolated from raw request payloads.

### Option B — Admin-only Server Action

Pros:

- Can be convenient for a future admin UI workflow.
- Can avoid manually designing a public-looking URL.
- Can keep invocation close to future form/action code if the first caller is UI-only.

Cons:

- Current Discovery Engine admin conventions are API-route-heavy, not Server Action-heavy.
- CSRF, rate-limit, and request/response semantics may be less explicit.
- Harder to test as a stable standalone boundary.
- Easier to couple prematurely to admin UI.
- Less aligned with existing Discovery Engine admin route patterns.
- May obscure logging, audit, and error response contracts.

### Recommendation

The safest first choice is Option A: a Next.js admin API route.

Recommended future route:

```text
POST /api/admin/discovery/candidate-extraction/invoke
```

Rationale:

- Existing Discovery Engine admin operations already use API routes under `app/api/admin/discovery/...`.
- Existing route code already demonstrates `verifyAdminSession`, `verifyAdminCsrfRequest`, and `checkAdminRateLimit`.
- A route keeps the invocation boundary explicit, testable, and separate from admin UI wiring.
- A route can remain dry-run-only and return safe JSON summaries before any UI is introduced.

Server Actions should remain deferred until an admin UI workflow is separately designed.

## 5. Recommended First Server Boundary Design

The first server boundary should be:

- manual admin-triggered only;
- dry-run-only;
- single source/run scoped;
- authenticated through existing admin session validation;
- CSRF-protected for browser-triggered POSTs;
- rate-limited with a dedicated or carefully reused admin discovery action;
- safe-summary-only;
- no automatic approval;
- no public publishing;
- no production write enablement;
- no crawler automation;
- no LLM automation;
- no background jobs;
- no scheduled jobs.

Recommended future flow:

```text
POST /api/admin/discovery/candidate-extraction/invoke
  -> verify admin session
  -> verify CSRF token
  -> rate-limit admin discovery invocation
  -> parse and validate request body
  -> derive invoked_by_admin_user_id from admin session/server context
  -> call invokeCandidateExtractionStagingPipeline(...)
  -> return safe JSON summary
```

The first implementation should keep `dry_run: true` mandatory. If a caller sends `dry_run: false`, the route should preserve the helper behavior and return `live_invocation_not_enabled`.

## 6. Request Contract

Future request body, planning level only:

```ts
{
  discovery_source_id: string;
  discovery_run_id: string;
  audit_correlation_id: string;
  invocation_reason: string;
  dry_run: true;
  max_candidates: number;
  source_scope: "single_source" | "single_run";
  schema_version: string;
}
```

Important boundary:

```text
invoked_by_admin_user_id must not be trusted from the client request body.
```

The future server boundary must derive `invoked_by_admin_user_id` from the authenticated admin session or an equivalent trusted server context.

If a client supplies `invoked_by_admin_user_id`, the route should ignore it or reject the request. The safer first implementation is to reject it as an unsupported client field so identity provenance remains explicit.

Additional request rules:

- `dry_run` must be exactly `true` in the first route implementation.
- `schema_version` must match the internal helper schema version.
- `source_scope` must be exact and non-ambiguous.
- `max_candidates` must remain within the internal helper bound.
- The request body must not contain raw candidate payloads, raw HTML, source blobs, prompt text, model output, secrets, or service-role data.

## 7. Response Contract

The future route/action response should be a safe projection of the internal helper result.

Expected response fields:

- `accepted`;
- `rejected`;
- `rejection_code`;
- `dry_run`;
- `discovery_source_id`;
- `discovery_run_id`;
- `candidates_considered_count`;
- `candidates_staged_count`;
- `candidates_skipped_count`;
- `validation_failures`;
- `duplicate_or_eligibility_rejections`;
- `audit_correlation_id`;
- `safety_flags`;
- `no_public_write_confirmed`;
- `no_discovered_write_confirmed`;
- `error_summary`.

The response must never include:

- raw extracted payloads;
- raw HTML;
- source blobs;
- prompt text;
- model output;
- secrets;
- service-role details;
- stack traces;
- environment values;
- internal database credentials;
- raw Supabase errors;
- unredacted unexpected errors;
- full candidate rows;
- full request bodies.

HTTP status guidance:

- `200` for accepted dry-run summaries.
- `400` for invalid request body or validation failure.
- `401` for unauthenticated requests.
- `403` for missing/invalid CSRF or non-admin access.
- `429` for rate-limit rejection.
- `500` only for unexpected internal errors, with safe generic body.

## 8. Authentication and Authorization Requirements

Future implementation must require:

- authenticated admin user;
- admin role/session validation;
- no anonymous access;
- no public read/write surface;
- no reliance on client-supplied admin identity;
- server-side derivation of `invoked_by_admin_user_id`;
- fail-closed behavior if admin identity is missing or ambiguous.

Recommended repo-aligned pattern:

- Use `verifyAdminSession(request)`.
- Require `adminSession.isAdmin === true`.
- Require `adminSession.actor` to exist.
- Derive the invocation actor from `adminSession.actor.id` or `adminSession.actor.label`.

If the current admin actor has `id: null`, the route should choose a documented stable server-derived fallback, such as the actor label, or block until actor ID support is available. It must not accept a client-supplied replacement identity.

## 9. CSRF and Browser-Triggering Requirements

If the future boundary is browser-triggered, it must follow the existing project CSRF pattern.

Requirements:

- Use `verifyAdminCsrfRequest(request)` or the current equivalent.
- Require `x-csrf-token` for unsafe methods.
- Require the CSRF cookie/header pair to match.
- Maintain same-origin expectations.
- Reject missing or invalid CSRF with a safe `403` response.
- Do not parse or process the invocation body after CSRF failure.
- Do not perform DB mutation if CSRF validation fails.
- Do not leak request payloads in CSRF error responses.

The existing `app/api/admin/csrf/route.ts` and `ADMIN_CSRF_COOKIE_NAME` pattern should be the reference for any future browser-triggered route.

## 10. Rate Limiting Requirements

Future implementation must include an admin discovery invocation rate limit.

Preferred future approach:

- Add a dedicated rate-limit action, for example:

```text
discoveryCandidateExtractionInvocation
```

- Use a low default limit because this operation is production-adjacent even while dry-run-only.
- Candidate first limit: lower than manual intake unless Gemini/James approve otherwise.

Acceptable alternative:

- Reuse an existing Discovery Engine admin rate-limit action only if Gemini confirms it maps cleanly to this invocation risk.

Expected behavior:

- fail closed when rate-limited;
- return safe `429` response body;
- do not call the invocation helper if rate-limited;
- do not stage candidates;
- do not perform DB mutation;
- do not log raw payloads.

## 11. Audit Design

Audit design is planning-only in Phase 10P. Do not implement audit writes in this phase.

Future audit event categories may include:

- invocation request received;
- invocation rejected;
- invocation dry-run accepted;
- invocation completed;
- validation failed;
- live invocation blocked;
- rate limit rejected;
- unauthorized rejected;
- CSRF rejected;
- unexpected internal error.

Future audit metadata should include safe fields only:

- `audit_correlation_id`;
- `discovery_source_id`;
- `discovery_run_id`;
- server-derived admin actor;
- request schema version;
- source scope;
- dry-run mode;
- result status;
- safe rejection code;
- safe counts.

Audit writes must be introduced in a separate approved phase and must not leak raw payloads, raw HTML, prompt/model output, secrets, service-role details, stack traces, or full request bodies.

## 12. Error Handling Design

The future boundary must fail closed.

Requirements:

- normalize safe error codes;
- return safe JSON only;
- do not include stack traces in responses;
- do not echo raw payloads;
- do not log secrets;
- preserve `live_invocation_not_enabled` for `dry_run: false`;
- clearly distinguish unauthorized, invalid input, CSRF failure, rate-limited, helper rejection, and internal error states;
- avoid raw Supabase or database error output;
- avoid broad catch blocks that return raw exception messages.

Suggested high-level error classes or categories:

- `unauthorized`;
- `csrf_invalid`;
- `rate_limited`;
- `invalid_request`;
- `invocation_rejected`;
- `internal_error`.

## 13. Testing Plan for Future Implementation

Future route/action implementation should include tests for:

- anonymous rejection;
- non-admin rejection;
- missing CSRF rejection;
- invalid CSRF rejection;
- rate-limit rejection;
- valid dry-run request accepted;
- client-supplied `invoked_by_admin_user_id` ignored or rejected;
- `dry_run: false` rejected with `live_invocation_not_enabled`;
- invalid source ID rejected;
- invalid run ID rejected;
- invalid schema version rejected;
- max candidate bound rejected;
- safe response has no raw payload;
- safe response has no raw HTML;
- safe response has no secrets;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit writes unless explicitly introduced in that future phase;
- no live smoke;
- extraction staging smoke safe opt-out still skips;
- candidate staging RLS smoke safe opt-out still skips.

Tests should not require live DB credentials for the route/action boundary unless a separate live smoke phase is explicitly approved.

## 14. Rollout Gates

Before implementation:

1. Gemini review of this Phase 10P design.
2. James approval.
3. Codex implementation CCR for the future implementation phase.
4. No push without James approval.
5. No live smoke without explicit James approval.
6. No production write enablement without a separate phase.
7. No admin UI wiring without a separate phase.
8. No crawler automation without a separate phase.
9. No LLM automation without a separate phase.
10. No audit writes without a separate audit phase.

The first implementation phase after this design should remain dry-run-only and server-boundary-only.

## 15. Non-Goals

Phase 10P explicitly forbids:

- API route implementation;
- Server Action implementation;
- admin UI changes;
- source code changes;
- test changes;
- package changes;
- migrations;
- Supabase type regeneration;
- live smoke;
- DB commands;
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
- live executor wiring;
- scheduled jobs;
- background jobs;
- enabling `dry_run: false`.

## 16. Recommended Next Phase

Recommended next phase:

```text
Phase 10Q — Candidate Extraction Production Invocation API Route / Action Design Review Gate
```

Phase 10Q should be a review and approval gate before any route or Server Action implementation begins.
