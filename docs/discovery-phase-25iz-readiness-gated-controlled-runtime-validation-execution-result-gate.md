# Phase 25IZ — Readiness-Gated Controlled Runtime Validation Execution Result Gate

## Result

`FAILED_CLOSED`

## Failure boundary

- Stage: `readiness-observation`
- Failure code: `SERVER_EXITED_DURING_STABILIZATION`
- Repository baseline: `2d99f0da429acbcb25118bb40c667aaa67353ce0`
- Phase 25IY artifact SHA-256: `b7a13649eef92fa58f30f832442b7ebd634fbdf8c87df35a56646080228a75c2`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Authorization statement SHA-256: `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080`
- Authorization disposition: `CONSUMED_AND_NOT_REUSABLE`
- Server started: `yes`
- Readiness marker count: `1`
- Readiness completed: `no`
- Request issued: `no`
- Retry count: `0`
- Server terminated: `yes`
- Server exit classification: `EXIT_1`
- Server-output bytes: `1804`
- Server-output SHA-256: `21cb758b9891133a5d4d2513f97ad05c9af358ed3aaee0bda554b1cdb2103298`
- Server-output secret-like scan: `PASSED`

No raw server output, readiness-marker text, secret-like match, environment value, database row, response body, or response header value is included.

## Boundary state

- Further route execution: stopped
- Authorization reuse: not permitted when disposition is `CONSUMED_AND_NOT_REUSABLE`
- C02 execution: not authorized
- Database writes and mutations: not authorized
- Commit performed: no
- Push performed: no
- Batch D: not authorized
- Operational reactivation: `BLOCKED`
- Public launch: not authorized

## Review state

`READY_FOR_GEMINI_FAILURE_REVIEW`
