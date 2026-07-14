# AiFinder Phase 26DW — GAP-060–GAP-062 Body-Free Observation Contract

## Status

DOCUMENTATION-ONLY OBSERVATION CONTRACT.

## Permitted future diagnostic observations

A later explicitly authorized one-request execution may expose only:

- `DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED`
- `DIAGNOSTIC_TRACE: CURL_EXIT=<small integer> HTTP_CODE=<three-digit code or safe unavailable value>`
- `DIAGNOSTIC_TRACE: PARSER_EXCEPTION=<Python exception class>`

The existing normalized candidate result may remain available only within its already reviewed output contract.

## Prohibited observations

No future review package may include:

- response-body content;
- authorization headers;
- request URLs or query strings;
- token or selector values;
- project, team, deployment, or request identifiers;
- cookies, credentials, environment listings, or raw Vercel messages;
- exception messages or tracebacks.

## Redaction rule

Any local execution log must be reviewed through an allowlisted sanitizer before it is copied or shared.
