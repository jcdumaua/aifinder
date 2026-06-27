# Phase 9N — Candidate Staging Schema & Audit Expansion Migration Apply / Type Generation Result

## 1. Phase title and status

Phase 9N applied the reviewed candidate staging schema/audit expansion migration and regenerated Supabase TypeScript types.

This phase did not modify source code, tests, helpers, smoke scripts, package scripts, API routes, UI components, extraction logic, crawler automation, LLM behavior, or application write paths.

## 2. Explicit approval

James explicitly approved Phase 9N migration apply and type generation.

Applied migration:

```text
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql
```

## 3. Migration apply result

Migration apply command:

```bash
supabase db push
```

Result:

```text
Applying migration 20260626171330_candidate_staging_schema_audit_expansion.sql...
Finished supabase db push.
```

No application data rows were inserted, updated, deleted, or upserted by this phase.

## 4. Post-apply remote schema verification

Post-apply verification used SELECT-only linked Supabase queries through:

```bash
supabase db query --linked --output table
```

No secrets, connection strings, or environment values were printed.

### `discovery_source_id`

Remote schema now includes:

```text
column_name: discovery_source_id
data_type: uuid
is_nullable: YES
```

### Foreign key

Remote schema now includes:

```text
discovery_candidate_tools_discovery_source_id_fkey
```

Constraint definition:

```text
FOREIGN KEY (discovery_source_id) REFERENCES discovery_sources(id) ON DELETE RESTRICT
```

### Indexes

Remote schema now includes:

```text
discovery_candidate_tools_discovery_source_id_idx
discovery_candidate_tools_run_source_idx
```

Index definitions:

```text
CREATE INDEX discovery_candidate_tools_discovery_source_id_idx ON public.discovery_candidate_tools USING btree (discovery_source_id)
CREATE INDEX discovery_candidate_tools_run_source_idx ON public.discovery_candidate_tools USING btree (discovery_run_id, discovery_source_id)
```

### Audit action constraint

Remote schema now includes expanded `discovery_audit_events_action_check`.

Allowed values verified:

```text
approve
reject
flag
ignore
batch-action
mark-duplicate
candidate-staged
candidate-stage-failed
candidate-duplicate-hint-recorded
candidate-cleanup-performed
```

### RLS and grants

Remote RLS status:

```text
schema_name: public
table_name: discovery_candidate_tools
row_security_enabled: true
force_row_security: false
```

Anon/authenticated grants on `public.discovery_candidate_tools`:

```text
No rows returned.
```

## 5. Supabase type generation result

Type generation command:

```bash
supabase gen types typescript --linked > lib/supabase/database.types.ts
```

Generated type diff summary:

- `discovery_candidate_tools.Row.discovery_source_id: string | null`
- `discovery_candidate_tools.Insert.discovery_source_id?: string | null`
- `discovery_candidate_tools.Update.discovery_source_id?: string | null`
- relationship `discovery_candidate_tools_discovery_source_id_fkey` to `discovery_sources(id)`

No unrelated generated type drift was observed in the inspected diff.

## 6. Safety boundaries preserved

Phase 9N preserved these boundaries:

- no source code changes;
- no test changes;
- no helper changes;
- no smoke script changes;
- no package script changes;
- no API/UI/extraction/crawler/LLM integration;
- no candidate rows created;
- no discovery run rows created;
- no discovery source rows created;
- no `public.tools` writes;
- no `discovered_tools` writes;
- no audit event writes;
- no live RLS smoke rerun;
- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.

## 7. Files changed

Expected Phase 9N changes:

```text
lib/supabase/database.types.ts
docs/discovery-phase-9n-candidate-staging-schema-audit-expansion-apply-type-generation-result.md
```

## 8. Final verdict

Phase 9N migration apply and type generation succeeded.

The database schema and generated Supabase types now support persisted `discovery_source_id` on staged candidates.

## 9. Recommended next phase

Recommended next phase:

```text
Phase 9O — Candidate Staging Helper Mapping Update Plan
```

Purpose:

- plan the code/test changes needed to map `StageNormalizedDiscoveryCandidateInput.discoverySourceId` into `discovery_candidate_tools.discovery_source_id`;
- keep implementation separate from the migration/type-generation phase;
- keep API/UI/extraction/crawler/LLM integration deferred;
- plan post-schema RLS smoke recheck after helper mapping is updated.
