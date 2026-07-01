# Discovery Phase 19K — Candidate Staging Queue Decision Schema Migration Apply Failure Recovery

## Status

Phase 19K live schema apply was attempted after James provided the exact approval phrase.

Approval phrase received:

```text
Approve Phase 19 candidate decision schema migration apply
```

The apply attempt did not complete successfully.

Phase 19K recovery is documentation-and-patch-only.

Phase 19K recovery does not retry the migration.

Phase 19K recovery does not run Supabase DB push.

Phase 19K recovery does not run type generation.

Phase 19K recovery does not run live mutation smoke.

Phase 19K recovery does not run database mutations.

## Failure Summary

The approved migration reached the duplicate public tool foreign key statement and failed.

Failure class:

```text
SQLSTATE 42804
```

Failure reason:

```text
foreign key constraint "discovery_candidate_tools_duplicate_of_tool_id_fkey" cannot be implemented
```

Type mismatch:

```text
duplicate_of_tool_id was drafted as uuid
public.tools.id is bigint
```

Failed statement target:

```text
discovery_candidate_tools_duplicate_of_tool_id_fkey
```

## Root Cause

The Phase 19H migration draft assumed the duplicate public tool reference should use a UUID column.

The live database confirmed that `public.tools.id` is `bigint`.

Therefore the local migration draft must use:

```text
duplicate_of_tool_id bigint
```

not:

```text
duplicate_of_tool_id uuid
```

## Local Migration Patch

Patched migration:

```text
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

Patch applied locally:

```diff
- ADD COLUMN IF NOT EXISTS duplicate_of_tool_id uuid
+ ADD COLUMN IF NOT EXISTS duplicate_of_tool_id bigint
```

No other migration change is intended in this recovery patch.

## Safety Notes

The failed apply attempt means the live database state must not be guessed.

A future retry phase must first verify whether the failed migration was recorded as applied or whether any partial objects exist.

The migration file is written defensively with IF NOT EXISTS / NOT VALID / VALIDATE patterns, but the failed apply still requires post-failure verification before retry.

The original approval phrase was for the originally approved migration draft.

Because the migration draft changed after the failure, a patched retry must require a new exact approval phrase.

New exact approval phrase required before any patched retry apply:

```text
Approve Phase 19 patched candidate decision schema migration retry apply
```

The live mutation smoke phrase remains separate and unused:

```text
Approve Phase 19 live candidate decision mutation smoke
```

## Preserved Boundaries

Phase 19K recovery does not:

- retry the migration
- run Supabase DB push
- run type generation
- run live mutation smoke
- create candidate rows
- update candidate rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- reject candidates
- archive candidates
- mark duplicates
- modify helper code
- modify API routes
- modify UI components
- modify package files

Approve for draft does not publish.

`public.tools` write remains forbidden until a separate publish workflow phase is approved.

No UI decision buttons before mutation API safety is designed, implemented, and tested.

confidence_bucket cursor continuation remains deferred unless separately approved.

## Recommended Next Phase

Recommended next phase:

```text
Phase 19K-R — Candidate Decision Schema Failed Apply Recovery Review
```

Phase 19K-R should ask Gemini to review:

```text
- the failed apply output
- the corrected duplicate_of_tool_id bigint patch
- whether a read-only post-failure schema check is required before retry
- whether the same migration file can be safely retried after patch
- whether Phase 19K2 should perform the patched retry only after the new exact approval phrase
```

Future patched retry phase:

```text
Phase 19K2 — Candidate Decision Schema Patched Migration Retry Apply Execution
```

Required exact approval phrase for patched retry:

```text
Approve Phase 19 patched candidate decision schema migration retry apply
```

## Conclusion

Phase 19K live schema apply found a real schema mismatch before the decision workflow was implemented.

The correction is local and bounded:

```text
duplicate_of_tool_id bigint
```

The migration must not be retried until Gemini reviews this recovery patch and James provides the new exact patched retry approval phrase.
