# AiFinder Phase 27EK — Remediation A3 Focused Test Failing Baseline Evidence Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: a21898206f892a42bb252d6c661b1d6d3bd67553
Authorized workstream: AUTHORIZE_A3_FOCUSED_TEST_PATCH_COMMIT_AND_EXECUTION
Executed file: testing/discovery-candidate-decision-api-static-assertions.mjs
Source modification: NO
Application runtime: NOT_STARTED
Database access: NO
```

## Preserved A3 Source Identities
```text
lib/discovery/discovery-candidate-decision-admin.ts|6f863903522114358f0e8c3ffc78cfdc3974a81ef52bf7c1b4d6701edc9ffbbe|mode=100644
lib/discovery/discovery-candidate-staging-admin.ts|f164323723a58b25a2231a40e15dd407feb24676321371eeb76c404461bfe7fd|mode=100644
```

## Bounded Execution Evidence
```text
TEST_EXIT_CODE=1
A3_CONTRACT_ASSERTION_COUNT=19
RESULT_CLASS=EXPECTED_A3_FAILING_BASELINE_CAPTURED
FIRST_FAILED_ASSERTION=decision helper missing marker: import "server-only";
RAW_TRACE_RETAINED=NO
PATH_DATA_RETAINED=NO
```

The focused static harness stops at the first failed assertion. This phase therefore records the first observed failure rather than claiming a total failing-assertion count.

## Previously Established Static State
```text
DECISION_SERVER_ONLY=NO
DECISION_RPC_CALLS=1
DECISION_INPUT_VALIDATION=YES
DECISION_ACTOR_SANITIZATION=YES
DECISION_CORRELATION_ID=YES
STAGING_SERVER_ONLY=YES
STAGING_INSERT_CALLS=1
STAGING_INPUT_VALIDATION=YES
STAGING_CORRELATION_ID=YES
STAGING_EXPLICIT_PROJECTION=YES
STAGING_SELECT_STAR=NO
```

## Scope Verification
```text
TEST_FILES_COMMITTED=1
SOURCE_FILES_MODIFIED=0
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
AUTHORIZE_A3_DECISION_SERVER_ONLY_PATCH_AND_FOCUSED_RETEST
```

The minimal expected remediation is restricted to `lib/discovery/discovery-candidate-decision-admin.ts`:
- add an explicit `server-only` boundary;
- preserve the existing fixed RPC target;
- preserve input validation, actor sanitization, and correlation metadata;
- preserve generic error mapping;
- leave `lib/discovery/discovery-candidate-staging-admin.ts` unchanged.

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27EK_A3_FAILING_BASELINE_EVIDENCE`
- `REQUEST_CHANGES_PHASE_27EK_A3_EVIDENCE_CONTRACT`
- `BLOCK_PHASE_27EK_PENDING_TEST_HARNESS_RECONCILIATION`

If approving, select:
- `AUTHORIZE_A3_DECISION_SERVER_ONLY_PATCH_AND_FOCUSED_RETEST`
- `AUTHORIZE_A3_DECISION_SERVER_ONLY_PATCH_ONLY`
- `SELECT_A3_TEST_PATCH_REVISION_FIRST`
- `REQUEST_DIFFERENT_A3_SUCCESSOR`

State explicitly whether `lib/discovery/discovery-candidate-decision-admin.ts` may be modified and whether focused execution of only `testing/discovery-candidate-decision-api-static-assertions.mjs` is authorized. Unless explicitly stated, both remain prohibited.
