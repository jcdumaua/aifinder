# Phase 26VY — Live RLS Static Reconciliation Plan

## Objective

Compare the sanitized live catalog result against the committed migration and static RLS inventory without executing SQL or changing the database.

## Reconciliation groups

### Group A — Discovery deny-all relations

Confirm static migration coverage for:

- `discovered_tools`
- `discovery_audit_events`
- `discovery_candidate_preview_artifacts`
- `discovery_candidate_tools`
- `discovery_duplicate_candidates`
- `discovery_evidence`
- `discovery_runs`
- `discovery_sources`

Expected live posture: RLS enabled with one deny-all policy per relation.

### Group B — Homepage control relations

Confirm static migration coverage and intended admin-only posture for:

- `homepage_control_audit_events`
- `homepage_control_checklist_runs`
- `homepage_control_configs`

Expected live posture: RLS enabled with two policies per relation.

### Group C — Public-facing relations

Confirm static migration coverage for:

- `submitted_tools`
- `tools`

Expected live posture:

- public insert boundary for pending submissions;
- public reads of approved, non-deleted tools;
- review whether overlapping `tools` read policies are intentional.

### Group D — Zero-policy audit relations

Reconcile:

- `admin_audit_archives`
- `admin_audit_logs`

Questions to resolve from committed migrations and source contracts:

1. Is zero-policy RLS the intended deny-by-default posture?
2. Is privileged server access expected to bypass RLS?
3. Are explicit deny-all policies required for consistency?
4. Does static documentation already classify these relations?

## Fail-closed rule

No policy creation, replacement, deletion, migration, or database mutation may be recommended until static reconciliation is complete and separately reviewed.
