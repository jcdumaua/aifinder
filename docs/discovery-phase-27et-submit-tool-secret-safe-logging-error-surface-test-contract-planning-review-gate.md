# AiFinder Phase 27ET — Submit Tool Secret-Safe Logging and Error-Surface Test Contract Planning Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: 67da714d68aa32a8664909035b34af9e836d43e7
Selected surface: app/api/submit-tool/route.ts
Source inspection: AUTHORIZED_AND_COMPLETED
Test modification: NOT_AUTHORIZED
Source modification: NOT_AUTHORIZED
Test execution: NOT_AUTHORIZED
Runtime posture: DORMANT
```

## Exact Inspected Identities
```text
app/api/submit-tool/route.ts|99f74337fadaf7ba432a2e6daa9e3b3fa07cd5fa43ba07093024ccb929f77930|mode=100644
lib/tool-validation.ts|8eeb0d48673ca7e2f468a636e9d4a87958e5a99388c420fbdb7023284b5c0fba|mode=100644
```

## Route Security Signals
```text
SERVER_ONLY=NO
CLIENT_MARKER=NO
POST_HANDLER=YES
SERVICE_ROLE_ENV_NAME=YES
SUPABASE_URL_ENV_NAME=YES
DIRECT_CREATE_CLIENT=YES
AUTH_PERSIST_DISABLED=YES
SUBMITTED_TOOLS_INSERT=YES
DUPLICATE_TOOLS_READ=YES
DUPLICATE_SUBMISSIONS_READ=YES
RATE_LIMIT=YES
BODY_SIZE_LIMIT=YES
CONTENT_TYPE_CHECK=YES
HONEYPOT=YES
VALIDATION_IMPORT=YES
NO_STORE_HEADER=YES
NOSNIFF_HEADER=YES
DB_ERROR_MESSAGE_LOG_COUNT=3
OUTER_ERROR_MESSAGE_RETURN=YES
GENERIC_DB_CLIENT_RESPONSE=YES
GENERIC_CONFIG_RESPONSE=YES
RAW_STACK_RETURN=NO
RAW_ERROR_OBJECT_RETURN=YES
CLASSIFICATION=REQUIRES_SERVER_ONLY_LOG_SANITIZATION_AND_PUBLIC_ERROR_BOUNDARY
```

## Validation Dependency Invariants to Preserve
```text
CONTROL_CHARACTER_REJECTION=YES
UNSAFE_CONTENT_REJECTION=YES
HTTPS_ONLY_URLS=YES
PRIVATE_AND_LOCAL_HOST_BLOCK=YES
DIRECT_DOWNLOAD_EXTENSION_BLOCK=YES
OPTIONAL_EMAIL_VALIDATION=YES
```

## Direct Consumer Inventory
```text
IMPORTER_COUNT=1
app/submit/page.tsx
```

## Existing Focused Test Candidates
```text
TEST_CANDIDATE_COUNT=1
testing/accessibility-qa.spec.ts
```

## Proposed Focused Static Test Contract
The future test patch should verify:

1. **Server isolation**
   - `app/api/submit-tool/route.ts` declares `import "server-only";`.
   - no client-component marker exists.

2. **Privileged-client containment**
   - service-role environment names remain server-side only;
   - the Supabase client disables session persistence;
   - mutation remains restricted to `submitted_tools`;
   - no secret or environment value is interpolated into logs or responses.

3. **Secret-safe logging**
   - database error objects and `.message` values are not passed to `console.*`;
   - logs use fixed categorical messages only;
   - no stack, cause, credential, URL, key, token, or submitted-field payload is logged.

4. **Public error boundary**
   - unexpected exceptions return one fixed generic submission-failure message;
   - validation failures may retain bounded user-safe validation messages only if explicitly classified;
   - raw error objects, stack traces, causes, and database messages are never returned;
   - known configuration and database failures retain fixed generic client messages.

5. **Existing safeguards preserved**
   - rate limiting;
   - JSON content-type enforcement;
   - request-size limit;
   - honeypot behavior;
   - no-store and nosniff headers;
   - duplicate-domain checks;
   - validation dependency protections listed above.

## Test Harness Recommendation
```text
PREFERRED_ACTION=CREATE_NEW_FOCUSED_STATIC_TEST
PREFERRED_PATH=testing/submit-tool-secret-safe-boundary-static-assertions.mjs
RATIONALE=Existing candidates do not coherently own this public route's privileged-client, logging, and public-error contract.
```

## Recommended Successor
```text
AUTHORIZE_SUBMIT_TOOL_FOCUSED_TEST_PATCH_ONLY
```

## System Layer Progress Report
- Governance / phase control: `SUBMIT_TOOL_TEST_CONTRACT_PLANNING_PENDING_REVIEW`
- Static verification: `NARROW_CONTEXT_COMPLETE`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `DORMANT`
- Security hardening: `REQUIRES_SERVER_ONLY_LOG_SANITIZATION_AND_PUBLIC_ERROR_BOUNDARY`
- Service-role isolation: `TARGET_REVIEW_ACTIVE`
- Admin route safety: `A1_A4_HARDENED`
- Public route safety: `SUBMIT_TOOL_ACTIVE`
- Secret-safe logging: `GAP_CONFIRMED`
- Public error surface: `GAP_CONFIRMED`
- Validation safeguards: `SUPPORTING_AND_PRESERVED`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27ET_SUBMIT_TOOL_SECURITY_TEST_CONTRACT_PLAN`
- `REQUEST_CHANGES_PHASE_27ET_SCOPE_OR_INVARIANTS`
- `BLOCK_PHASE_27ET_PENDING_ROUTE_DEPENDENCY_RECONCILIATION`

If approving, select:
- `AUTHORIZE_SUBMIT_TOOL_FOCUSED_TEST_PATCH_ONLY`
- `AUTHORIZE_SUBMIT_TOOL_TEST_AND_SOURCE_PATCH_TOGETHER`
- `SELECT_SUBMIT_TOOL_NARROWER_CONTEXT_REVIEW_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether the proposed test file may be created, whether source modification is authorized, and whether any test execution is authorized. Unless explicitly stated, source modification and execution remain prohibited.
