# AiFinder Phase 27EZ — Homepage Draft Route Security Test Contract Planning Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: 17089249849aa16f6e20da73bdf9ce65ab505dc5
Selected route: app/api/admin/homepage-control/drafts/[id]/route.ts
Source inspection: AUTHORIZED_AND_COMPLETED
Source modification: NOT_AUTHORIZED
Test modification: NOT_AUTHORIZED
Test execution: NOT_AUTHORIZED
Runtime posture: DORMANT
```

## Exact Inspected Identities
```text
app/api/admin/homepage-control/drafts/[id]/route.ts|bb197c258f03f9e5db253cebaa89057314556e8c09539363925dae2b4e1ce2a9|mode=100644
lib/admin-auth.ts|b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc|mode=100644
lib/homepage-control-admin.ts|9bd03eee803bedf97a840c7b42a2cfb1a31400a8300eb22b4f5ff43785e0ece8|mode=100644
lib/homepage-control-types.ts|82f0171bbaf5a28fc5475355b7bb7ddcacfd4023b52d712b7dc2c83244215f91|mode=100644
```

## Static Security Signals
```text
SERVER_ONLY=NO
PATCH_HANDLER=YES
NODE_RUNTIME=YES
FORCE_DYNAMIC=YES
ADMIN_SESSION=YES
ADMIN_CSRF=YES
UUID_VALIDATION=YES
BODY_SIZE_LIMIT=YES
CONTENT_TYPE_CHECK=YES
NO_STORE=YES
NOSNIFF=YES
UNAUTHORIZED_DETAIL_LOGGING=YES
DYNAMIC_BODY_ERROR_RESPONSE=YES
DEPENDENCY_ERROR_WARNING_LOGGING=YES
PARTIAL_OPERATIONAL_FILTER=YES
RAW_RESULT_ERRORS_RETURN=YES
RAW_RESULT_WARNINGS_RETURN=YES
UPDATE_HELPER_CALL=YES
AUTH_ENV_ACCESS=YES
AUTH_TIMING_SAFE_COMPARE=YES
AUTH_CSRF_HEADER_COOKIE_MATCH=YES
ADMIN_DEP_SERVER_SCOPED=YES
ADMIN_DEP_SUPABASE=YES
ADMIN_DEP_RAW_ERROR_MESSAGES=YES
```

## Narrow Findings

1. **Server isolation gap**
   - the route does not declare `import "server-only";`;
   - the immediate admin helper is already server-scoped and uses the privileged admin client.

2. **Unauthorized logging gap**
   - the route logs `adminSession.errors`;
   - those strings can disclose whether configuration, cookies, signatures, roles, or expiry checks failed;
   - the route should emit one fixed categorical unauthorized event without details.

3. **Request-body error gap**
   - `readJsonBody` throws fixed input messages;
   - the catch dynamically returns `error.message`;
   - the future patch should use an explicit typed request error or fixed local classification rather than arbitrary message propagation.

4. **Dependency-result boundary gap**
   - the helper may return validation errors, warnings, and operational/database-derived strings;
   - the route partially hides operational errors using message-prefix matching;
   - it logs raw `result.errors` and `result.warnings`;
   - classification must be explicit and fail closed rather than inferred from mutable string prefixes.

## Proposed Focused Static Test Contract

The future test should verify:

1. **Server and runtime boundary**
   - `app/api/admin/homepage-control/drafts/[id]/route.ts` imports `server-only`;
   - node runtime and force-dynamic exports remain;
   - no client marker exists.

2. **Admin authorization**
   - session verification precedes mutation;
   - CSRF verification precedes mutation;
   - unauthorized logging uses one fixed categorical event;
   - no session error array, cookie, signature, actor payload, or token value is logged.

3. **Request validation**
   - UUID, JSON content type, body-size limit, and object-body checks remain;
   - request failures use explicit typed or bounded local classification;
   - no arbitrary `Error.message`, stack, cause, or raw thrown value is returned.

4. **Mutation containment**
   - only `updateHomepageControlDraft` performs the route mutation;
   - route success retains the parsed draft and bounded warnings;
   - dependency operational failures map to one generic client error;
   - no raw Supabase/database metadata reaches logs or responses.

5. **Secret-safe logging**
   - fixed categorical events only:
     - `homepage_draft_update_unauthorized`
     - `homepage_draft_update_failed`
     - `homepage_draft_update_unexpected_failure`
   - no raw errors, warnings, session diagnostics, request body, draft data, actor data, ID, stack, or cause is logged.

6. **Existing safeguards preserved**
   - no-store and nosniff headers;
   - 401 unauthorized response;
   - 403 CSRF response;
   - 404 malformed-ID response;
   - bounded request error statuses;
   - existing success response shape.

## Test Harness Recommendation
```text
PREFERRED_ACTION=CREATE_NEW_FOCUSED_STATIC_TEST
PREFERRED_PATH=testing/homepage-draft-route-security-static-assertions.mjs
RATIONALE=Existing candidates are discovery-route tests and do not own this homepage-control admin mutation boundary.
```

## Recommended Successor
```text
AUTHORIZE_HOMEPAGE_DRAFT_ROUTE_FOCUSED_TEST_PATCH_ONLY
```

## System Layer Progress Report
- Governance / phase control: `HOMEPAGE_DRAFT_TEST_CONTRACT_PENDING_REVIEW`
- Static verification: `NARROW_CONTEXT_COMPLETE`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `DORMANT`
- Security hardening: `HOMEPAGE_DRAFT_ACTIVE`
- Admin route safety: `BOUNDARY_GAPS_CONFIRMED`
- Middleware / proxy safety: `NO`
- Secret-safe logging: `GAP_CONFIRMED`
- CSRF protection: `PRESENT_AND_PRESERVE`
- Admin session protection: `PRESENT_AND_PRESERVE`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27EZ_HOMEPAGE_DRAFT_SECURITY_TEST_CONTRACT_PLAN`
- `REQUEST_CHANGES_PHASE_27EZ_SCOPE_OR_INVARIANTS`
- `BLOCK_PHASE_27EZ_PENDING_DEPENDENCY_ERROR_CLASSIFICATION_RECONCILIATION`

If approving, select:
- `AUTHORIZE_HOMEPAGE_DRAFT_ROUTE_FOCUSED_TEST_PATCH_ONLY`
- `AUTHORIZE_HOMEPAGE_DRAFT_ROUTE_TEST_AND_SOURCE_PATCH_TOGETHER`
- `SELECT_HOMEPAGE_DRAFT_NARROWER_CONTEXT_REVIEW_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether the proposed test file may be created, whether source modification is authorized, and whether any test execution is authorized. Unless explicitly stated, source modification and execution remain prohibited.
