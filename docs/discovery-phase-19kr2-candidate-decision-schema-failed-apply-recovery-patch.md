# Discovery Phase 19K-R2 — Candidate Decision Schema Failed Apply Recovery Patch

## Status

Phase 19K-R2 patches the migration after Phase 19K-R confirmed the patched retry is blocked.

Baseline commit:

```text
51cc3d7 Document candidate decision failed-apply verification
```

Phase 19K-R2 modifies the existing Phase 19 decision schema migration and documents the recovery strategy.

Phase 19K-R2 does not retry the migration.

Phase 19K-R2 does not run a schema apply.

Phase 19K-R2 does not run Supabase DB push.

Phase 19K-R2 does not run type generation.

Phase 19K-R2 does not run live mutation smoke.

Phase 19K-R2 does not run database mutations.

Phase 19K-R2 does not implement helper, API, UI, source, or test changes.

## Reason For Patch

Phase 19K-R showed:

```text
Migration 20260701190000 is local-only / remote blank.
Decision metadata columns are absent.
duplicate_of_tool_id is absent.
discovery_candidate_tools_candidate_status_check is present but missing required decision statuses.
discovery_audit_events_action_check is present but missing candidate_decision.
```

The existing migration used an add-if-absent strategy for the candidate status constraint.

That is not sufficient because the existing live constraint name is already present.

If the migration simply retries without this patch, the candidate status CHECK may not be upgraded.

## Migration Patch

Patched migration:

```text
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

Constraint upgrade strategy:

```text
DROP CONSTRAINT IF EXISTS discovery_candidate_tools_candidate_status_check
ADD CONSTRAINT discovery_candidate_tools_candidate_status_check with the Phase 19 decision status allow-list
VALIDATE CONSTRAINT discovery_candidate_tools_candidate_status_check

DROP CONSTRAINT IF EXISTS discovery_audit_events_action_check
ADD CONSTRAINT discovery_audit_events_action_check with candidate_decision included
VALIDATE CONSTRAINT discovery_audit_events_action_check
```

The migration keeps:

```text
duplicate_of_tool_id bigint
NOT VALID / VALIDATE CONSTRAINT pattern
decision metadata columns
duplicate candidate foreign key
duplicate tool foreign key
```

## Candidate Status Allow-List

The replacement candidate status constraint contains:

```text
staged
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
```

Future publish workflow statuses remain excluded from the Phase 19 decision workflow.

## Audit Action Allow-List

The replacement audit action constraint contains:

```text
approve
reject
flag
ignore
batch-action
mark-duplicate
candidate_decision
```

Required Phase 19 audit action:

```text
candidate_decision
```

## Retry Boundary

Phase 19K-R2 does not approve a retry.

A patched retry still requires this exact approval phrase:

```text
Approve Phase 19 patched candidate decision schema migration retry apply
```

The live mutation smoke phrase remains separate and unused:

```text
Approve Phase 19 live candidate decision mutation smoke
```

## Preserved Boundaries

Phase 19K-R2 does not:

- retry the migration
- run a schema apply
- run Supabase DB push
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

Recommended next phase after Gemini approval, commit, and push:

```text
Phase 19K2 — Candidate Decision Schema Patched Migration Retry Apply Execution
```

Required exact patched retry approval phrase:

```text
Approve Phase 19 patched candidate decision schema migration retry apply
```

If Gemini requests further changes:

```text
Phase 19K-R3 — Candidate Decision Schema Failed Apply Recovery Patch Revision
```

## Gemini Review Questions

Gemini should review:

```text
Is the explicit drop-then-re-add strategy correct for discovery_candidate_tools_candidate_status_check?
Is the explicit drop-then-re-add strategy correct for discovery_audit_events_action_check?
Is it safe to keep NOT VALID / VALIDATE CONSTRAINT?
Does the migration retain duplicate_of_tool_id bigint?
Does the patch preserve Phase 19 publish boundaries?
Is Phase 19K-R2 approved to commit?
```

## Conclusion

Phase 19K-R2 updates the migration to upgrade the existing live constraints during the patched retry.

The migration is still not retried.

The schema is still not applied.

Type generation is still not run.

Mutation smoke is still not run.
