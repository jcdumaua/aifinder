# Phase 25SF — Revision CCIII GAP-035 Platform-Retention Execution Contract

## Status

EXECUTION_CONTRACT_ONLY — NO EXECUTION — FAIL_CLOSED

## Target

`public.discovery_audit_events`

## Permitted Inspection Classes

A later execution may use only read-only metadata sources capable of answering:

- table existence;
- trigger names and trigger enablement states;
- function identities referenced by triggers;
- scheduled job identities and command summaries only when safely sanitized;
- schema or migration definitions affecting retention;
- table-level metadata indicating automated expiration or cleanup.

## Forbidden Query Classes

The execution must not:

- select from `public.discovery_audit_events`;
- count production audit rows;
- inspect `min(created_at)`, `max(created_at)`, or any row timestamp;
- inspect actor, message, action, metadata, or discovered-tool references;
- execute mutation-capable SQL;
- invoke application routes or admin APIs;
- use browser automation;
- start the application server;
- expose credentials or environment values.

## Allowed Output Fields

- target table exists: `YES` or `NO`;
- automatic deletion trigger present: `YES`, `NO`, or `UNKNOWN`;
- scheduled deletion job present: `YES`, `NO`, or `UNKNOWN`;
- retention-related function present: `YES`, `NO`, or `UNKNOWN`;
- migration-defined deletion behavior present: `YES`, `NO`, or `UNKNOWN`;
- documented policy contradiction found: `YES`, `NO`, or `UNKNOWN`;
- sanitized evidence-source identities;
- final result vocabulary.

## Final Result Vocabulary

- `PLATFORM_RETENTION_SUPPORTED`
- `PLATFORM_RETENTION_NOT_SUPPORTED`
- `PLATFORM_RETENTION_INCONCLUSIVE`
- `PLATFORM_RETENTION_VERIFICATION_BLOCKED`

## Fail-Closed Conditions

Stop before access if:

- the available command cannot guarantee metadata-only behavior;
- the database target cannot be verified;
- the inspection would require row-value access;
- output cannot be sanitized;
- the repository is not at the approved baseline;
- the working tree is not clean and synchronized.

## Non-Authorization Boundary

This contract does not itself execute verification or authorize blocker resolution.
