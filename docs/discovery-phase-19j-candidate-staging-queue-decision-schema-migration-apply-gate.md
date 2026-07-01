# Discovery Phase 19J — Candidate Staging Queue Decision Schema Migration Apply Gate

## Status

Phase 19J is an apply-gate review document.

Current pushed baseline:

```text
d820401 Document candidate decision migration readiness gate
```

Phase 19J reviews whether the Phase 19H migration draft is ready for a future live migration apply command.

Phase 19J does not apply the migration.

Phase 19J does not run Supabase DB push.

Phase 19J does not run type generation.

Phase 19J does not run browser QA.

Phase 19J does not run live database queries.

Phase 19J does not run database mutations.

Phase 19J does not modify the Phase 19H migration draft.

Phase 19J does not implement helper, API, UI, source, or test changes.

## Discovery Engine Progress Snapshot

Progress after Phase 19J apply-gate review:

```text
Discovery Engine overall: ~94.5%
Phase 19J progress: 100%
Current milestone: Candidate Staging Queue decision schema migration apply gate documented
```

## Apply-Gate Decision

Apply-gate decision:

```text
Ready for explicit migration apply approval; not applied in Phase 19J
```

Failed checks:

```text
None
```

Important:

```text
Phase 19J approval does not apply the migration.
The phrase "approved, proceed" does not apply the migration.
The migration must not be applied unless James provides the exact live migration approval phrase.
```

Exact live migration approval phrase required before any schema apply:

```text
Approve Phase 19 candidate decision schema migration apply
```

This is separate from the live mutation smoke phrase:

```text
Approve Phase 19 live candidate decision mutation smoke
```

## Reviewed Inputs

Migration draft:

```text
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

Readiness gate:

```text
docs/discovery-phase-19i-candidate-staging-queue-decision-readiness-gate.md
```

Latest pushed commit before Phase 19J:

```text
d820401 Document candidate decision migration readiness gate
```

## Apply-Gate Checklist

| Check | Result |
| --- | --- |
| Phase 19H migration draft is present | PASS |
| Phase 19I readiness doc is present | PASS |
| Phase 19I readiness result is present | PASS |
| Migration apply approval phrase is documented | PASS |
| Mutation smoke approval phrase is documented separately | PASS |
| Draft-only guardrail is present | PASS |
| No Supabase DB push guardrail is present | PASS |
| No live DB query guardrail is present | PASS |
| No live DB mutation guardrail is present | PASS |
| No type generation guardrail is present | PASS |
| candidate_status CHECK is drafted | PASS |
| candidate_status allow-list is drafted | PASS |
| decision metadata columns are drafted | PASS |
| decision_action CHECK is drafted | PASS |
| decision_action allow-list is drafted | PASS |
| decision_notes length CHECK is drafted | PASS |
| duplicate candidate FK is drafted | PASS |
| duplicate public tool FK is drafted | PASS |
| audit action CHECK is drafted | PASS |
| audit action allow-list is drafted | PASS |
| audit strategy uses action, not event_type | PASS |
| no candidate_status DROP CONSTRAINT is used | PASS |
| unsafe discovery_candidate_tools_ drop is absent | PASS |
| unsafe source_url length drop is absent | PASS |
| public.tools insert is absent | PASS |
| discovered_tools insert is absent | PASS |
| publish statuses remain absent | PASS |

## Parsed Audit Actions

The Phase 19H migration draft action allow-list resolves to:

```text
approve, reject, flag, ignore, batch-action, mark-duplicate, candidate_decision
```

Required action:

```text
candidate_decision
```

Audit strategy remains:

```text
Use discovery_audit_events.action, not event_type.
Store decision-specific decision details in metadata JSONB.
```

## Candidate Status Migration Review

The Phase 19H draft adds the new named CHECK constraint:

```text
discovery_candidate_tools_candidate_status_check
```

Allowed first decision statuses:

```text
staged
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
```

Deferred statuses remain absent:

```text
promoted_to_publish_draft
published
```

Evidence block:

```sql
ADD COLUMN IF NOT EXISTS duplicate_of_tool_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
      AND conname = 'discovery_candidate_tools_candidate_status_check'
  ) THEN
    ALTER TABLE public.discovery_candidate_tools
      ADD CONSTRAINT discovery_candidate_tools_candidate_status_check
      CHECK (
        candidate_status IN (
        'staged',
        'under_review',
        'approved_for_draft',
        'rejected',
        'archived',
        'duplicate',
        'needs_more_evidence'
        )
      )
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.discovery_candidate_tools
  VALIDATE CONSTRAINT discovery_candidate_tools_candidate_status_check;

DO $$
```

## Decision Metadata Migration Review

The Phase 19H draft adds nullable decision metadata columns.

Required decision metadata fields:

```text
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
```

Evidence block:

```sql
END IF;

  IF to_regclass('public.tools') IS NULL THEN
    RAISE EXCEPTION 'public.tools table is required before duplicate_of_tool_id foreign key can be added';
  END IF;
END $$;

