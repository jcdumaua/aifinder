# AiFinder Phase 26AF — Revision CDX — GAP-060–GAP-062 Execution-Ready Static Script Specification

## Approved baseline

- `f0d7e8393327e93e6402d4339ec98aad2684346e`

## Scope

- Blockers: `GAP-060`, `GAP-061`, `GAP-062`
- Operation class: `READ_ONLY_PRODUCTION_DEPLOYMENT_METADATA_CHECK`
- Planned operation count: `1`
- Planned result rows: `1`
- Retry count: `0`
- Execution authorized: `NO`

## Script responsibilities

A future executable may:

1. Verify repository, origin, branch, baseline, and synchronization.
2. Verify the operator supplied an already reviewed non-secret platform category and target selector.
3. Verify the chosen command is read-only.
4. Execute exactly one metadata-only request.
5. Parse only the fixed allowlisted fields.
6. Reject all unexpected fields or cardinality.
7. Scan output for secret-like content.
8. Emit one normalized metadata row.
9. Preserve the original command exit status.
10. Copy a sanitized review package to the clipboard.

## Required inputs

Only these reviewed non-secret inputs may be accepted:

- `platform_category`
- `repository_expected`
- `branch_expected`
- `reviewed_target_selector`
- `timeout_seconds`
- `expected_result_count`

The script must not request or accept:

- Credentials.
- Tokens.
- Cookies.
- Environment values.
- Private URLs.
- Connection strings.
- Database identifiers.
- Deployment mutation parameters.

## Required output

Exactly one normalized record containing only:

- `operation_type`
- `read_only`
- `repository_match`
- `branch_match`
- `deployment_record_present`
- `deployment_state_classification`
- `reviewed_identifier_present`
- `result_count`
- `stop_reason`
- `exit_status`

## Result

`EXECUTION_READY_STATIC_SPECIFICATION_DEFINED_EXECUTION_NOT_AUTHORIZED`
