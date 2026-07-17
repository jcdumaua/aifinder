# AiFinder Phase 27EQ — Remediation A4 Corrected Test Contract Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: b550387e623bbae66bff1c2c753108faaccc01b0
Authorized workstream: AUTHORIZE_A4_TEST_CONTRACT_CORRECTION_ONLY
Route modification: NO
Test execution: NOT_PERFORMED
Runtime posture: DORMANT
```

## Exact Test Correction Scope
```text
testing/discovery-candidate-decision-api-static-assertions.mjs|before=031462359204c15be1cf77284fd39d07520ecf5f4d142125f613ac3ffb243609|after=71ea505fd0ddd061b926d1976ed8d0a5fa2729ef2d59ad4bb91d5ed8114c4f8a|mode=100644
```

## Preserved A4 Route Identity
```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts|3a6f9431e9f05f0dabdcc589a99e18e02f244d8d5f57a97e746690d049ca65f4|mode=100644
```

## Corrected A4 Contract
```text
A4_ASSERTION_COUNT=13
TEST_REQUIRES_SERVER_ONLY=YES
TEST_ACCEPTS_EXPORTED_POST_HANDLER=YES
TEST_ACCEPTS_VALIDATED_CORRELATION_PROPAGATION=YES
TEST_REQUIRES_NO_STORE_HEADER=YES
TEST_REQUIRES_BOUNDED_FALLBACK_ERROR=YES
TEST_REJECTS_RAW_ERROR_DETAILS=YES
TEST_REJECTS_CLIENT_MARKERS=YES
OBSOLETE_ASYNC_POST_ASSERTION_REMOVED=YES
OBSOLETE_CACHE_OPTION_ASSERTION_REMOVED=YES
OBSOLETE_LITERAL_CORRELATION_ASSERTION_REMOVED=YES
OBSOLETE_ERROR_MESSAGE_BAN_REMOVED=YES
```

## Correction Summary
The focused A4 contract now verifies security behavior without dictating unrelated implementation style:

- accepts the existing exported POST handler constant;
- verifies propagation of the validated decision input, which carries bounded correlation metadata;
- requires the existing `Cache-Control: no-store` response header;
- requires the bounded generic mutation-failure response;
- continues rejecting raw error-detail fields and client-component markers;
- retains the explicit `server-only` boundary requirement.

## Scope Verification
```text
TEST_FILES_MODIFIED=1
ROUTE_FILES_MODIFIED=0
OTHER_SOURCE_FILES_MODIFIED=0
DOCUMENTS_CREATED=1
TEST_EXECUTION=NOT_PERFORMED
APPLICATION_RUNTIME=NOT_STARTED
ENVIRONMENT_VALUE_ACCESS=NO
DATABASE_ACCESS=NO
OPERATIONAL_REACTIVATION=BLOCKED
```

## Recommended Successor
```text
AUTHORIZE_A4_CORRECTED_TEST_COMMIT_ROUTE_PATCH_AND_FOCUSED_RETEST
```

Upon approval, the next combined script should:
1. commit and push the corrected focused test and this review gate;
2. verify remote identities;
3. add only the explicit `server-only` boundary to `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts`;
4. execute only `testing/discovery-candidate-decision-api-static-assertions.mjs`;
5. require the A4, A3, and legacy success markers;
6. create the A4 proof-of-remediation gate and complete next-script data.

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27EQ_A4_CORRECTED_TEST_CONTRACT`
- `REQUEST_CHANGES_PHASE_27EQ_A4_CORRECTED_CONTRACT`
- `BLOCK_PHASE_27EQ_PENDING_CONTRACT_RECONCILIATION`

If approving, select:
- `AUTHORIZE_A4_CORRECTED_TEST_COMMIT_ROUTE_PATCH_AND_FOCUSED_RETEST`
- `AUTHORIZE_A4_CORRECTED_TEST_COMMIT_ONLY`
- `SELECT_A4_CORRECTED_TEST_REVISION_FIRST`
- `REQUEST_DIFFERENT_A4_SUCCESSOR`

State explicitly whether the corrected test and this gate may be committed and pushed, whether `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts` may be modified only by adding the server-only boundary, and whether focused execution of only `testing/discovery-candidate-decision-api-static-assertions.mjs` is authorized.
