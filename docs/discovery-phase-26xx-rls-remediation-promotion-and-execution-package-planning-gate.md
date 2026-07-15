# AiFinder Phase 26XX — RLS Remediation Promotion and Execution Package Planning Gate

## Phase classification

Documentation-only promotion and execution-package planning.

## Purpose

Define the exact future change package required to promote the already approved guarded RLS drift reconciliation candidates from inert draft storage into active migration paths.

This phase does not modify either SQL draft, remove either abort guard, move files, stage migration changes, execute SQL, contact Supabase, inspect environment values, mutate a database, deploy, publish, or reactivate operations.

## Approved predecessor state

- Phase 26XS–26XV commit: `9998a688889d97edd40be04e812a178a468c5c05`
- Phase 26XW readiness plan: approved for documentation-only commit and push.
- Forward draft:
  `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql`
- Rollback draft:
  `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql`
- Both SQL candidates remain inert through unconditional abort guards.
- Guard removal remains unauthorized.
- Migration activation remains unauthorized.
- Database execution remains prohibited.

## Required promotion package structure

A future reviewed implementation package must identify and bind all of the following before any source change:

1. Exact approved baseline commit.
2. Exact SHA-256 of the committed forward draft.
3. Exact SHA-256 of the committed rollback draft.
4. Exact source paths under `supabase/migrations/_drafts/`.
5. Exact proposed active destination paths under `supabase/migrations/`.
6. Exact guard block boundaries proposed for removal.
7. Exact no-drift proof showing no SQL changes other than:
   - removal of the unconditional abort guard;
   - path promotion from `_drafts/` to the reviewed active migration path.
8. Explicit separation between:
   - the critical `public.tools` legacy read-policy remediation; and
   - any audit-table or sequence grant cleanup.
9. Exact rollback activation path.
10. Exact preflight, execution, postflight, failure, and recovery commands.
11. Target-environment classification without credentials, connection strings, tokens, or environment values.
12. A one-time explicit human execution authorization boundary.

## Proposed future source transitions

The future package may propose—but must not perform in this phase—the following transitions:

- Forward source:
  `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_forward_candidate.sql`
- Forward destination:
  `supabase/migrations/20260715_rls_drift_reconciliation_forward.sql`

- Rollback source:
  `supabase/migrations/_drafts/20260715_rls_drift_reconciliation_rollback_candidate.sql`
- Rollback destination:
  a separately reviewed rollback-only path that is not automatically applied as part of normal forward migration ordering.

The rollback destination filename and invocation method must be explicitly selected and independently reviewed before activation.

## Proposed future guard-removal rule

A future implementation phase may remove only the exact unconditional abort block beginning with:

`DO $aifinder_guard$`

and ending with its matching:

`$aifinder_guard$;`

No other SQL statement, assertion, policy expression, role target, relation target, sequence target, comment, or transaction boundary may change without a new review.

## Required preflight controls

Before any future promotion or execution:

- repository identity and origin must match the approved AiFinder repository;
- branch must be `main`;
- local HEAD must match the approved baseline;
- `main` must be synchronized with `origin/main`;
- working tree must be clean;
- committed candidate hashes must match the approved hashes;
- target environment must be explicitly named by logical classification;
- live catalog state must be checked using read-only catalog queries;
- any unexpected policy, role, relation, RLS, or grant drift must fail closed;
- no row data, credentials, tokens, cookies, sessions, response bodies, or environment values may be printed.

## Required execution separation

The future execution package must preserve independent gates for:

1. Source promotion and guard removal.
2. Commit and push of reviewed migration source changes.
3. Target-environment preflight.
4. Forward migration execution.
5. Read-only post-execution verification.
6. Rollback decision, if triggered.
7. Public-launch or operational-reactivation decisions.

Approval of one gate must not imply approval of any later gate.

## Rollback triggers to define before execution

The future package must define objective rollback triggers, including at minimum:

- preflight catalog mismatch;
- migration transaction failure;
- policy expression mismatch after execution;
- loss of expected approved-tools visibility;
- unexpected anonymous or authenticated access;
- unexpected service-role regression;
- application authorization failure attributable to the migration;
- inability to complete read-only postflight validation.

## Prohibited actions in Phase 26XX

- No SQL draft edits.
- No abort-guard removal.
- No file movement or migration activation.
- No staging of SQL changes.
- No Supabase CLI database command.
- No SQL execution.
- No database access requiring credentials.
- No policy or grant mutation.
- No environment-file access or value output.
- No server startup or route invocation.
- No deployment or publishing.
- No public launch.
- No operational reactivation.
- No commit or push of this Phase 26XX artifact before Gemini review.

## Required next review determination

Gemini should select exactly one:

- `APPROVE_PHASE_26XX_DOCUMENTATION_ONLY_PROMOTION_PACKAGE_PLAN`
- `REQUEST_PHASE_26XX_REVISION`
- `REJECT_PHASE_26XX_SCOPE_EXPANSION`

Approval may authorize committing this documentation-only plan. It must not authorize SQL modification, guard removal, migration promotion, database execution, deployment, publishing, public launch, or operational reactivation.

## System layer progress report

- Discovery Engine progress: 99%
- Phase 26XW: APPROVED_FOR_COMMIT_AND_PUSH
- Phase 26XX: PREPARED_FOR_GEMINI_REVIEW
- Guard removal: NOT_AUTHORIZED
- Migration activation: NOT_AUTHORIZED
- Database execution: PROHIBITED
- Public launch readiness: BLOCKED
- Operational reactivation: BLOCKED
