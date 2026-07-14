# AiFinder Phase 26DE — GAP-060–GAP-062 Body-Free Diagnostic Evidence Plan

## Status

PLANNING ONLY — NO CANDIDATE MODIFICATION OR EXECUTION.

## Objective

Define the minimum safe diagnostic evidence needed for a later reviewed candidate revision without exposing response bodies, credentials, selectors, or request headers.

## Proposed diagnostic fields

A future candidate revision may emit only bounded classifications such as:

- request transport outcome: `completed`, `timeout`, `dns_error`, `connection_error`, or `other_transport_error`;
- HTTP status class: `2xx`, `3xx`, `4xx`, `5xx`, or `unavailable`;
- normalized failure stage: `preflight`, `transport`, `http_status`, `response_parse`, or `local_validation`;
- curl exit code as a small integer;
- response-body bytes captured: always `0` in output;
- retry count: always `0`.

## Prohibited evidence

The revision must not print:

- response body content;
- full URLs or query strings;
- tokens, selectors, headers, cookies, or credentials;
- deployment IDs, project IDs, team IDs, or raw Vercel messages.

## Boundary

This plan does not authorize editing the candidate, executing it, or sending another request.
