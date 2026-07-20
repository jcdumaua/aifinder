# AiFinder Phase 27FL — Discovered Tool Duplicate Source Hardening Patch Planning Gate

## Status
`PENDING_GEMINI_REVIEW`

## Approved Predecessor
```text
Phase: 27FK
Commit: 52b81618843db7bb689bd8a5f7d0068dc2b6b8db
Determination: APPROVE_PHASE_27FK_DISCOVERED_TOOL_DUPLICATE_FAILING_BASELINE_EVIDENCE
Authorized successor: AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PATCH_PLANNING
Runtime posture: DORMANT
Operational reactivation: BLOCKED
```

## Exact Planning Scope
```text
TARGET=app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
TARGET_SHA256=80be444e27a208559ed724c7bbf79358f12888d31f245cec54e3cf3d91165cdd
TARGET_MODE=100644
FOCUSED_TEST=testing/discovered-tool-duplicate-route-security-static-assertions.mjs
FOCUSED_TEST_SHA256=1e0c6dec77365baccc36b61f312746bd02f86306ee7cb783691d8f756d17d1b8
FOCUSED_TEST_MODE=100644
DOCUMENT_CREATED=docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md
SOURCE_MODIFICATION=NO
TEST_EXECUTION=NO
APPLICATION_RUNTIME=NO
DATABASE_ACCESS=NO
ENVIRONMENT_VALUE_ACCESS=NO
COMMIT=NO
PUSH=NO
```

## Static Inspection Summary
```text
SOURCE_LINES=325
IMPORT_STATEMENTS=4
POST_HANDLER_DECLARATIONS=1
CONSOLE_CALL_SITES=5
DYNAMIC_ERROR_RESPONSE_CANDIDATES=0
SERVER_ONLY_DIRECTIVE_COUNT=0
```

The inspection is structural only. No environment files or values were opened, no application code was executed, no request handler was invoked, and no database or external service was contacted.

## Remediation Objective

Prepare one contained source patch for `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` that satisfies the committed 48-assertion static security contract without changing the route's authorized behavior, validation limits, headers, status semantics, or four-stage mutation order.

## Planned Source Changes

### 1. Server-only boundary

Add the exact top-level directive:

```ts
import "server-only";
```

The directive must remain statically detectable and must not alter the existing Node runtime or force-dynamic declarations.

### 2. Fixed categorical logging

Introduce a route-local logging helper or equivalent fixed-event mechanism. Log calls must accept only predefined event names and bounded categorical fields. They must never include:

- raw RPC, database, Supabase, session, token, cookie, actor, request-body, or exception messages;
- serialized error objects;
- stack traces;
- filenames, paths, row contents, identifiers, or user-provided strings;
- partial-completion wording.

The source patch must provide the six fixed categorical events required by the committed test contract. Event names and allowed fields must remain literal and reviewable.

### 3. Generic operational error mapper

Add a route-local fixed generic client-error response for operational failures. The client response must not interpolate `error.message`, RPC diagnostics, database details, or caught values.

The generic operational failure must preserve the route's established response format and use only a fixed message and fixed status selected by the approved implementation gate.

### 4. Outer exception boundary

Wrap the mutation workflow in an outer exception boundary that:

- preserves the existing session → CSRF → rate-limit ordering;
- preserves validation limits and allowlists;
- preserves the existing not-found behavior;
- preserves the four-stage mutation sequence: load → insert → update → audit;
- emits only the approved categorical unexpected-failure event;
- returns only the fixed generic operational error;
- does not claim rollback, atomicity, or partial completion.

### 5. Stage-specific operational handling

For failures already returned by the four mutation stages, replace any raw diagnostic logging or dynamic client response with fixed categorical events and the generic operational error mapping.

The patch must not:

- add inserts, updates, deletes, RPC calls, retries, transactions, or compensating writes;
- reorder the four mutation stages;
- redesign atomicity;
- alter dependencies;
- modify `lib/admin-auth.ts`, `lib/admin-rate-limit.ts`, or `lib/supabase-admin.ts`;
- alter success response status `201`, required headers, or existing not-found semantics.

