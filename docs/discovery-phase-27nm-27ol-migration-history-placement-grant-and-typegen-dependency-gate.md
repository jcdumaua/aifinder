# Phase 27NM-27OL Migration History, Placement, Grant, and Type-Generation Dependency Gate

## Gate status

- Migration history: `DOCUMENTED_UNAVAILABLE`.
- Migration placement: `DECISION_PREPARED_NO_MOVEMENT_AUTHORIZED`.
- Audit grant/ownership/function/trigger/sequence evidence: `BOUNDED_CONTRACT_PREPARED_LIVE_EVIDENCE_NOT_AUTHORIZED`.
- Type generation: `BLOCKED`.
- Database, migration, schema, policy, grant, type-generation, and operational execution: not authorized.

## Phase 27OE migration-history limitation

The repository has exactly 24 active-directory SQL files:

- 22 canonical 14-digit migration identities classified `EXPECTED_HISTORY_IDENTITY`;
- two 8-digit active candidates classified `QUARANTINED_NONSTANDARD_CANDIDATE`:
  - `supabase/migrations/20260715_rls_drift_reconciliation_forward_candidate.sql`;
  - `supabase/migrations/20260715_rls_drift_reconciliation_rollback_candidate.sql`.

The two active candidates are byte-identical to their `_drafts` counterparts. Forward SHA-256 is `0671935382fa31e58b853b1706ccdc3fa8a71cb15f181801ed3ed1e7053911b9`; rollback SHA-256 is `9c04fa449eeb1e18d37ccecb1794bbe570a0322d85104dfc2950ed6c1469a66f`. All four files retain one fail-closed guard before `BEGIN;`.

A remote migration row's version or name cannot prove the exact bytes applied. No approved live history surface supplies content SHA-256, Git blob, deployment bundle identity, or a trustworthy immutable deployment ledger. Therefore these evidence fields must remain `UNAVAILABLE`:

- expected, live, matched, missing, unexpected, and duplicated history identity counts;
- renamed-same-content and different-content counts;
- exact migration-history overall classification.

No repository move, execution decision, guard removal, schema decision, or type-generation decision may rely on guessed history. `EXACT_MATCH` is prohibited until independently reviewed evidence binds deployed content, not only a filename/version.

Evidence that could move the classification beyond `UNAVAILABLE`, but is not collected now, would require one of:

1. an immutable deployment ledger that binds each applied version to exact SQL SHA-256 and a reviewed repository commit;
2. a separately authorized confidential deployment bundle with verifiable signatures and exact content digests;
3. a separately authorized, secret-safe live evidence mechanism that returns only reviewed content-digest categories and is independently reconciled to the repository;
4. a provider-native attestation that cryptographically binds applied content, not merely migration names.

Any such evidence needs separate human and Gemini authorization, secret-handling rules, a one-use execution record, and a bounded output contract. It must not be collected under Phase 27NM-27OL.

## Phase 27OF migration-placement decision preparation

The prepared future disposition is:

1. Keep both `_drafts` files as non-executed authorities until a separately approved placement decision.
2. Keep the two nonstandard active candidates guarded and quarantined now.
3. Eventually retire the two active duplicates from the executable migration stream only under an exact path-scoped repository phase that first proves they were not used as canonical applied identities.
4. If remediation is still required, create a later canonical 14-digit forward-only migration from independently reviewed authority; do not activate the existing guarded candidate by removing its guard.
5. Keep rollback SQL outside the active forward migration stream. A rollback candidate is operator guidance, not a forward migration.
6. Preserve exact active/draft hashes and Git blobs in the decision record.
7. Separate Git rollback from database rollback:
   - if repository placement changes fail before database execution, revert only the exact placement commit;
   - if a later database action occurs, database rollback requires its own approved SQL, preconditions, bounded evidence, and execution authorization.

No file is moved, renamed, deleted, activated, edited, or chmodded in this phase. No migration command or history read runs.

## Phase 27OG bounded audit dependency evidence contract

A future live evidence query may return counts or reviewed categories only. It must not return raw OIDs, owner names, role names beyond the four approved role classes, ACL rows, policy expressions, function definitions, trigger definitions, default expressions, SQLSTATE, or server text.

### Relations and sequence

Evidence scope is limited to:

- `public.admin_audit_logs`;
- `public.admin_audit_archives`;
- `public.admin_audit_logs_id_seq`.

