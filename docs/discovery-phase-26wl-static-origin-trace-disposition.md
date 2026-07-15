# Phase 26WL — Static Origin Trace Disposition

## Decision framework

### Tools policy

Classify the second live `tools` read policy as exactly one of:

- `SOURCE_CONTROLLED_AND_INTENTIONAL`
- `SOURCE_CONTROLLED_BUT_SUPERSEDED`
- `LIVE_LEGACY_POLICY_NOT_ESTABLISHED_IN_CURRENT_SOURCE`
- `ORIGIN_NOT_ESTABLISHED`

### Audit relations

Classify each audit relation as exactly one of:

- `SOURCE_CONTROLLED_ORIGIN_ESTABLISHED`
- `LEGACY_SOURCE_ORIGIN_ESTABLISHED`
- `LIVE_ORIGIN_NOT_ESTABLISHED_FAIL_CLOSED`

## Mutation boundary

No classification authorizes:

- dropping or altering a policy;
- creating a policy;
- changing RLS flags;
- creating or dropping a table;
- executing a migration;
- modifying production data.

## Required next action

Any proposed schema or policy change requires a separate plan, independent review, explicit authorization, and rollback contract.

## Current state

- Database mutation: `PROHIBITED`
- Migration execution: `PROHIBITED`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
