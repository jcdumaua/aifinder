# Phase 22AI — Candidate Extraction/Live-Staging Target Context Read-Only Discovery Approval Gate

## Phase purpose

Phase 22AI is a documentation-only approval gate for a future bounded read-only target-context discovery command.

Phase 22AI follows Phase 22AH, which defined the target-context criteria, safe output categories, forbidden output fields, and stop conditions for a future read-only discovery phase.

Phase 22AI prepares the exact future approval phrase, command shape, allowed read scope, output contract, stop conditions, and verification assertions for Phase 22AJ.

Phase 22AI does not run the read-only discovery command.

## Current baseline

Phase 22AI starts from the pushed Phase 22AH commit:

- `c6534a5 Document live staging target context readiness gate`

## Current operational state

From Phase 22AD / 22AE:

| Candidate status | Count |
| --- | ---: |
| `archived` | 1 |
| `needs_more_evidence` | 1 |
| `staged` | 0 |

Candidate decision execution remains blocked because no staged candidate exists.

## Boundary

Allowed in Phase 22AI:

- Verify repo state.
- Verify latest commit.
- Run static-only inspection of existing docs, routes, helpers, read models, tests, and database type references.
- Run existing project checks.
- Define the future Phase 22AJ read-only discovery approval phrase.
- Define the future Phase 22AJ command shape.
- Define the future Phase 22AJ allowed read scope.
- Define the future Phase 22AJ output contract.
- Define fail-closed stop conditions and verification assertions.
- Prepare a Gemini review package.

Forbidden in Phase 22AI:

- No live DB read.
- No Supabase query.
- No API route call.
- No read-only discovery execution.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate creation.
- No candidate status change.
- No DB mutation.
- No candidate UUID selection.
- No candidate target selection.
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Future Phase 22AJ approval phrase

Phase 22AJ must not run unless James provides this exact phrase:

```text
Approve Phase 22AJ target context read-only discovery
```

Any other wording, including casual approval, authorizes planning only and must not run the read-only discovery.

This phrase authorizes only the bounded read-only discovery command defined by Phase 22AI after Gemini approval.

It does not authorize:

- live staging,
- candidate creation,
- fixture creation,
- candidate decision execution,
- cleanup,
- public publishing,
- `approve_for_draft`,
- schema changes,
- type generation,
- source/API/UI implementation changes.

## Future Phase 22AJ command shape

Phase 22AJ should run as a guarded terminal script generated for the execution phase, not as a permanent source-code change.

Recommended command shape:

```bash
cd /Users/jamescarlodumaua/aifinder
AIFINDER_RUN_PHASE_22AJ_TARGET_CONTEXT_READ_ONLY_DISCOVERY=1 \
node /tmp/aifinder-phase-22aj-target-context-read-only-discovery.mjs
```

The `/tmp` script should be generated only during Phase 22AJ after the exact approval phrase is received.

The Phase 22AJ script must:

- require `AIFINDER_RUN_PHASE_22AJ_TARGET_CONTEXT_READ_ONLY_DISCOVERY=1`;
- verify repo root and latest commit;
- print a clear read-only boundary;
- perform only bounded `select` reads;
- never call insert, update, upsert, delete, RPC mutation, API routes, extraction, crawler logic, candidate decision routes, `approve_for_draft`, or public publishing routes;
- use `tee` to capture output;
- copy raw terminal output to clipboard with `pbcopy`;
- preserve the original exit code.

## Future Phase 22AJ allowed read scope

The future read-only discovery command may read only the minimum tables/fields required to determine whether an eligible natural live-staging target context exists.

Recommended allowed read scope:

### `discovery_runs`

Allowed fields:

- `id`
- `source_id`
- `status`
- `updated_at`
- a safe timestamp field if required for deterministic ordering

Purpose:

- confirm the run exists;
- confirm the run/source relationship;
- support deterministic narrowing.

### `discovery_sources`

Allowed fields:

