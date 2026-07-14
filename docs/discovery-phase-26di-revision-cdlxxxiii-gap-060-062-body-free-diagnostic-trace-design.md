# AiFinder Phase 26DI — GAP-060–GAP-062 Body-Free Diagnostic Trace Design

## Status

DOCUMENTATION-ONLY DESIGN — NO CANDIDATE MODIFICATION.

## Approved diagnostic traces

The future static patch may add exactly three diagnostic trace points:

1. `DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED`
2. `DIAGNOSTIC_TRACE: CURL_EXIT=<integer> HTTP_CODE=<status>`
3. `DIAGNOSTIC_TRACE: PARSER_EXCEPTION=<class-name>`

## Output boundary

The traces must not include:

- response bodies;
- request URLs or query strings;
- authorization headers;
- tokens, selectors, cookies, or credentials;
- project, team, deployment, or request identifiers;
- Python exception messages or stack traces.

## Execution boundary

This phase does not authorize modifying or executing the candidate.
