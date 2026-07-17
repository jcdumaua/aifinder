# AiFinder Phase 27FJ — Discovered Tool Duplicate Security Test Contract Planning Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: 896d58b3b69efb85675b8cf7d4c9bfde5ee7cada
Selected route: app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
Source inspection: AUTHORIZED_AND_COMPLETED
Source modification: NOT_AUTHORIZED
Test modification: NOT_AUTHORIZED
Test execution: NOT_AUTHORIZED
Runtime posture: DORMANT
```

## Exact Inspected Identities
```text
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts|80be444e27a208559ed724c7bbf79358f12888d31f245cec54e3cf3d91165cdd|mode=100644
lib/admin-auth.ts|b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc|mode=100644
lib/admin-rate-limit.ts|83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b|mode=100644
lib/supabase-admin.ts|fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae|mode=100644
```

## Static Security Signals
```text
SERVER_ONLY=NO
POST_HANDLER=YES
NODE_RUNTIME=YES
FORCE_DYNAMIC=YES
ADMIN_SESSION=YES
ADMIN_CSRF=YES
ADMIN_RATE_LIMIT=YES
DUPLICATE_RATE_ACTION=YES
UUID_VALIDATION=YES
BODY_SIZE_LIMIT_20KB=YES
CONTENT_TYPE_CHECK=YES
CANDIDATE_TYPE_ALLOWLIST=YES
MATCH_TYPE_ALLOWLIST=YES
REASON_LENGTH_LIMIT=YES
MATCH_SCORE_BOUNDS=YES
NO_STORE=YES
NOSNIFF=YES
UNAUTHORIZED_DETAIL_LOGGING=YES
DYNAMIC_VALIDATION_ERROR_RESPONSE=YES
RAW_SUPABASE_ERROR_LOGGING=YES
OUTER_UNEXPECTED_BOUNDARY=NO
DISCOVERED_TOOL_READ=YES
DUPLICATE_CANDIDATE_INSERT=YES
DISCOVERED_TOOL_STATUS_UPDATE=YES
AUDIT_EVENT_INSERT=YES
PARTIAL_FAILURE_DISCLOSURE=YES
MULTI_STEP_NONTRANSACTIONAL_MUTATION=YES
SUCCESS_RETURNS_DATABASE_ROWS=YES
AUTH_ENV_ACCESS=YES
AUTH_TIMING_SAFE_COMPARE=YES
AUTH_CSRF_HEADER_COOKIE_MATCH=YES
RATE_LIMIT_BOUNDED_RESPONSE=YES
ADMIN_DEP_SERVER_ONLY=YES
ADMIN_DEP_SERVICE_ROLE=YES
```

## Narrow Findings

1. **Server isolation gap**
   - the route lacks `import "server-only";`;
   - it directly imports the service-role-backed Supabase admin client.

2. **Logging and error-surface gaps**
   - unauthorized logging includes `adminSession.errors`;
   - load, candidate-insert, status-update, and audit-insert failures log raw Supabase `.message` values;
   - fixed categorical events must replace every dynamic diagnostic payload.

3. **Request-validation boundary gap**
   - request parsing and field validation throw ordinary `Error` values;
   - catch blocks dynamically return `error.message`;
   - the route needs a typed, local validation error with fixed bounded messages and statuses.

4. **Partial-mutation and atomicity limitation**
   - the route performs four separate service-role stages: read → duplicate-candidate insert → status update → audit insert;
   - later-stage failures return internal partial-completion details;
   - no transaction or compensating rollback is present;
   - static hardening can hide diagnostics and preserve exact ordering, but cannot establish atomicity.

5. **Unexpected-failure gap**
   - no outer fail-closed catch covers authorization, rate limiting, params, validation, or database operations.

## Proposed Focused Static Test Contract

The future test should verify:

1. **Server/runtime boundary**
   - `server-only`, node runtime, force-dynamic, no client marker, POST-only mutation handler.

2. **Authorization ordering**
   - session → CSRF → duplicate-specific rate limit → validation/database operations;
   - fixed unauthorized event: `discovered_tool_duplicate_unauthorized`;
   - no session diagnostics, request data, actors, IDs, or tokens in logs.

3. **Typed validation boundary**
   - preserve JSON content type, 20KB limit, object body, candidate/match allowlists, positive ID rules, UUID candidate rule, reason length, and score bounds;
   - reject arbitrary `Error.message`, stack, cause, or thrown-value responses.

4. **Secret-safe database-stage logging**
   - `discovered_tool_duplicate_load_failed`;
   - `discovered_tool_duplicate_candidate_insert_failed`;
   - `discovered_tool_duplicate_status_update_failed`;
   - `discovered_tool_duplicate_audit_insert_failed`;
   - `discovered_tool_duplicate_unexpected_failure`;
   - no raw Supabase messages, rows, mutation payloads, metadata, reason text, actors, IDs, stack, or cause.

5. **Public error boundary**
   - every operational database failure returns fixed `Failed to mark duplicate.`;
   - no partial-completion wording;
   - fixed 404 not-found and bounded validation responses remain.

6. **Mutation containment**
   - preserve exact tables and order:
     - `discovered_tools` read;
     - `discovery_duplicate_candidates` insert;
     - `discovered_tools` update;
     - `discovery_audit_events` insert;
   - no extra service-role mutation;
   - test records atomicity as unproven and outside this patch authorization.

7. **Existing safeguards**
   - no-store, nosniff, 401, 403, 429, 400, 404;
   - 201 success with bounded duplicate-candidate and tool data.

## Test Harness Recommendation
```text
PREFERRED_ACTION=CREATE_NEW_FOCUSED_STATIC_TEST
PREFERRED_PATH=testing/discovered-tool-duplicate-route-security-static-assertions.mjs
RATIONALE=Existing tests do not own this four-stage privileged mutation boundary or its partial-failure semantics.
```

## Recommended Successor
```text
AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_FOCUSED_TEST_PATCH_ONLY
```

## Explicit Atomicity Limitation
This phase does not claim the four-stage mutation is atomic. A database RPC, transaction, compensating rollback, schema change, or live verification requires separate planning, Gemini review, and explicit database/runtime authorization.

## System Layer Progress Report
- Governance / phase control: `DISCOVERED_TOOL_DUPLICATE_TEST_CONTRACT_PENDING_REVIEW`
- Static verification: `NARROW_CONTEXT_COMPLETE`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `DORMANT`
- Security hardening: `DISCOVERED_TOOL_DUPLICATE_ACTIVE`
- Service-role isolation: `DEPENDENCY_HARDENED_ROUTE_UNISOLATED`
- Admin route safety: `BOUNDARY_GAPS_CONFIRMED`
- Secret-safe logging: `GAP_CONFIRMED`
- Mutation atomicity: `NOT_ESTABLISHED_SEPARATE_AUTHORIZATION_REQUIRED`
- CSRF protection: `PRESENT_AND_PRESERVE`
- Admin rate limiting: `PRESENT_AND_PRESERVE`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27FJ_DISCOVERED_TOOL_DUPLICATE_SECURITY_TEST_CONTRACT_PLAN`
- `REQUEST_CHANGES_PHASE_27FJ_SCOPE_OR_INVARIANTS`
- `BLOCK_PHASE_27FJ_PENDING_PARTIAL_MUTATION_OR_ATOMICITY_RECONCILIATION`

If approving, select:
- `AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_FOCUSED_TEST_PATCH_ONLY`
- `AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_TEST_AND_SOURCE_PATCH_TOGETHER`
- `SELECT_DISCOVERED_TOOL_DUPLICATE_TRANSACTIONAL_DESIGN_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether the proposed test file may be created, whether source modification is authorized, and whether test execution is authorized. Unless explicitly stated, source modification and execution remain prohibited.