- `id`
- `url`
- `source_type`
- `updated_at`

Purpose:

- confirm the source exists;
- confirm safe source URL lineage;
- support source URL snapshot drift checks.

### `discovery_candidate_preview_artifacts`

Allowed fields:

- `id`
- `discovery_run_id`
- `discovery_source_id`
- `audit_correlation_id`
- `preview_status`
- `preview_schema_version`
- `preview_generated_at`
- `candidate_name`
- `candidate_website_url`
- `source_url_snapshot`
- `source_evidence_locator`
- safe summary/flag fields if required for eligibility assertions

Purpose:

- identify reviewable preview availability;
- detect ambiguity;
- validate source/run lineage;
- check source URL snapshot safety;
- check source evidence availability.

### `discovery_candidate_tools`

Allowed read shape:

- aggregate count only for staged collision checks;
- no candidate UUID printing;
- no full row printing.

Allowed filters:

- `candidate_status = "staged"`;
- discovery run/source/audit correlation filters only when required to detect collision.

Purpose:

- confirm no existing staged candidate collision for the same target context.

## Future Phase 22AJ output contract

### Required summary lines

The future command should print clear machine-readable lines similar to:

```text
TARGET_CONTEXT_READ_ONLY_DISCOVERY_PASS
phase=22AJ
commit=<commit>
eligible_context_exists=<true|false>
eligible_context_count=<number>
ambiguous_context=<true|false>
has_reviewable_preview=<true|false>
source_run_matched=<true|false>
safe_source_evidence=<true|false>
source_url_snapshot_validated=<true|false>
source_candidate_url_distinct=<true|false>
staged_collision_count=<number>
would_stage_at_most_one_candidate=<true|false>
no_candidate_uuid_printed=true
no_candidate_decision=true
no_db_mutation=true
no_public_publish=true
no_approve_for_draft=true
```

### Safe fields that may print by default

- Phase marker.
- Commit hash.
- Aggregate counts.
- Whether an eligible context exists.
- Eligible context count.
- Ambiguity boolean.
- Boolean eligibility checks.
- Staged collision count.
- Stop condition code.

### Fields requiring explicit approval in the Phase 22AJ execution prompt before printing

- `discovery_run_id`
- `discovery_source_id`
- Preview artifact ID
- Audit correlation ID
- Source URL snapshot
- Candidate website URL
- Candidate name
- Evidence locator

Phase 22AI recommends that Phase 22AJ initially **does not print these values** unless Gemini explicitly approves the exact subset needed for Phase 22AK.

### Fields that must not print

- Candidate UUIDs from `discovery_candidate_tools`.
- Raw preview payloads.
- Raw extracted JSON.
- Raw HTML.
- Secrets.
- Service-role keys or credential material.
- Environment variables.
- Stack traces.
- Full database rows.
- Unbounded candidate descriptions.
- Any field outside the approved output contract.

## Future Phase 22AJ stop conditions

The Phase 22AJ command must fail closed and avoid selecting a context if:

1. The opt-in environment variable is missing.
2. Repo root or latest commit does not match the expected baseline.
3. Required environment variables for read-only access are missing.
4. No reviewable preview exists.
5. More than one eligible context exists and deterministic narrowing has not been pre-approved.
6. The run/source relationship is missing or mismatched.
7. The preview status is not `reviewable`.
8. The preview schema version is unsupported.
9. Source URL snapshot is missing.
10. Source URL snapshot is unsafe.
11. Source URL snapshot equals candidate website URL.
12. Source URL drift is detected.
13. Source evidence locator is missing or unsafe.
14. Existing staged candidate collision is detected.
15. Any query would need to print forbidden fields.
16. Any query would need mutation, extraction execution, crawler execution, API route execution, or candidate decision execution.
17. Any result would select a candidate decision target.

## Future Phase 22AJ verification assertions

Phase 22AJ should assert:

