-- Allow Homepage Control Room draft-to-preview audit events.
--
-- This supports Phase 2N-C1:
-- draft -> preview transitions insert action = 'transitioned-to-preview'.
--
-- Do not remove existing allowed audit actions.

alter table public.homepage_control_audit_events
  drop constraint if exists homepage_control_audit_events_action_check;

alter table public.homepage_control_audit_events
  add constraint homepage_control_audit_events_action_check
  check (
    action in (
      'created-draft',
      'updated-draft',
      'previewed',
      'published',
      'reverted',
      'validation-failed',
      'transitioned-to-preview'
    )
  );
