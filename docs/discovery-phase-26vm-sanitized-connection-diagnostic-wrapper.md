# Phase 26VM — Sanitized Connection Diagnostic Wrapper

## Candidate

- File: `scripts/discovery-live-rls-connection-diagnostic-candidate.sh`
- SHA-256: `2bac22d40743e80f7bceb8519f9dd713293d57eb824918ff3ceafd5a5c9e7cff`
- Mode: `100644`

## Diagnostic action

The candidate performs one PostgreSQL connection test using:

```sql
select 1;
```

It does not reference any application table, view, policy, schema object, or application row.

## Safety behavior

- connection value presence only;
- `psql -w`;
- no password prompting;
- raw stderr stored temporarily;
- raw stderr never printed;
- only a sanitized category is emitted;
- temporary raw stderr removed;
- no retry;
- no database mutation;
- no application-row access.

## Current state

- Candidate prepared: `YES`
- Candidate executable mode: `NO`
- Connection attempted: `NO`
- SQL executed: `NO`