ALTER TABLE public.discovery_candidate_tools
  ADD COLUMN IF NOT EXISTS decision_action text,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS decision_notes text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decided_by text,
  ADD COLUMN IF NOT EXISTS duplicate_of_candidate_id uuid,
  ADD COLUMN IF NOT EXISTS duplicate_of_tool_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
      AND conname = 'discovery_candidate_tools_candidate_status_check'
  ) THEN
    ALTER TABLE public.discovery_candidate_tools
      ADD CONSTRAINT discovery_candidate_tools_candidate_status_check
      CHECK (
        candidate_status IN (
        'staged',
        'under_review',
        'approved_for_draft',
```

## Duplicate Foreign Key Migration Review

The Phase 19H draft adds duplicate reference foreign keys with ON DELETE SET NULL.

Evidence block:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
      AND conname = 'discovery_candidate_tools_duplicate_of_candidate_id_fkey'
  ) THEN
    ALTER TABLE public.discovery_candidate_tools
      ADD CONSTRAINT discovery_candidate_tools_duplicate_of_candidate_id_fkey
      FOREIGN KEY (duplicate_of_candidate_id)
      REFERENCES public.discovery_candidate_tools(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.discovery_candidate_tools
  VALIDATE CONSTRAINT discovery_candidate_tools_duplicate_of_candidate_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
      AND conname = 'discovery_candidate_tools_duplicate_of_tool_id_fkey'
  ) THEN
    ALTER TABLE public.discovery_candidate_tools
      ADD CONSTRAINT discovery_candidate_tools_duplicate_of_tool_id_fkey
      FOREIGN KEY (duplicate_of_tool_id)
      REFERENCES public.tools(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.discovery_candidate_tools
  VALIDATE CONSTRAINT discovery_candidate_tools_duplicate_of_tool_id_fkey;

DO $$
```

## Audit Action Migration Review

The Phase 19H draft expands/replaces the audit action CHECK and includes candidate_decision.

Evidence block:

```sql
LOOP
    EXECUTE format(
      'ALTER TABLE public.discovery_audit_events DROP CONSTRAINT %I',
      existing_action_constraint.conname
    );
  END LOOP;

  ALTER TABLE public.discovery_audit_events
    ADD CONSTRAINT discovery_audit_events_action_check
    CHECK (
      action IN (
          'approve',
          'reject',
          'flag',
          'ignore',
          'batch-action',
          'mark-duplicate',
          'candidate_decision'
      )
    )
    NOT VALID;
END $$;

ALTER TABLE public.discovery_audit_events
  VALIDATE CONSTRAINT discovery_audit_events_action_check;
```

## Explicitly Not Executed

Phase 19J did not run:

```text
Supabase DB push command
npx Supabase DB push command
Supabase migration-up command
Supabase DB reset command
Supabase type generation command
npm type generation script
direct psql command
SQL editor commands
live database queries
live database mutations
```

Phase 19J did not apply:

```text
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

## Phase 19J Patch After Verification Review

Phase 19J initially included raw command examples in the "Explicitly Not Executed" section.

Patch decision:

```text
Raw command examples were replaced with descriptive command names.
```

Reason:

```text
The apply gate should document that no apply/typegen commands were executed without making raw commands easy to copy or accidentally run.
```

The apply gate remains unchanged:

```text
Ready for explicit migration apply approval; not applied in Phase 19J
```

The exact live migration approval phrase remains:

```text
Approve Phase 19 candidate decision schema migration apply
```

The separate live mutation smoke phrase remains:

```text
Approve Phase 19 live candidate decision mutation smoke
```


## Future Apply Execution Requirements

A future apply execution phase may run only after the exact approval phrase:

```text
Approve Phase 19 candidate decision schema migration apply
```

Before any apply command, the execution phase must verify:

```text
Repo is clean.
Repo is on main.
Repo is synced with origin/main.
Latest pushed commit is the approved apply-gate commit.
Migration file matches the Gemini-approved draft.
No source/helper/API/UI/test/package changes are included.
No public.tools write path is introduced.
No discovered_tools write path is introduced.
No publish status is introduced.
Operator understands this changes the live database schema.
```

Future apply execution should be its own phase:

```text
Phase 19K — Candidate Staging Queue Decision Schema Migration Apply Execution
```

## Post-Apply Requirements If Separately Approved Later

If a future phase applies the migration, follow-up should be split:

```text
Phase 19L — Candidate Decision Schema Post-Apply Verification
Phase 19M — Candidate Decision Type Generation Gate
Phase 19N — Candidate Decision Helper Implementation Plan
```

Type generation must not run automatically in the same phase unless separately approved.

Live mutation smoke must remain separate and require:

```text
Approve Phase 19 live candidate decision mutation smoke
```

## Preserved Boundaries

Phase 19J preserves all prior Phase 19 boundaries:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
No future decision implementation may run live database mutations without separate explicit approval.
No UI decision buttons before mutation API safety is designed, implemented, and tested.
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

## Phase 19J Boundary Confirmation

Phase 19J is documentation-only and apply-gate-only.

Phase 19J does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- create migration files
- apply migrations
- run Supabase DB push
- run type generation
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- update candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- mark duplicates
- trigger crawler execution
- trigger candidate extraction execution

## Recommended Next Phase

Recommended next phase if James provides the exact live schema approval phrase:

```text
Phase 19K — Candidate Staging Queue Decision Schema Migration Apply Execution
```

Required exact phrase:

```text
Approve Phase 19 candidate decision schema migration apply
```

Recommended next phase if James does not provide the exact live schema approval phrase:

```text
Pause before live schema changes.
```

## Gemini Review Questions

Gemini should review:

```text
Does Phase 19J correctly preserve the apply gate without applying the migration?
Is the apply-gate decision correct?
Are the explicit non-execution boundaries sufficient?
Is the exact live schema approval phrase clear?
Is Phase 19K the correct execution phase only after explicit live schema approval?
Is Phase 19J approved to commit?
```

## Conclusion

Phase 19J documents the Candidate Staging Queue decision schema migration apply gate.

Apply-gate decision:

```text
Ready for explicit migration apply approval; not applied in Phase 19J
```

Phase 19J is ready for Gemini review before commit.
