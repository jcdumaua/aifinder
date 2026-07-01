# Discovery Phase 19K-R — Candidate Decision Schema Failed Apply Recovery Review

## Status

Phase 19K-R performed read-only post-failure schema verification.

This v3 result patches the Phase 19K-R result document after the v2 validator used an overly broad full-schema forbidden marker check.

Approval phrase received:

```text
Approve Phase 19K-R read-only post-failure schema verification
```

Baseline commit:

```text
80aa0d6 Patch candidate decision migration after failed apply
```

Phase 19K-R did not retry the migration.

Phase 19K-R did not run a schema apply.

Phase 19K-R did not run type generation.

Phase 19K-R did not run live mutation smoke.

Phase 19K-R did not run database mutations.

Phase 19K-R did not implement helper, API, UI, source, or test changes.

## V3 Patch Reason

The v2 result detected a full public schema marker that looked like an existing publish-status value.

That full-schema check was too broad because the public schema may already contain unrelated production publish/status values.

The v3 result scopes safety checks to the Phase 19 decision-migration areas:

```text
- discovery_candidate_tools candidate_status constraint block
- discovery_audit_events action constraint block
- expected decision metadata columns
- expected decision constraints
```

## Reviewed Files

Patched migration:

```text
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

Recovery documentation:

```text
docs/discovery-phase-19k-candidate-staging-queue-decision-schema-migration-apply-failure-recovery.md
```

## Remote Migration List Assessment

Migration identifier:

```text
20260701190000
```

Migration-list assessment:

```text
Local-only / remote blank: migration is not recorded as applied remotely. Raw line: 20260701190000 |                | 2026-07-01 19:00:00
```

Raw migration list output was saved locally at:

```text
/tmp/aifinder-phase-19kr-migration-list.txt
```

## Live Column State

| Column | Live schema state |
| --- | --- |
| `decision_action` | ABSENT |
| `decision_reason` | ABSENT |
| `decision_notes` | ABSENT |
| `decided_at` | ABSENT |
| `decided_by` | ABSENT |
| `duplicate_of_candidate_id` | ABSENT |
| `duplicate_of_tool_id` | ABSENT |

## Live Constraint State

| Constraint | Live schema state |
| --- | --- |
| `discovery_candidate_tools_candidate_status_check` | PRESENT |
| `discovery_candidate_tools_decision_action_check` | ABSENT |
| `discovery_candidate_tools_decision_notes_length_check` | ABSENT |
| `discovery_candidate_tools_duplicate_of_candidate_id_fkey` | ABSENT |
| `discovery_candidate_tools_duplicate_of_tool_id_fkey` | ABSENT |
| `discovery_audit_events_action_check` | PRESENT |

## Scoped Safety State

| Scoped check | Live schema state |
| --- | --- |
| `candidate_status_constraint_block` | PARSED |
| `candidate_status_required_values` | MISSING: under_review, approved_for_draft, needs_more_evidence |
| `candidate_publish_status_markers` | PRESENT |
| `audit_action_constraint_block` | PARSED |
| `audit_required_values` | MISSING: candidate_decision |
| `audit_candidate_decision_action` | ABSENT |
| `audit_event_type_reference` | ABSENT |

## Retry Readiness Assessment

```text
Blocked: scoped candidate_status constraint contains future publish-status markers.
```

Important:

```text
This assessment is read-only and advisory. It does not approve a retry.
```

A patched retry still requires this exact approval phrase:

```text
Approve Phase 19 patched candidate decision schema migration retry apply
```

The live mutation smoke phrase remains separate and unused:

```text
Approve Phase 19 live candidate decision mutation smoke
```

## Verification Method

Phase 19K-R used read-only Supabase CLI inspection only:

```text
- remote migration list inspection
- public schema dump inspection
- scoped parsing of relevant decision-migration blocks
```

The captured public schema dump was saved locally at:

```text
/tmp/aifinder-phase-19kr-public-schema-dump.sql
```

The schema dump is not committed.

## Safety Interpretation

The migration list shows the Phase 19 decision migration is not recorded as applied remotely.

The live schema dump shows whether any partial objects exist after the failed apply attempt.

Because the patched migration uses defensive guards, a retry may be safe only if Gemini agrees with the scoped assessment and James provides the exact patched retry approval phrase.

Defensive migration patterns:

```text
ADD COLUMN IF NOT EXISTS
IF NOT EXISTS constraint guards
NOT VALID / VALIDATE CONSTRAINT
```

## Preserved Boundaries

Phase 19K-R does not:

- retry the migration
- run a schema apply
- run type generation
- run live mutation smoke
- create candidate rows
- update candidate rows
- write to public tools
- write to discovered tools
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

Public tools write remains forbidden until a separate publish workflow phase is approved.

No UI decision buttons before mutation API safety is designed, implemented, and tested.

confidence_bucket cursor continuation remains deferred unless separately approved.

## Recommended Next Phase

Recommended next phase if Gemini approves retry readiness and James provides the exact patched retry phrase:

```text
Phase 19K2 — Candidate Decision Schema Patched Migration Retry Apply Execution
```

Required exact patched retry approval phrase:

```text
Approve Phase 19 patched candidate decision schema migration retry apply
```

Recommended next phase if Gemini requests changes:

```text
Phase 19K-R2 — Candidate Decision Schema Failed Apply Recovery Patch
```

## Gemini Review Questions

Gemini should review:

```text
Is the v3 scoped safety check correct?
Is the migration list assessment sufficient?
Does the live column state show expected post-failure behavior?
Does the live constraint state show a safe retry path?
Is the retry readiness assessment correct?
Should Phase 19K2 retry the patched migration only after exact approval?
Is Phase 19K-R approved to commit?
```

## Conclusion

Phase 19K-R completed read-only post-failure schema verification.

Retry readiness assessment:

```text
Blocked: scoped candidate_status constraint contains future publish-status markers.
```
