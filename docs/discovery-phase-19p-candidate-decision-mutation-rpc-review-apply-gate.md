# Discovery Phase 19P — Candidate Decision Mutation RPC Review / Apply Gate

## Status

Phase 19P is a docs-only review/apply gate.

It follows Phase 19O, which drafted the candidate decision mutation RPC migration:

```text
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
```

Phase 19P does not apply the migration.

Phase 19P does not run Supabase DB push.

Phase 19P does not run type generation.

Phase 19P does not run live mutation smoke or API smoke.

## Purpose

Phase 19P defines the final checklist and exact approval gate before the drafted RPC migration can be applied.

Target RPC:

```text
public.admin_apply_discovery_candidate_decision(...)
```

The RPC is intended to atomically:

```text
update public.discovery_candidate_tools decision fields
insert public.discovery_audit_events action = candidate_decision
return the updated candidate decision row
```

## Current Migration Status

The migration is currently:

```text
drafted locally and committed in Phase 19O
not applied remotely
not type-generated
not live-smoke-tested
```

The migration file is:

```text
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
```

## Exact Apply Approval Phrase

The migration must not be applied unless James explicitly provides this exact approval phrase in chat:

```text
Approve Phase 19P candidate decision RPC migration apply
```

Any other phrase is insufficient for live apply.

## Apply Scope

The apply step, when separately approved, may run only the Supabase migration apply command needed to apply the pending migration.

Allowed apply target:

```text
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
```

The apply step must not modify source code.

The apply step must not run type generation.

The apply step must not run API/helper/UI/test implementation.

The apply step must not run live smoke automatically.

## Required Pre-Apply Checks

Before applying the migration, the execution script must verify:

```text
branch is main
working tree is clean
local HEAD matches the pushed Phase 19P commit
origin/main matches local HEAD
latest commit is Phase 19P
Phase 19O migration exists
migration contains public.admin_apply_discovery_candidate_decision
migration contains security definer
migration contains set search_path = public, pg_temp
migration grants execute only to service_role
migration revokes execute from public, anon, and authenticated
migration does not touch public.tools
migration does not touch public.discovered_tools
migration does not write published candidate status
npm run check passes
git diff --check passes
```

## Required Post-Apply Checks

After applying the migration, the execution script must verify:

```text
migration is recorded as applied remotely
public.admin_apply_discovery_candidate_decision exists remotely
function argument names and types are present
function return fields are present
function language is plpgsql
function security is SECURITY DEFINER
function search_path includes public, pg_temp
execute privilege is not granted to anon
execute privilege is not granted to authenticated
execute privilege is granted to service_role
npm run check passes
git diff --check passes
working tree remains clean
```

## Required Read-Only Remote Verification Queries

A Phase 19P apply execution script may use read-only SQL after apply to inspect metadata.

Recommended checks:

```sql
select
  p.proname,
  l.lanname,
  p.prosecdef,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
  and p.proname = 'admin_apply_discovery_candidate_decision';
```

```sql
select
  has_function_privilege('anon', 'public.admin_apply_discovery_candidate_decision(uuid,text,text,text,uuid,bigint,text,text)', 'execute') as anon_execute,
  has_function_privilege('authenticated', 'public.admin_apply_discovery_candidate_decision(uuid,text,text,text,uuid,bigint,text,text)', 'execute') as authenticated_execute,
  has_function_privilege('service_role', 'public.admin_apply_discovery_candidate_decision(uuid,text,text,text,uuid,bigint,text,text)', 'execute') as service_role_execute;
```

Expected privilege result after apply:

```text
anon_execute = false
authenticated_execute = false
service_role_execute = true
```

## RPC Design Review Checklist

The RPC must preserve these validated Phase 19 boundaries:

```text
allowed actions only:
approve_for_draft
reject
duplicate
needs_more_evidence
archive
```

```text
unsupported action markers rejected:
publish
published
promote_to_tools
promoted_to_publish_draft
insert_public_tool
insert_discovered_tool
```

```text
candidate status mapping:
approve_for_draft -> approved_for_draft
reject -> rejected
duplicate -> duplicate
needs_more_evidence -> needs_more_evidence
archive -> archived
```

The RPC must never write:

```text
candidate_status = published
```

The RPC must reject `duplicate_of_tool_id` until separately approved.

The RPC must write exactly one audit event on successful decision mutation:

```text
action = candidate_decision
```

## Safety Boundaries

The RPC migration must not:

- write to `public.tools`
- write to `public.discovered_tools`
- create a publish workflow
- wire UI decision buttons
- implement API route code
- implement helper code
- implement smoke test code
- modify generated types
- modify RLS
- mutate candidate rows during the apply step
- mutate audit rows during the apply step

## Phase 19P Apply Result Documentation Requirement

If the apply is executed later, the result must be documented in a separate result phase.

Recommended next result doc:

```text
docs/discovery-phase-19p-candidate-decision-mutation-rpc-apply-result.md
```

That result doc should record:

```text
exact approval phrase
baseline commit
apply command run
migration status before apply
migration status after apply
function metadata verification
function privilege verification
npm run check result
git diff --check result
final git status
boundaries preserved
```

## Expected Next Phase If This Gate Is Committed

After Phase 19P is committed and pushed, the next phase is either:

```text
Phase 19Q — Candidate Decision Mutation RPC Apply Execution
```

or, if Gemini requests changes:

```text
Phase 19P-R — Candidate Decision Mutation RPC Review / Apply Gate Revision
```

## Non-Goals

Phase 19P does not:

- apply the migration
- run Supabase DB push
- run schema apply
- run type generation
- run live mutation smoke
- run API smoke
- implement API route code
- implement helper code
- implement validation code
- implement UI
- modify package files
- write to candidate rows
- write to audit events
- write to public.tools
- write to discovered_tools
- publish candidates

## Gemini Review Questions

Gemini should review:

```text
Is the apply gate strict enough?
Is the exact approval phrase clear enough?
Are pre-apply checks sufficient?
Are post-apply remote verification checks sufficient?
Are function privilege checks sufficient?
Should Phase 19P be committed?
Should the next phase be Phase 19Q apply execution, or should this gate be revised?
```

## Conclusion

Phase 19P defines the review and exact approval gate for applying the Candidate Decision Mutation RPC.

No migration apply may happen until the exact approval phrase is provided after this gate is reviewed, committed, and pushed.