For each relation, bounded evidence must classify:

- present/missing exactly once;
- ordinary/partitioned relation kind as approved;
- RLS enabled;
- RLS forced;
- expected policy count, matched semantic policy count, unexpected policy count;
- owner classification: `EXPECTED_MATCH`, `MISMATCH`, or `UNAVAILABLE` without owner identity disclosure.

For the sequence and its default dependency, bounded evidence must classify:

- sequence present/missing;
- sequence owner match without returning the owner;
- `admin_audit_logs.id` default dependence on the reviewed sequence;
- sequence ownership/dependency: `EXPECTED_MATCH`, `MISSING`, `MISMATCH`, or `UNAVAILABLE`;
- no unreviewed column default or sequence dependency.

### Grant classes

Exactly four role classes are permitted:

| Role class | Expected category |
|---|---|
| `PUBLIC` | `EXPECTED_NONE` |
| `ANON` | `EXPECTED_NONE` |
| `AUTHENTICATED` | `EXPECTED_NONE` |
| `SERVICE_ROLE` | `SUFFICIENT` |

Counts and categories must cover table and sequence privileges relevant to append, archive, read, update, delete, truncate, usage, select, and update. Unexpected or insufficient grants fail closed. The output must never include a raw ACL row or role identity.

### Defaults, functions, and triggers

The evidence contract must identify only by approved repository digest/classification:

- functions reached by `admin_audit_logs` defaults;
- functions reached by non-internal triggers on either audit table;
- non-internal trigger count and enabled-state category;
- function existence and identity class;
- `SECURITY INVOKER`/`SECURITY DEFINER` class;
- safe fixed `search_path` class;
- `PUBLIC`, `anon`, and `authenticated` execute-grant absence;
- reviewed `service_role` execute-grant sufficiency when required.

Allowed function result categories are `UNAVAILABLE`, `EXPECTED_MATCH`, `MISSING`, `UNSAFE_DEFINER_OR_SEARCH_PATH`, and `UNEXPECTED_EXECUTE_GRANT`. Allowed trigger categories are `UNAVAILABLE`, `EXPECTED_MATCH`, `MISSING`, and `UNEXPECTED`. Partial matches and absent dependency identity must remain `UNAVAILABLE` or fail; they cannot become `EXPECTED_MATCH`.

### Separation from public tools remediation

Audit-table/sequence grant cleanup is a separate decision and execution domain from the legacy `public.tools` policy remediation. Evidence, proposed SQL, authorization, execution, rollback, and commits must remain separate. Neither domain can authorize changes in the other.

## Phase 27OH type-generation dependency gate

The exact dependency order is mandatory:

1. approved migration placement;
2. separately authorized bounded live evidence;
3. grant, ownership, function, trigger, sequence, RLS, and policy classifications;
4. any separately authorized schema action;
5. post-action bounded schema identity;
6. independent type-generation planning;
7. exact generated target binding;
8. one-use type-generation authorization;
9. single generation execution;
10. generated diff and secret review;
11. exact-scope commit.

Current target binding remains:

- path: `lib/supabase/database.types.ts`;
- SHA-256: `7173e35d74fa7f59ff3469c2d7e1c95984cfcf37c00b934b1b48ec0f39f1d72c`;
- bytes: `42,654`;
- Git mode: `100644`;
- filesystem mode: `0600`.

The target was neither read for secrets nor modified/chmodded. Type generation is blocked because migration placement, exact deployed history, bounded live dependency evidence, and any required schema action remain unresolved or unauthorized. Phase 27NM-27OL creates no type-generation record, runs no type-generation command, and makes no type claim beyond preservation of the bound file identity.

## Next decision boundary

`HISTORICAL_PHASE_27NM_27OL_BOUNDARY_SUPERSEDED`: the earlier redesign-required and predecessor-repair-required classification described the pre-Option-A, pre-`f7e7bd743a999f691bd30c593617aa191522fec6` state. The committed predecessor repair is complete at that baseline, and the repository now contains a separately reviewed Option A static candidate model for exact-scope integration. This supersession does not promote any static candidate to live readiness.

The current exact integration authority still cannot authorize migration movement, guard removal, live evidence, SQL, database access, grant cleanup, schema action, type generation, authorization-record generation, protected-launcher installation, wrapper activation, or any operational action. Each remains blocked and requires a separately named scope and exact future authorization.