## Verification Plan After Separate Implementation Authorization

The implementation phase should:

1. verify the exact Phase 27FL-approved source baseline and test identity;
2. modify only `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`;
3. run only `node testing/discovered-tool-duplicate-route-security-static-assertions.mjs`;
4. require all 48 assertions and the exact success marker;
5. perform no application runtime, network, environment, or database access;
6. produce a source diff and focused-test evidence for Gemini review;
7. leave commit and push blocked unless explicitly authorized by that review.

## Atomicity Boundary

```text
ATOMICITY_PROVEN=NO
ATOMICITY_REDESIGN_AUTHORIZED=NO
TRANSACTIONAL_CHANGE_PLANNED=NO
PARTIAL_COMPLETION_CLAIM_ALLOWED=NO
```

This phase does not represent the four mutations as atomic. It preserves the current mutation structure and confines remediation to boundary enforcement, diagnostic sanitization, and fixed operational failure handling.

## Proposed Successor

```text
AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PATCH_IMPLEMENTATION
```

## Gemini Review Request

Select exactly one:

- `APPROVE_PHASE_27FL_DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PATCH_PLAN`
- `REQUEST_CHANGES_PHASE_27FL_DISCOVERED_TOOL_DUPLICATE_PATCH_PLAN`
- `BLOCK_PHASE_27FL_PENDING_LOG_EVENT_OR_ERROR_MAPPING_RECONCILIATION`

If approving, select exactly one successor:

- `AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PATCH_IMPLEMENTATION`
- `AUTHORIZE_DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PATCH_PLAN_COMMIT_ONLY`
- `SELECT_DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PLAN_REVISION_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether modification of only `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` is authorized, whether focused execution of only `testing/discovered-tool-duplicate-route-security-static-assertions.mjs` is authorized after patching, and whether the Phase 27FL planning gate may be committed and pushed. Runtime application execution, database access, environment-value access, dependency modification, transactional redesign, and operational reactivation remain prohibited unless separately authorized.

=== NEXT SCRIPT INPUT DATA START ===
CURRENT_COMMIT=52b81618843db7bb689bd8a5f7d0068dc2b6b8db
CURRENT_PHASE_RESULT=DISCOVERED_TOOL_DUPLICATE_FAILING_BASELINE_APPROVED
NEXT_WORKSTREAM=DISCOVERED_TOOL_DUPLICATE_SOURCE_HARDENING_PATCH_IMPLEMENTATION
TARGET=app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
TARGET_SHA256=80be444e27a208559ed724c7bbf79358f12888d31f245cec54e3cf3d91165cdd
TARGET_MODE=100644
FOCUSED_TEST_FILE=testing/discovered-tool-duplicate-route-security-static-assertions.mjs
FOCUSED_TEST_SHA256=1e0c6dec77365baccc36b61f312746bd02f86306ee7cb783691d8f756d17d1b8
FOCUSED_TEST_MODE=100644
ASSERTION_COUNT=48
EXPECTED_SUCCESS_MARKER=Discovered tool duplicate route security static assertions passed.
SOURCE_CHANGE_SCOPE=TARGET_ONLY
DEPENDENCY_MODIFICATION_STATUS=PROHIBITED
ATOMICITY_STATUS=NOT_ESTABLISHED_SEPARATE_AUTHORIZATION_REQUIRED
TEST_EXECUTION_STATUS=PROHIBITED_THIS_PHASE
APPLICATION_RUNTIME_STATUS=NOT_STARTED
DATABASE_STATUS=NOT_ACCESSED
ENVIRONMENT_VALUE_ACCESS=NO
COMMIT_STATUS=NOT_PERFORMED
PUSH_STATUS=NOT_PERFORMED
OPERATIONAL_REACTIVATION=BLOCKED
FINAL_REPOSITORY_STATE=ONE_UNTRACKED_PHASE_27FL_PLANNING_GATE
=== NEXT SCRIPT INPUT DATA END ===
