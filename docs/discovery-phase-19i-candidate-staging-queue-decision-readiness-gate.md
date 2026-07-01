# Discovery Phase 19I — Candidate Staging Queue Decision Readiness Gate

## Status

Phase 19I is a documentation-only readiness gate.

Current pushed baseline:

```text
2fc5492 Draft candidate decision schema expansion migration
```

Phase 19I reviews the Phase 19H migration draft before any apply gate.

Phase 19I does not implement code.

Phase 19I does not modify tests, API routes, backend helpers, UI components, package files, or source files.

Phase 19I does not create a new migration file.

Phase 19I does not modify the Phase 19H migration draft.

Phase 19I does not apply a migration.

Phase 19I does not run Supabase DB push.

Phase 19I does not run type generation.

Phase 19I does not run browser QA.

Phase 19I does not run live database queries.

Phase 19I does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19I readiness gate:

```text
Discovery Engine overall: ~93.5%
Phase 19I progress: 100%
Current milestone: Candidate Staging Queue decision schema migration readiness reviewed
```

## Readiness Decision

Readiness result:

```text
Ready for Phase 19J apply-gate review; not approved to apply
```

Failed checks:

```text
None
```

Important:

```text
Ready for an apply-gate review does not mean ready to apply automatically.
A separate explicit approval phrase is required before any live migration apply.
```

Future live migration approval phrase should be separate from normal phase approval:

```text
Approve Phase 19 candidate decision schema migration apply
```

This is intentionally different from the future live mutation smoke phrase:

```text
Approve Phase 19 live candidate decision mutation smoke
```

## Reviewed Migration Draft

Reviewed file:

```text
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
```

Phase 19H commit:

```text
2fc5492 Draft candidate decision schema expansion migration
```

## Readiness Checklist

| Check | Result |
| --- | --- |
| Phase 19H migration draft exists | PASS |
| Draft-only header is present | PASS |
| No Supabase DB push guardrail is present | PASS |
| No live DB query guardrail is present | PASS |
| No live DB mutation guardrail is present | PASS |
| No type generation guardrail is present | PASS |
| candidate_status CHECK constraint is drafted | PASS |
| candidate_status allow-list is correct | PASS |
| decision metadata columns are drafted | PASS |
| decision_action CHECK is drafted | PASS |
| decision_notes length CHECK is drafted | PASS |
| duplicate candidate FK is drafted safely | PASS |
| duplicate public tool FK is drafted safely | PASS |
| audit action CHECK is drafted | PASS |
| audit action allow-list is correct | PASS |
| audit strategy uses action, not event_type | PASS |
| no candidate_status DROP CONSTRAINT is used | PASS |
| unsafe discovery_candidate_tools_ drop is absent | PASS |
| unsafe source_url length drop is absent | PASS |
| public.tools insert is absent | PASS |
| discovered_tools insert is absent | PASS |
| publish statuses remain absent | PASS |

## Parsed Audit Actions

The Phase 19H migration draft action allow-list currently resolves to:

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
Store decision-specific details in metadata JSONB.
```

## Candidate Status Review

The Phase 19H draft adds a new named candidate_status CHECK constraint.

Required future constraint name:

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

## Decision Metadata Review

The Phase 19H draft adds nullable decision metadata columns.

Required columns:

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
IF to_regclass('public.discovery_audit_events') IS NULL THEN
    RAISE EXCEPTION 'public.discovery_audit_events table is required before candidate decision schema expansion';
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

## Decision Action and Notes Review

Required decision_action values:

```text
approve_for_draft
reject
archive
duplicate
needs_more_evidence
```

Required decision_notes limit:

```text
1000 characters
```

Decision reason rule:

```text
decision_reason remains TEXT and is validated in application code.
```

## Duplicate Foreign Key Review

Required duplicate_of_candidate_id behavior:

```text
references public.discovery_candidate_tools(id)
ON DELETE SET NULL
```

Evidence block:

```sql
ALTER TABLE public.discovery_candidate_tools
  VALIDATE CONSTRAINT discovery_candidate_tools_decision_notes_length_check;

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
```

Required duplicate_of_tool_id behavior:

```text
references public.tools(id)
ON DELETE SET NULL
```

Evidence block:

```sql
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
DECLARE
  existing_action_constraint record;
BEGIN
  FOR existing_action_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_audit_events'::regclass
      AND contype = 'c'
```

## Audit Action Review

The Phase 19H draft replaces/expands the audit action CHECK and includes candidate_decision.

Evidence block:

```sql
AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%action%'
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

Phase 19I review note:

```text
Gemini approved the dynamic audit action CHECK replacement in Phase 19H.
Phase 19I records it as ready for a dedicated apply-gate review.
```

## Apply-Gate Requirements

Before any live migration apply, the future apply-gate phase must confirm:

```text
The working tree is clean.
The latest pushed commit is the approved migration draft.
The migration file is unchanged from the Gemini-approved draft or any patch has separate approval.
No source/helper/API/UI implementation is included.
No public.tools write path is introduced.
No discovered_tools write path is introduced.
No publish status is introduced.
No type generation is run unless separately approved after apply.
A rollback/repair plan exists for action CHECK replacement failure.
The operator understands that applying the migration changes the live database schema.
```

## Explicitly Not Approved By Phase 19I

Phase 19I does not approve:

```text
migration apply
supabase db push
type generation
live DB query
live DB mutation
candidate decision helper implementation
candidate decision API implementation
candidate decision UI implementation
public.tools writes
discovered_tools writes
candidate publishing
candidate promotion
crawler execution
candidate extraction execution
```

## Future Implementation Prerequisites

After migration apply is separately approved and completed, future implementation phases should still be split:

```text
Phase 19K or later: Candidate decision helper implementation plan or implementation.
Phase 19L or later: Candidate decision API route implementation plan or implementation.
Phase 19M or later: Candidate decision admin UI design/implementation.
```

No UI decision buttons should be implemented before backend mutation API safety is designed, implemented, and tested.

## Preserved Boundaries

Phase 19I preserves all prior Phase 19 boundaries:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
No future decision implementation may run live database mutations without separate explicit approval.
No UI decision buttons before mutation API safety is designed, implemented, and tested.
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

Future live mutation approval phrase remains:

```text
Approve Phase 19 live candidate decision mutation smoke
```

Normal phase approval must not imply live mutation approval.

## Candidate Staging Queue Boundary

Phase 19I does not change existing Candidate Staging Queue implementation.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

## Phase 19I Boundary Confirmation

Phase 19I is documentation-only and readiness-gate-only.

Phase 19I does not:

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

Recommended next phase:

```text
Phase 19J — Candidate Staging Queue Decision Schema Migration Apply Gate
```

Suggested Phase 19J scope:

```text
Review whether to apply the Phase 19H migration draft to the live database.
Require exact explicit live migration approval before any apply.
No automatic apply.
No source implementation.
No type generation unless separately approved after apply.
No candidate decision helper/API/UI implementation.
No live mutation smoke.
```

## Gemini Review Questions

Gemini should review:

```text
Does Phase 19I correctly assess the Phase 19H migration draft as ready for a future apply-gate review?
Are the readiness checklist items sufficient?
Is the explicit migration apply approval phrase clear and separate from mutation smoke approval?
Are the apply-gate requirements sufficient before any live DB schema change?
Is Phase 19J the correct next phase?
Is Phase 19I approved to commit?
```

## Conclusion

Phase 19I documents the readiness gate for the Candidate Staging Queue decision schema expansion migration draft.

Readiness result:

```text
Ready for Phase 19J apply-gate review; not approved to apply
```

Phase 19I is ready for Gemini review before commit.
