# AiFinder Phase 26BJ — Revision CDXL — GAP-060–GAP-062 Static Response Parser Design

## Parser boundary

A future reviewed parser must process the response locally and emit exactly one normalized row. The raw response must never be printed, logged, committed, or copied.

## Accepted top-level structure

- JSON object.
- `deployments` must exist.
- `deployments` must be an array.
- Array length must be `0` or `1`.
- More than one item is an immediate fail-closed result.

## Item-field use

For the single deployment item only:

- `uid`: derive `reviewed_identifier_present=true|false`; never emit the value.
- `projectId`: compare to the reviewed selector; never emit the value.
- `target`: compare to `production`.
- `state` or `readyState`: map to a normalized classification.
- Reviewed branch metadata field: compare to `main`; never emit the value.

## Normalized state mapping

Allowed output classifications:

- `READY`
- `BUILDING`
- `QUEUED`
- `ERROR`
- `CANCELED`
- `UNKNOWN`
- `ABSENT`
- `STOPPED_FAIL_CLOSED`

Any undocumented or unrecognized state maps to `UNKNOWN`; it must not be echoed.

## Normalized output schema

Exactly one line containing these fixed keys:

- `operation_type=VERCEL_LIST_DEPLOYMENTS`
- `read_only=true`
- `repository_match=true|false|indeterminate`
- `branch_match=true|false|indeterminate`
- `deployment_record_present=true|false`
- `deployment_state_classification=<ALLOWLISTED_VALUE>`
- `reviewed_identifier_present=true|false`
- `result_count=0|1`
- `stop_reason=<ALLOWLISTED_REASON>`
- `exit_status=<INTEGER>`

## Prohibited parser behavior

- Emitting unknown fields.
- Printing raw JSON.
- Printing URLs.
- Printing user, team, project, deployment, or account identifiers.
- Printing error messages from the response.
- Following pagination.
- Performing a second request.

## Result

`STATIC_RESPONSE_PARSER_DESIGNED_RAW_BODY_SUPPRESSED`
