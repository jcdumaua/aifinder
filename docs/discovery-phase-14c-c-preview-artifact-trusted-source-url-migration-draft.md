# Phase 14C-C — Preview Artifact Trusted Source URL Migration Draft

## 1. Status

Phase 14C-C is a migration-draft-only phase.

This phase drafts raw SQL only.

This phase does not apply the migration.

This phase does not regenerate generated types.

This phase does not modify UI components, API routes, providers, helpers, tests, package files, generated types, Supabase schema state, environment configuration, or deployment configuration.

This phase does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 14C-C:

- `88393f6 Document trusted source URL design`

Phase 14C-B selected the hybrid trusted source URL strategy:

- store `source_url_snapshot` on preview artifacts;
- treat it as the canonical reviewed source URL;
- validate source/run lineage in the provider;
- do not rely solely on mutable nullable `discovery_sources.url`;
- do not map `candidateWebsiteUrl` into `sourceUrl`.

The current preview artifact table does not include `source_url_snapshot`.

The current accepted preview provider output does not include `sourceUrlSnapshot`.

Backend live staging remains blocked.

## 3. Drafted Migration File

This phase drafts:

- `supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql`

The migration draft is intentionally not applied.

The migration draft is intentionally not accompanied by generated type updates.

## 4. Drafted SQL Summary

The migration draft proposes to:

1. Add nullable `source_url_snapshot text`.
2. Update `preview_schema_version` default to `candidate_preview_artifact.v2`.
3. Replace the schema-version check constraint so both v1 and v2 can exist.
4. Add length and HTTPS format constraints for `source_url_snapshot`.
5. Add a reviewable-source-url-snapshot check constraint as `not valid`.
6. Extend preview artifact safety flag allowlist with source URL snapshot flags.
7. Add an index for `source_url_snapshot`.
8. Add comments documenting that the field is server-derived, HTTPS, reviewed, distinct from candidate website URL, and never client-supplied.

## 5. Why The Reviewable Constraint Is `not valid`

The draft uses:

```sql
not valid
```

for the reviewable source URL snapshot check.

Reason:

- historical reviewable v1 rows may exist without `source_url_snapshot`;
- migration application should not fail because of historical rows;
- new inserts and updates should still be held to the new rule;
- provider logic must reject old v1 artifacts for backend activation;
- future preview regeneration should create v2 rows with source URL snapshots.

This preserves backward compatibility while keeping the future live staging path fail-closed.

## 6. Schema Version Policy

The draft allows:

- `candidate_preview_artifact.v1`;
- `candidate_preview_artifact.v2`.

The default becomes:

- `candidate_preview_artifact.v2`

Rationale:

- v1 rows remain readable for historical/admin review if needed;
- v1 rows remain unsupported for backend activation;
- v2 becomes the future preview contract requiring `source_url_snapshot`;
- provider implementation must decide exact rejection behavior for old v1 rows.

## 7. Safety Flag Additions

The draft adds these allowlisted safety flags:

- `source_url_snapshot_validated`;
- `source_url_snapshot_missing_blocked`;
- `source_url_snapshot_unsafe_blocked`;
- `source_url_drift_blocked`.

These flags are short safe tokens only.

They must not contain raw URLs, raw HTML, LLM output, stack traces, SQL errors, cookies, CSRF tokens, service-role details, or secrets.

## 8. Explicit Non-Authorization

This phase does not authorize:

- `supabase db push`;
- remote SQL execution;
- migration application;
- generated type regeneration;
- provider implementation;
- route implementation;
- UI implementation;
- backend live gate resolver implementation;
- live staging;
- live smoke.

A future apply/typegen phase must require an exact approval phrase.

## 9. Future Required Review

Before any migration apply, Gemini must review:

- constraint names;
- backward compatibility;
- `not valid` usage;
- schema version policy;
- safety flag allowlist updates;
- index usefulness;
- whether comments are clear;
- whether the migration can be applied safely without data cleanup;
- whether provider implementation will safely reject v1 artifacts for backend activation.

## 10. Future Provider Work After Apply/Typegen

After an approved apply/typegen phase, a separate provider implementation phase must:

- expose `sourceUrlSnapshot` in accepted preview output;
- validate HTTPS source URL;
- reject localhost;
- reject loopback/private IP ranges;
- reject unsafe payloads;
- reject missing source URL snapshots;
- reject or mark stale source drift;
- reject old v1 artifacts for backend activation;
- never expose raw source config;
- never expose raw DB rows;
- never expose SQL/stack/service-role details.

## 11. Backend Activation Still Blocked

Backend live gate resolver implementation remains blocked until:

1. the migration draft is Gemini-approved;
2. migration apply/typegen are separately approved and completed, if chosen;
3. provider supports `sourceUrlSnapshot`;
4. provider tests pass;
5. Gemini approves resuming backend activation.

## 12. Phase 14C-C Verification Plan

Run:

- `git diff --check`;
- `npm run check`;
- `git diff --stat`;
- `git diff --name-only`;
- `git status --short --branch`.

Expected changed files:

- `docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md`
- `supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql`

Expected forbidden changes:

- no UI component files;
- no API route files;
- no provider files;
- no helper files;
- no test files;
- no package files;
- no generated type files.

## 13. Commit Readiness Criteria

Phase 14C-C is safe to commit only if:

- Gemini approves the migration draft;
- verification passes;
- only the Phase 14C-C docs file and migration draft are staged;
- no UI is changed;
- no route is changed;
- no provider/helper is changed;
- no tests are changed;
- no package files are changed;
- no generated types are changed;
- no migration is applied;
- no live commands are run;
- no DB commands are run;
- no POST requests are sent;
- no CSRF fetch occurs;
- no live staging occurs.
