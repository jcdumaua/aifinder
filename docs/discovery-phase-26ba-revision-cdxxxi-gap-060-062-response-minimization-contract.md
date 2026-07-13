# AiFinder Phase 26BA — Revision CDXXXI — GAP-060–GAP-062 Response Minimization Contract

## Raw response rule

- Raw response body storage: `PROHIBITED`
- Raw response body printing: `PROHIBITED`
- Raw response body clipboard copy: `PROHIBITED`
- Full response logging: `PROHIBITED`

## Permitted source fields

A later parser may inspect only enough structure to derive:

- Whether `deployments` exists as an array.
- The number of deployment items after `limit=1`.
- For the single item only:
  - `uid`, used only to derive `reviewed_identifier_present`.
  - `projectId`, used only for equality comparison and never emitted.
  - `target`, used only for production equality comparison.
  - `state` or `readyState`, used only to derive a normalized state classification.
  - `meta.githubCommitRef` or another separately reviewed branch field only when required to confirm branch metadata.

## Prohibited response fields

The parser must ignore and never emit:

- `url`
- `inspectorUrl`
- `creator`
- creator email or usernames
- `meta` except one separately reviewed branch value
- `projectSettings`
- error messages
- attribution data
- platform creator data
- custom-environment details
- account, user, team, or seat identifiers
- any unknown field

## Normalized output

Exactly one metadata row with:

- `operation_type=VERCEL_LIST_DEPLOYMENTS`
- `read_only=true`
- `repository_match`
- `branch_match`
- `deployment_record_present`
- `deployment_state_classification`
- `reviewed_identifier_present`
- `result_count`
- `stop_reason`
- `exit_status`

## Cardinality

- Maximum HTTP requests: `1`
- Maximum deployment items accepted: `1`
- Maximum normalized rows: `1`
- Pagination follow-up: `PROHIBITED`

## Result

`STRICT_RESPONSE_MINIMIZATION_DEFINED_RAW_BODY_PROHIBITED`
