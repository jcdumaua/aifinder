# AiFinder Phase 27FG — Discovered Tool Approve Failing Baseline and Remediation Planning Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: 4f282bfb959250abb6a38e584384ac19bda5fc91
Recovery mode: RESUMED_AFTER_ASSERTION_PREFIX_NORMALIZATION
Authorized execution: testing/discovered-tool-approve-route-security-static-assertions.mjs
Source modification: NO
Application runtime: NOT_STARTED
Database access: NO
```

## Preserved Identities
```text
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts|360a8f894e0694c924ad1d6952c79793de845fbbac0619af219cebb1f4212588|mode=100644
lib/admin-auth.ts|b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc|mode=100644
lib/admin-rate-limit.ts|83005203a7aa47b7af6d77ff96519524a3f08341649257fe125d44c3ad3e670b|mode=100644
lib/supabase-admin.ts|fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae|mode=100644
testing/discovered-tool-approve-route-security-static-assertions.mjs|2a5edb5e824b84d64d6bbf6cec808be3531d686fc256b249e561d568d4892b5a|mode=100644
```

## Focused Failing Baseline
```text
TEST_EXIT_CODE=1
ASSERTION_COUNT=48
SUCCESS_MARKER=ABSENT
RESULT_CLASS=EXPECTED_FAILING_BASELINE_CAPTURED
FIRST_FAILED_ASSERTION=discovered tool approve route missing marker: import "server-only";
RAW_TRACE_RETAINED=NO
```

## Baseline Interpretation
The focused harness correctly failed at the first approved invariant: the route lacks `import "server-only";`. The earlier attempt had already captured this same failure but rejected it because the Node assertion prefix had not been normalized. No source changed.

## Proposed Narrow Route Remediation

Only `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` should be eligible for the future patch.

The patch should:

1. add `import "server-only";`;
2. preserve node runtime and force-dynamic exports;
3. preserve POST as the sole mutation handler;
4. preserve session and CSRF verification before rate limiting and RPC mutation;
5. preserve approve-specific rate limiting before the RPC;
6. replace unauthorized detail logging with `console.warn("discovered_tool_approve_unauthorized")`;
7. remove `getSafeApprovalError` and raw-message substring classification;
8. never log session diagnostics, RPC messages, request data, actor data, IDs, RPC arguments, stacks, or causes;
9. map RPC failures to `console.error("discovered_tool_approve_failed")` and fixed client error `Failed to approve discovered tool.`;
10. wrap unexpected failures with `console.error("discovered_tool_approve_unexpected_failure")` and the same fixed generic response;
11. preserve the exact `approve_discovered_tool` RPC and actor arguments;
12. preserve UUID validation, no-store, nosniff, 401, 403, 429, 400 invalid-ID, and approved-tool ID success behavior;
13. leave all dependencies and the focused test unchanged.

## Recommended Successor
```text
AUTHORIZE_DISCOVERED_TOOL_APPROVE_ROUTE_PATCH_AND_FOCUSED_RETEST
```

## System Layer Progress Report
- Governance / phase control: `DISCOVERED_TOOL_APPROVE_FAILING_BASELINE_PENDING_REVIEW`
- Static verification: `EXPECTED_FAILING_BASELINE_CAPTURED`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `FOCUSED_STATIC_ONLY`
- Security hardening: `DISCOVERED_TOOL_APPROVE_PATCH_PLANNED`
- Service-role isolation: `DEPENDENCY_ALREADY_HARDENED`
- Admin route safety: `GAP_EMPIRICALLY_CONFIRMED`
- Secret-safe logging: `PATCH_REQUIRED`
- CSRF protection: `PRESENT_AND_PRESERVE`
- Admin rate limiting: `PRESENT_AND_PRESERVE`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27FG_DISCOVERED_TOOL_APPROVE_FAILING_BASELINE_AND_REMEDIATION_PLAN`
- `REQUEST_CHANGES_PHASE_27FG_DISCOVERED_TOOL_APPROVE_PATCH_PLAN`
- `BLOCK_PHASE_27FG_PENDING_FAILURE_CLASSIFICATION_RECONCILIATION`

If approving, select:
- `AUTHORIZE_DISCOVERED_TOOL_APPROVE_ROUTE_PATCH_AND_FOCUSED_RETEST`
- `AUTHORIZE_DISCOVERED_TOOL_APPROVE_ROUTE_PATCH_ONLY`
- `SELECT_DISCOVERED_TOOL_APPROVE_NARROWER_PATCH_PLANNING_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether only `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` may be modified and whether execution of only `testing/discovered-tool-approve-route-security-static-assertions.mjs` is authorized.
