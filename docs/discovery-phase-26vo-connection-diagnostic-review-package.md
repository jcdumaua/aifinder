# Phase 26VO — Connection Diagnostic Review Package

## Review scope

Review:

- `scripts/discovery-live-rls-connection-diagnostic-candidate.sh`
- Phases 26VL–26VN.

## Immutable identity

- Baseline: `aff7af4904999687e71c2678acc61bb1a5a7b02d`
- Candidate SHA-256: `2bac22d40743e80f7bceb8519f9dd713293d57eb824918ff3ceafd5a5c9e7cff`
- Candidate mode: `100644`

## Required Gemini verification

Verify that:

1. the candidate emits only sanitized categories;
2. raw PostgreSQL errors are never printed;
3. the connection URL is never printed or inspected;
4. only `select 1;` is executed;
5. no application relation or catalog relation is read;
6. no mutation is possible;
7. one execution is sufficient;
8. no retry occurs;
9. execution remains separately gated;
10. GAP-001 and operational reactivation remain blocked.

## Requested determination

Select exactly one:

- `AUTHORIZE_ONE_SANITIZED_POSTGRES_CONNECTION_DIAGNOSTIC`
- `REVISE_SANITIZED_POSTGRES_CONNECTION_DIAGNOSTIC`
- `BLOCK_SANITIZED_POSTGRES_CONNECTION_DIAGNOSTIC`

## Current state

- Diagnostic package: `COMPLETE_PENDING_GEMINI_REVIEW`
- Connection attempt: `NOT_PERFORMED`
- SQL execution: `NOT_PERFORMED`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
