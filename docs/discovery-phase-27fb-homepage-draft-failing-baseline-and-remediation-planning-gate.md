# AiFinder Phase 27FB — Homepage Draft Failing Baseline and Remediation Planning Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: 813a58bb7e62bbbace14072562338fd34ce29625
Authorized execution: testing/homepage-draft-route-security-static-assertions.mjs
Source modification: NO
Application runtime: NOT_STARTED
Database access: NO
```

## Preserved Identities
```text
app/api/admin/homepage-control/drafts/[id]/route.ts|bb197c258f03f9e5db253cebaa89057314556e8c09539363925dae2b4e1ce2a9|mode=100644
lib/admin-auth.ts|b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc|mode=100644
lib/homepage-control-admin.ts|9bd03eee803bedf97a840c7b42a2cfb1a31400a8300eb22b4f5ff43785e0ece8|mode=100644
lib/homepage-control-types.ts|82f0171bbaf5a28fc5475355b7bb7ddcacfd4023b52d712b7dc2c83244215f91|mode=100644
testing/homepage-draft-route-security-static-assertions.mjs|824ee1f8b7e2e518ff79805102071cdcc3f955096c2c2073e37eb1e92ef8dbe6|mode=100644
```

## Focused Failing Baseline
```text
TEST_EXIT_CODE=1
ASSERTION_COUNT=39
SUCCESS_MARKER=ABSENT
RESULT_CLASS=EXPECTED_FAILING_BASELINE_CAPTURED
FIRST_FAILED_ASSERTION=homepage draft route missing marker: import "server-only";
RAW_TRACE_RETAINED=NO
```

## Baseline Interpretation
The dedicated harness failed at the first approved invariant: the selected route lacks `import "server-only";`. Because the harness is intentionally fail-fast, later contract failures were not executed or inferred as empirical results.

## Proposed Narrow Route Remediation

Only `app/api/admin/homepage-control/drafts/[id]/route.ts` should be eligible for the future patch.

The patch should:

1. add `import "server-only";`;
2. preserve node runtime and force-dynamic exports;
3. preserve admin-session and CSRF checks before mutation;
4. replace unauthorized detail logging with:
   - `console.warn("homepage_draft_update_unauthorized")`;
5. replace dynamic request-body error propagation with an explicit route-local typed request error or fixed bounded classification;
6. remove `hasOperationalError` string-prefix classification;
7. never log `adminSession.errors`, `result.errors`, `result.warnings`, request bodies, actor data, IDs, raw errors, stacks, or causes;
8. map dependency operational failure to:
   - `console.error("homepage_draft_update_failed")`;
   - client error `Unable to save Homepage Control Room draft.`;
9. wrap unexpected route failures with:
   - `console.error("homepage_draft_update_unexpected_failure")`;
   - the same fixed generic client error;
10. preserve bounded validation errors and warnings only when explicitly classified as non-operational;
11. preserve UUID, content-type, body-size, object-body, no-store, nosniff, 401, 403, 404, and success-shape behavior;
12. leave all dependencies and the focused test unchanged.

## Recommended Successor
```text
AUTHORIZE_HOMEPAGE_DRAFT_ROUTE_PATCH_AND_FOCUSED_RETEST
```

## System Layer Progress Report
- Governance / phase control: `HOMEPAGE_DRAFT_FAILING_BASELINE_PENDING_REVIEW`
- Static verification: `EXPECTED_FAILING_BASELINE_CAPTURED`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `FOCUSED_STATIC_ONLY`
- Security hardening: `HOMEPAGE_DRAFT_PATCH_PLANNED`
- Admin route safety: `GAP_EMPIRICALLY_CONFIRMED`
- Secret-safe logging: `PATCH_REQUIRED`
- CSRF protection: `PRESENT_AND_PRESERVE`
- Admin session protection: `PRESENT_AND_PRESERVE`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27FB_HOMEPAGE_DRAFT_FAILING_BASELINE_AND_REMEDIATION_PLAN`
- `REQUEST_CHANGES_PHASE_27FB_HOMEPAGE_DRAFT_PATCH_PLAN`
- `BLOCK_PHASE_27FB_PENDING_FAILURE_CLASSIFICATION_RECONCILIATION`

If approving, select:
- `AUTHORIZE_HOMEPAGE_DRAFT_ROUTE_PATCH_AND_FOCUSED_RETEST`
- `AUTHORIZE_HOMEPAGE_DRAFT_ROUTE_PATCH_ONLY`
- `SELECT_HOMEPAGE_DRAFT_NARROWER_PATCH_PLANNING_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether only `app/api/admin/homepage-control/drafts/[id]/route.ts` may be modified and whether execution of only `testing/homepage-draft-route-security-static-assertions.mjs` is authorized. Dependencies, other tests, runtime, database access, and operational reactivation remain prohibited unless separately authorized.
