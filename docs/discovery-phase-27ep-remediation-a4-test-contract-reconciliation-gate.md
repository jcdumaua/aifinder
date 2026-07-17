# AiFinder Phase 27EP — Remediation A4 Test Contract Reconciliation Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: 8b43bc1b762712598430482f5f78afe7a590a5ac
Authorized workstream: AUTHORIZE_A4_ROUTE_SERVER_ONLY_PATCH_AND_FOCUSED_RETEST
Application runtime: NOT_STARTED
Database access: NO
```

## Preserved Route Identity After Rollback
```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts|3a6f9431e9f05f0dabdcc589a99e18e02f244d8d5f57a97e746690d049ca65f4|mode=100644
```

## Authorized Reversible Probe
```text
PROBE_PATCH=ADD_EXPLICIT_SERVER_ONLY_BOUNDARY_ONLY
PROBE_ROUTE_SHA256=292a0de515129e5efe1e37297483c205369f7a8548b22f68bf1ed13bcac51fdd
FOCUSED_TEST_FILE=testing/discovery-candidate-decision-api-static-assertions.mjs
FOCUSED_TEST_SHA256=031462359204c15be1cf77284fd39d07520ecf5f4d142125f613ac3ffb243609
TEST_EXIT_CODE=1
SERVER_ONLY_FAILURE_CLEARED=YES
RESULT_CLASS=SERVER_ONLY_GAP_CLEARED_TEST_CONTRACT_MISMATCH_REMAINS
FIRST_REMAINING_FAILURE=A4 decision route missing marker: export async function POST
ROUTE_PROBE_ROLLED_BACK=YES
RAW_TRACE_RETAINED=NO
PATH_DATA_RETAINED=NO
```

## Reconciliation Finding
The approved one-line route remediation clears the real A4 `server-only` failure. The focused harness then fails on a separate string-level assertion that does not represent the approved minimal remediation contract.

The current route uses:
- `export const POST = createCandidateDecisionHandler();` rather than a function declaration;
- validated decision-input propagation rather than requiring a literal `requestCorrelationId` at the route call site;
- `Cache-Control: no-store` response headers rather than a `cache: "no-store"` source marker;
- bounded error-message handling that includes the literal `error.message`.

Rewriting these unrelated implementation details solely to satisfy source-string checks would exceed the approved minimal A4 remediation.

## Scope Verification
```text
EVIDENCE_GATE_COMMITTED=1
ROUTE_PROBE_FILES_MODIFIED=1
ROUTE_PROBE_ROLLED_BACK=YES
FINAL_ROUTE_FILES_MODIFIED=0
TEST_FILES_MODIFIED=0
DOCUMENTS_CREATED=1
FOCUSED_TEST_EXECUTION=1
OTHER_TEST_EXECUTION=0
APPLICATION_RUNTIME=NOT_STARTED
ENVIRONMENT_VALUE_ACCESS=NO
DATABASE_ACCESS=NO
DATABASE_MUTATION=NO
OPERATIONAL_REACTIVATION=BLOCKED
```

## Recommended Successor
```text
AUTHORIZE_A4_TEST_CONTRACT_CORRECTION_ONLY
```

The corrected test should:
- accept the existing exported POST handler contract;
- verify correlation propagation through the validated decision input;
- require the existing `Cache-Control` no-store response header;
- distinguish bounded error handling from raw error-detail exposure;
- retain the explicit `server-only` requirement.

No route source modification or test execution should occur until the corrected test patch is independently reviewed.

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27EP_A4_TEST_CONTRACT_RECONCILIATION`
- `REQUEST_CHANGES_PHASE_27EP_RECONCILIATION_EVIDENCE`
- `BLOCK_PHASE_27EP_PENDING_ROUTE_CONTRACT_REVIEW`

If approving, select:
- `AUTHORIZE_A4_TEST_CONTRACT_CORRECTION_ONLY`
- `AUTHORIZE_A4_ROUTE_AND_TEST_REVISION_TOGETHER`
- `REQUEST_DIFFERENT_A4_SUCCESSOR`

State explicitly whether the focused test file may be corrected. Route-source modification and test execution remain prohibited unless separately authorized.
