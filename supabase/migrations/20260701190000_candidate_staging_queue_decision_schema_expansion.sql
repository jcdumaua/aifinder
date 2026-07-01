-- Discovery Phase 19H — Candidate Staging Queue Decision Schema Expansion Migration Draft
--
-- DRAFT ONLY / DO NOT APPLY IN PHASE 19H.
--
-- This migration is intentionally drafted but must not be applied by Phase 19H.
-- Do not run supabase db push for this phase.
-- Do not run live database queries for this phase.
-- Do not run live database mutations for this phase.
-- Do not run type generation for this phase.
--
-- Strategy source:
-- - Phase 19G: Candidate Staging Queue Decision Schema Reality Reconciliation / Final Migration Strategy
--
-- Safety decisions:
-- - Add a new named candidate_status CHECK constraint.
-- - Do not drop guessed candidate_status constraints.
-- - Do not use discovery_candidate_tools_.
-- - Do not use discovery_candidate_tools_source_url_length_check.
-- - Use discovery_audit_events.action as the audit discriminator.
-- - Add/allow candidate_decision as the audit action.
-- - Store decision details in discovery_audit_events.metadata JSONB.
-- - Approve for draft does not publish.
-- - public.tools writes remain forbidden until a separate publish workflow phase is approved.

DO $$
BEGIN
  IF to_regclass('public.discovery_candidate_tools') IS NULL THEN
    RAISE EXCEPTION 'public.discovery_candidate_tools table is required before candidate decision schema expansion';
  END IF;

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
  ADD COLUMN IF NOT EXISTS duplicate_of_tool_id bigint;

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
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
      AND conname = 'discovery_candidate_tools_decision_action_check'
  ) THEN
    ALTER TABLE public.discovery_candidate_tools
      ADD CONSTRAINT discovery_candidate_tools_decision_action_check
      CHECK (
        decision_action IS NULL
        OR decision_action IN (
          'approve_for_draft',
          'reject',
          'archive',
          'duplicate',
          'needs_more_evidence'
        )
      )
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.discovery_candidate_tools
  VALIDATE CONSTRAINT discovery_candidate_tools_decision_action_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
      AND conname = 'discovery_candidate_tools_decision_notes_length_check'
  ) THEN
    ALTER TABLE public.discovery_candidate_tools
      ADD CONSTRAINT discovery_candidate_tools_decision_notes_length_check
      CHECK (
        decision_notes IS NULL
        OR char_length(decision_notes) <= 1000
      )
      NOT VALID;
  END IF;
END $$;

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
