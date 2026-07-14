# AiFinder Phase 26OD — GAP-060–062 Runtime Result Classification and No-Retry Plan

## Allowed result classes

A future single attempt may produce only one final classification:

- `PREFLIGHT_VALIDATION_FAILURE`
- `WRAPPER_INVOCATION_PROVENANCE_ONLY`
- `CANDIDATE_RETURNED_WITH_STATUS`
- `SANITIZED_STOP_REASON_RECORDED`
- `SANITIZER_REJECTED_OUTPUT`
- `NETWORK_TRANSPORT_NOT_ESTABLISHED`
- `NETWORK_TRANSPORT_ESTABLISHED_RESULT_SANITIZED`
- `UNKNOWN_FAIL_CLOSED_RESULT`

## Output boundary

Only these forms may be retained:

- `STOPPED_FAIL_CLOSED`
- `stop_reason=<SAFE_SYMBOL>`
- `DIAGNOSTIC_TRACE: WRAPPER_INVOCATION_PROVENANCE`
- `DIAGNOSTIC_TRACE: WRAPPER_STATUS_PROVENANCE=<integer>`
- existing allowlisted diagnostic traces
- final process exit status
- aggregate allowlist/denylist counters without raw body content

No response body, secret, selector value, environment value, URL query, header, cookie, token, or credential may be retained.

## No-retry rule

After one authorization is consumed:

- no second invocation;
- no automatic correction;
- no alternate selector attempt;
- no team-context fallback;
- no timeout increase;
- no redirect enablement;
- no manual replay under the same marker.

A new attempt requires a new explicit human authorization marker and a new synchronized preflight phase.