- The command was opt-in gated.
- The command performed read-only selects only.
- No `insert`, `update`, `upsert`, `delete`, or mutation RPC was used.
- No API route was called.
- No extraction or crawler execution was run.
- No fixture was created.
- No candidate was created.
- No candidate status was changed.
- No candidate UUID was printed.
- No candidate decision target was selected.
- No candidate decision was executed.
- No public tools write occurred.
- No discovered tools write occurred.
- No `approve_for_draft` flow was called.
- No cleanup mutation occurred.
- Output matched the approved safe output contract.

## Expected Phase 22AJ result handling

If Phase 22AJ finds exactly one eligible context without printing restricted fields:

- Document the safe boolean result.
- Stop.
- Do not stage a candidate.
- Prepare a separate Phase 22AK live-staging repopulation approval gate.

If Phase 22AJ finds zero eligible contexts:

- Document the zero-context result.
- Stop.
- Consider fallback planning for controlled fixture creation or preview artifact preparation.

If Phase 22AJ finds multiple eligible contexts:

- Document ambiguity using aggregate counts only.
- Stop.
- Do not choose one by inference.

If Phase 22AJ detects unsafe output requirements:

- Stop.
- Prepare a narrower approval gate.

## Recommended next phase

Recommended next phase:

**Phase 22AJ — Candidate Extraction/Live-Staging Target Context Read-Only Discovery Live Execution**

Only after:

1. Gemini approves Phase 22AI.
2. Phase 22AI is committed and pushed.
3. James provides the exact approval phrase:

```text
Approve Phase 22AJ target context read-only discovery
```

## Explicit non-goals

Phase 22AI does not approve:

- Running the read-only discovery.
- Running a live DB read.
- Running a Supabase query.
- Calling API routes.
- Running extraction.
- Running a crawler.
- Creating or staging a candidate.
- Creating a fixture.
- Selecting a discovery run/source/preview target.
- Printing restricted target context fields.
- Selecting a candidate UUID.
- Selecting a candidate decision target.
- Changing `needs_more_evidence` to `staged`.
- Changing `archived` to `staged`.
- Executing a candidate decision.
- Calling `approve_for_draft`.
- Publishing to public tools.
- Cleanup mutation.
- API/UI/Supabase/schema/migration/typegen changes.

## Review conclusion

Gemini approved Phase 22AI for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no system state was altered and no live DB reads, Supabase queries, API calls, read-only discovery execution, extraction, crawler logic, staging operations, candidate creation, status changes, or database mutations are authorized.
- The tiered output contract is confirmed as sound: always-safe outputs, approved-only outputs, and forbidden outputs are separated.
- Sensitive operational metadata such as `discovery_run_id`, `discovery_source_id`, preview artifact ID, audit correlation ID, source URL snapshot, candidate website URL, candidate name, and evidence locator remain approved-only and must not print by default.
- The 17 fail-closed stop conditions are confirmed as comprehensive enough for source drift, missing artifacts, ambiguity, staged collision checks, forbidden output requirements, mutation, staging, extraction, crawler execution, API route execution, and candidate target selection.
- No candidate UUID, candidate decision target, discovery run target, discovery source target, or preview artifact target is selected or recorded by this phase.
- The exact future approval phrase is confirmed: `Approve Phase 22AJ target context read-only discovery`.
- Phase 22AJ remains a separate execution phase and must not run until Phase 22AI is committed, pushed, and James provides the exact approval phrase.
- Safety locks remain active for live staging, fixture creation, mutations, cleanup, `approve_for_draft`, public publishing, and candidate decisions.

Commit approval is limited to this documentation update. No read-only discovery command, target selection, extraction run, staging write, fixture creation, status transition, or candidate decision may proceed from Phase 22AI.

## Next recommended phase after approval, commit, and push

Phase 22AJ — Candidate Extraction/Live-Staging Target Context Read-Only Discovery Live Execution.

Phase 22AJ must not run until James gives the exact approval phrase after Phase 22AI has been reviewed, committed, and pushed.
