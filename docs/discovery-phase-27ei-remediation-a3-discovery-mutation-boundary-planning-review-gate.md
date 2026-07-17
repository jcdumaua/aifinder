# AiFinder Phase 27EI — Remediation A3 Discovery Mutation Boundary Planning Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: feb2a127376e34900d269e6cd155ee0a9a419454
Selected workstream: A3_DISCOVERY_MUTATION_BOUNDARY
Source modification: NOT_AUTHORIZED
Test execution: NOT_AUTHORIZED
Runtime posture: DORMANT
```

## Exact A3 Targets
```text
lib/discovery/discovery-candidate-decision-admin.ts|6f863903522114358f0e8c3ffc78cfdc3974a81ef52bf7c1b4d6701edc9ffbbe|mode=100644
lib/discovery/discovery-candidate-staging-admin.ts|f164323723a58b25a2231a40e15dd407feb24676321371eeb76c404461bfe7fd|mode=100644
```

## Decision Mutation Signals
```text
SERVER_ONLY=NO
DYNAMIC_ADMIN_IMPORT=YES
CLIENT_INJECTION=YES
RPC_CALLS=1
MUTATION_TOTAL=1
INPUT_VALIDATION=YES
ACTOR_SANITIZATION=YES
CORRELATION_ID=YES
GENERIC_ERROR_MAPPING=YES
RAW_ERROR_DETAILS_RETURNED=NO
```

## Staging Mutation Signals
```text
SERVER_ONLY=YES
DYNAMIC_ADMIN_IMPORT=YES
CLIENT_INJECTION=YES
INSERT_CALLS=1
MUTATION_TOTAL=1
INPUT_VALIDATION=YES
CORRELATION_ID=YES
EXPLICIT_PROJECTION=YES
SELECT_STAR=NO
GENERIC_ERROR_MAPPING=YES
RAW_ERROR_DETAILS_RETURNED=NO
```

## Importer Inventory

### Decision
```text
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts|NO_CLIENT_MARKER
testing/admin-shell-supabase-read-hardening.test.mjs|NO_CLIENT_MARKER
testing/discovery-candidate-decision-api-static-assertions.mjs|NO_CLIENT_MARKER
```

### Staging
```text
lib/discovery/discovery-candidate-extraction-mapper.ts|NO_CLIENT_MARKER
lib/discovery/discovery-candidate-extraction-staging-pipeline.ts|NO_CLIENT_MARKER
lib/discovery/discovery-candidate-preview-live-staging-resolver.ts|NO_CLIENT_MARKER
testing/discovery-candidate-staging-admin.test.mjs|NO_CLIENT_MARKER
testing/discovery-candidate-staging-live-smoke.mjs|NO_CLIENT_MARKER
testing/discovery-candidate-staging-rls-smoke.mjs|NO_CLIENT_MARKER
```

## Relevant Existing Test Candidates
```text
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-decision-api-static-assertions.mjs
testing/discovery-candidate-decision-execution-preflight.mjs
testing/discovery-candidate-decision-read-only-listing-gate.mjs
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-invocation.test.mjs
testing/discovery-candidate-extraction-live-staging-panel.test.mjs
testing/discovery-candidate-extraction-mapper.test.mjs
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
testing/discovery-candidate-normalizer.test.mjs
testing/discovery-candidate-preview-live-staging-resolver.test.mjs
testing/discovery-candidate-preview-provider.test.mjs
testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
testing/discovery-candidate-preview-route.test.mjs
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
testing/discovery-candidate-queue-fail-closed-presentation-smoke.mjs
testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-rls-smoke.mjs
```

## A3 Classification
```text
REQUIRES_DECISION_SERVER_ONLY_BOUNDARY
```

## Recommended Successor
```text
AUTHORIZE_A3_FOCUSED_TEST_PATCH_ONLY
```

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27EI_A3_DISCOVERY_MUTATION_BOUNDARY_PLAN`
- `REQUEST_CHANGES_PHASE_27EI_A3_SCOPE_OR_CLASSIFICATION`
- `BLOCK_PHASE_27EI_PENDING_MUTATION_SURFACE_RECONCILIATION`

If approving, select:
- `AUTHORIZE_A3_FOCUSED_TEST_PATCH_ONLY`
- `AUTHORIZE_A3_TEST_AND_SOURCE_PATCH_TOGETHER`
- `SELECT_A3_NARROW_CONTEXT_REVIEW_FIRST`
- `REQUEST_DIFFERENT_A3_SUCCESSOR`

State explicitly whether test modification, source modification, or focused execution is authorized. Unless explicitly stated, all remain prohibited.
