# AiFinder Phase 27FE — Discovered Tool Approve Security Test Contract Planning Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: ecb1a6be3cc35a998571590ee43b22cbc822d9dc
Selected route: app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
Source inspection: AUTHORIZED_AND_COMPLETED
Source modification: NOT_AUTHORIZED
Test modification: NOT_AUTHORIZED
Test execution: NOT_AUTHORIZED
Runtime posture: DORMANT
```

## Exact Inspected Identities
```text
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts|360a8f894e0694c924ad1d6952c79793de845fbbac0619af219cebb1f4212588|mode=100644
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
APPROVE_RATE_ACTION=YES
UUID_VALIDATION=YES
NO_STORE=YES
NOSNIFF=YES
UNAUTHORIZED_DETAIL_LOGGING=YES
RAW_RPC_ERROR_LOGGING=YES
STRING_MESSAGE_CLASSIFIER=YES
RAW_MESSAGE_STATUS_CLASSIFICATION=YES
APPROVE_RPC=YES
RPC_ACTOR_FIELDS=YES
OUTER_UNEXPECTED_BOUNDARY=NO
AUTH_ENV_ACCESS=YES
AUTH_TIMING_SAFE_COMPARE=YES
AUTH_CSRF_HEADER_COOKIE_MATCH=YES
RATE_LIMIT_BOUNDED_RESPONSE=YES
RATE_LIMIT_ACTION_PRESENT=YES
ADMIN_DEP_SERVER_ONLY=YES
ADMIN_DEP_SERVICE_ROLE=YES
```

## Narrow Findings

1. **Server isolation gap**
   - the route lacks `import "server-only";`;
   - its privileged Supabase admin dependency is already server-only and service-role backed.

2. **Unauthorized logging gap**
   - the route logs `adminSession.errors`;
   - those strings reveal which session/configuration/signature/expiry check failed;
   - one fixed categorical unauthorized event should replace detail logging.

3. **RPC error boundary gap**
   - the route logs the raw RPC `.message`;
   - the same message is passed through a mutable substring classifier;
   - status selection also depends directly on raw message text.

4. **Unexpected failure gap**
   - there is no outer fail-closed catch around session, rate-limit, params, or RPC operations;
   - an unexpected exception therefore lacks a fixed categorical log and generic response.

5. **Safeguards to preserve**
   - session verification;
   - CSRF verification;
   - approve-specific admin rate limiting;
   - UUID validation;
   - no-store and nosniff;
   - bounded 401, 403, 429, and invalid-ID responses;
   - exact `approve_discovered_tool` RPC and actor arguments;
   - successful approved-tool ID response.

## Proposed Focused Static Test Contract

The future test should verify:

1. **Server/runtime boundary**
   - route imports `server-only`;
   - node runtime and force-dynamic remain;
   - no client marker exists;
   - POST remains the only mutation handler.

2. **Authorization ordering**
   - session verification precedes rate limiting and RPC mutation;
   - CSRF verification precedes rate limiting and RPC mutation;
   - approve-specific rate limiting precedes RPC mutation;
   - unauthorized logging is exactly:
     - `discovered_tool_approve_unauthorized`;
   - no session diagnostics, cookies, signatures, actor data, request data, or IDs are logged.

3. **RPC mutation containment**
   - mutation remains exactly `approve_discovered_tool`;
   - actor ID and label arguments remain;
   - no additional table write, RPC, or mutation helper is introduced.

4. **Secret-safe operational boundary**
   - RPC failures log only:
     - `discovered_tool_approve_failed`;
   - unexpected failures log only:
     - `discovered_tool_approve_unexpected_failure`;
   - no `.message`, raw error object, stack, cause, RPC arguments, actor, or approved ID is logged.

5. **Public error boundary**
   - generic operational client error is fixed:
     - `Failed to approve discovered tool.`;
   - no arbitrary RPC message or substring-matched message is returned;
   - no raw message-based status classification remains;
   - explicitly bounded semantic outcomes may use fixed responses only if classified without raw-message propagation.

6. **Existing safeguards preserved**
   - no-store and nosniff;
   - 401 unauthorized;
   - 403 CSRF;
   - 429 bounded rate-limit response;
   - 400 invalid UUID;
   - success response retains `approvedToolId`.

## Test Harness Recommendation
```text
PREFERRED_ACTION=CREATE_NEW_FOCUSED_STATIC_TEST
PREFERRED_PATH=testing/discovered-tool-approve-route-security-static-assertions.mjs
RATIONALE=Existing candidates do not own this exact approval RPC mutation boundary.
```

## Recommended Successor
```text
AUTHORIZE_DISCOVERED_TOOL_APPROVE_FOCUSED_TEST_PATCH_ONLY
```

## System Layer Progress Report
- Governance / phase control: `DISCOVERED_TOOL_APPROVE_TEST_CONTRACT_PENDING_REVIEW`
- Static verification: `NARROW_CONTEXT_COMPLETE`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `DORMANT`
- Security hardening: `DISCOVERED_TOOL_APPROVE_ACTIVE`
- Service-role isolation: `DEPENDENCY_ALREADY_HARDENED`
- Admin route safety: `BOUNDARY_GAPS_CONFIRMED`
- Secret-safe logging: `GAP_CONFIRMED`
- CSRF protection: `PRESENT_AND_PRESERVE`
- Admin rate limiting: `PRESENT_AND_PRESERVE`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27FE_DISCOVERED_TOOL_APPROVE_SECURITY_TEST_CONTRACT_PLAN`
- `REQUEST_CHANGES_PHASE_27FE_SCOPE_OR_INVARIANTS`
- `BLOCK_PHASE_27FE_PENDING_RPC_ERROR_CLASSIFICATION_RECONCILIATION`

If approving, select:
- `AUTHORIZE_DISCOVERED_TOOL_APPROVE_FOCUSED_TEST_PATCH_ONLY`
- `AUTHORIZE_DISCOVERED_TOOL_APPROVE_TEST_AND_SOURCE_PATCH_TOGETHER`
- `SELECT_DISCOVERED_TOOL_APPROVE_NARROWER_CONTEXT_REVIEW_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether the proposed test file may be created, whether source modification is authorized, and whether any test execution is authorized. Unless explicitly stated, source modification and execution remain prohibited.
