# Phase 25SC — Revision CC GAP-035 Read-Only Platform-Retention Verification Planning Gate

## Status

PLANNING_ONLY — NO EXECUTION — FAIL_CLOSED

## Approved Baseline

- Baseline commit: `72fdc6f9aa0a0f77cba05c83ae7f7fca64717126`
- Candidate: `GAP-035 / DATA-LR-011`
- Static evidence set: `APPROVED`
- Single-owner exception: `AUTHORIZED`
- Platform retention: `NOT_VERIFIED`

## Verification Objective

Determine, without reading production audit-row contents, whether the live platform configuration preserves `public.discovery_audit_events` consistently with the documented retention policy.

## Allowed Verification Scope

A later separately approved execution may inspect only non-secret metadata needed to determine:

1. whether `public.discovery_audit_events` exists;
2. whether any scheduled cleanup, expiration, TTL, retention, or deletion mechanism targets it;
3. whether database functions, triggers, cron jobs, or policies automatically delete from it;
4. whether migration or schema history contains explicit retention behavior affecting it;
5. whether current platform metadata contradicts the documented one-year MVP retention policy.

## Prohibited Output

The execution must not print:

- audit-row contents;
- actor IDs or labels;
- messages;
- metadata JSON;
- timestamps from individual production rows;
- credentials;
- tokens;
- connection strings;
- environment values;
- policy expressions containing sensitive literals.

## Allowed Result Vocabulary

- `PLATFORM_RETENTION_SUPPORTED`
- `PLATFORM_RETENTION_NOT_SUPPORTED`
- `PLATFORM_RETENTION_INCONCLUSIVE`
- `PLATFORM_RETENTION_VERIFICATION_BLOCKED`

## Fail-Closed Rules

The result must be blocked or inconclusive if:

- metadata access cannot be isolated safely;
- any row-value read would be required;
- any mutation-capable action is encountered;
- output cannot be sanitized;
- the target table identity is ambiguous;
- retention behavior cannot be determined from metadata alone.

## Execution Boundary

This planning gate performs no platform access.

A separate explicit owner authorization is required before any read-only metadata verification executes.

## Planned Successor

Phase 25SD may prepare the exact execution authorization package.
