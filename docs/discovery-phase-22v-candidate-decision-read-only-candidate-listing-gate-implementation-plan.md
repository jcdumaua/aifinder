# AiFinder Discovery Engine — Phase 22V Candidate Decision Read-Only Candidate Listing Gate Implementation Plan

## Phase Status

Phase 22V is a documentation-only implementation plan.

This phase plans a future read-only candidate listing gate script.

This phase does not implement the script.

This phase does not create executable files.

This phase does not run a live database query.

This phase does not inspect live candidate rows.

This phase does not select a live candidate.

This phase does not record a live candidate UUID.

This phase does not run the candidate decision execution preflight script.

This phase does not perform candidate decision execution.

This phase does not perform database mutation.

This phase does not publish public-facing tools.

This phase does not run `approve_for_draft`.

This phase does not perform cleanup mutation.

This phase does not modify source code.

This phase does not modify executable scripts.

This phase does not modify API routes.

This phase does not modify UI.

This phase does not modify Supabase schema, migrations, policies, or generated types.

## Starting Checkpoint

Phase 22U was completed and pushed to `main`.

```text
Latest pushed commit: 3496454 Document Phase 22U read-only candidate listing gate design
Expected repo status before Phase 22V docs step: ## main...origin/main
```

## Background

Phase 22U designed a future bounded read-only candidate listing gate.

The gate is intended only as a fallback path when James does not already have an exact candidate UUID from a trusted source.

Phase 22U established the following core constraints:

- listing gate is read-only
- listing gate is bounded
- listing gate requires explicit status filtering
- listing gate outputs minimal fields
- listing gate does not auto-select a target
- James manually selects one exact UUID later
- public publishing remains locked
- `approve_for_draft` remains locked
- cleanup mutation remains locked
- candidate decision execution remains locked

Phase 22V now converts that design into an implementation plan for a future script.

## Purpose

The purpose of Phase 22V is to define the exact future script contract before implementation.

The future script should be narrow, fail-closed, and read-only.

The future script should be implemented only after this plan is reviewed and approved.

The future script should not be executed against the live database until a later separate live execution approval gate.

## Future Script Name

Recommended future script path:

```text
testing/discovery-candidate-decision-read-only-listing-gate.mjs
```

The file must not be created in Phase 22V.

The file may be created in a later implementation phase only.

Recommended next phase if this plan is approved:

```text
Phase 22W — Candidate Decision Read-Only Candidate Listing Gate Script Implementation
```

## Future Script Purpose

The future script should perform one bounded read-only candidate listing query.

The query should help James manually choose one exact candidate UUID in a later phase.

The script must not choose a candidate.

The script must not run preflight.

The script must not execute a decision.

The script must not mutate data.

The script must not publish public tools.

The script must not approve for draft.

The script must not cleanup candidates.

## Future Script Table Scope

Expected candidate table:

```text
public.discovery_candidate_tools
```

The implementation phase must verify the actual schema before finalizing field names.

If the table or required fields are absent, the script must fail locked or the phase must return to documentation.

The script must not query public-facing `tools` as the candidate source.

The script must not query broad audit tables unless separately approved.

The script must not query unrelated tables.

## Future Read-Only Query Scope

The future query should be limited to:

- one table
- one explicit candidate status filter
- one small result limit
- deterministic ordering
- minimal output fields

Recommended status filter:

```text
staged
```

Recommended default result limit:

```text
5
```

Recommended maximum result limit:

```text
10
```

Recommended ordering:

```text
created_at ascending
id ascending
```

The implementation phase must verify whether these fields exist and are appropriate.

If the schema uses different field names, the implementation phase must document the exact mapping.

## Future Output Fields

The future script should output only the minimum useful candidate fields.

Recommended output fields:

- candidate UUID
- candidate status
- normalized candidate name or display label
- canonical URL or source URL, if available
- source label or source reference, if available
- created timestamp
- updated timestamp

Optional fields only if schema-safe and necessary:

- candidate category
- candidate pricing label
- duplicate-detection summary
- short decision readiness label
- audit correlation id

The future script must not print raw extraction payloads or broad metadata blobs.

## Future Prohibited Output

The future script must not print:

- service role key
- environment variable values
- Supabase URL secret-like values
- full raw extraction payload
- full HTML capture
- screenshot storage paths unless separately approved
- signed/private storage URLs
- broad audit payloads
- unrelated metadata blobs
- personal data
- secrets
- full stack traces containing environment details
- public publishing payloads
- cleanup mutation payloads

If the query cannot produce a useful output without prohibited fields, it must fail closed.

## Future Environment Contract

The future script must be locked by default.

Recommended required environment variables:

```text
AIFINDER_RUN_CANDIDATE_DECISION_READ_ONLY_LISTING_GATE=1
AIFINDER_CANDIDATE_DECISION_LISTING_PHASE=22W
AIFINDER_CANDIDATE_DECISION_LISTING_EXPECTED_COMMIT=<expected_commit_hash>
AIFINDER_CANDIDATE_DECISION_LISTING_STATUS=staged
AIFINDER_CANDIDATE_DECISION_LISTING_LIMIT=5
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_LISTING_APPROVAL_PHRASE="Approve Phase 22W read-only candidate listing gate status staged limit 5"
```

The final phase token in the implementation phase should match the actual phase.

The expected commit must match the latest pushed checkpoint for the implementation or execution phase.

The script must fail locked if any required variable is missing or unexpected.

## Future Supabase Environment Requirements

The future script may need Supabase environment variables only in a later live execution phase.

The implementation phase should not require live credentials for local static verification.

A future live execution phase may require:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

or the project’s existing approved admin/server Supabase environment names.

The script must never print these values.

The script must fail locked if credentials are missing in a live execution phase.

Credential requirements must be confirmed against existing project conventions during implementation.

## Future Validation Rules

The future script should validate:

- opt-in value equals `1`
- phase token is canonical AiFinder format
- expected commit is a short or full git hash
- current repo status is clean
- current commit equals expected commit
- status filter is from an approved allowlist
- limit is an integer within approved bounds
- public publishing flag is exactly `false`
- `approve_for_draft` flag is exactly `false`
- cleanup flag is exactly `false`
- execution flag is exactly `false`
- approval phrase exactly matches expected phrase
- required Supabase environment variables are present only when live execution is authorized
- no mutation mode is available

Recommended phase token validation pattern should match the previously approved preflight script pattern:

```text
^(?:Phase)?[0-9]{1,3}[A-Z]{1,3}$
```

## Future Approved Status Allowlist

The first implementation should use a narrow status allowlist.

Recommended initial allowlist:

```text
staged
```

If additional statuses are needed, they must be added in a later reviewed phase.

The future script must fail locked for unsupported status values.

It must not support `all`.

It must not support empty status.

It must not support comma-separated status lists.

It must not support arbitrary SQL fragments.

## Future Limit Validation

The future script should accept only integer limits.

Recommended rules:

- default documented value: `5`
- maximum allowed value: `10`
- minimum allowed value: `1`
- no decimals
- no negative values
- no zero
- no empty value
- no whitespace-only value
- no non-numeric values

The future script must fail locked if limit validation fails.

## Future Repository Guard

The future script should verify repo state before any live read.

Expected clean status:

```text
## main...origin/main
```

The future script should also verify:

```text
git rev-parse --short HEAD
```

matches:

```text
AIFINDER_CANDIDATE_DECISION_LISTING_EXPECTED_COMMIT
```

If the repository is dirty, the future script must fail locked before any database connection.

If a review document is untracked, the live read must not run in the main working tree.

If a temporary clean clone is used, that must be separately documented and reviewed.

## Future Markers

Recommended success marker:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_PASS
```

Recommended no-results marker:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS
```

Recommended fail-locked marker:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_FAIL_LOCKED
```

Recommended no-selection reminder:

```text
NO_CANDIDATE_SELECTED_BY_LISTING
```

The script should print exactly one of the main outcome markers.

## Future Output Shape

Recommended successful output shape:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_PASS
phase=<phase>
commit=<commit>
status_filter=<status>
limit=<limit>
count=<count>
NO_CANDIDATE_SELECTED_BY_LISTING

candidate[1].id=<uuid>
candidate[1].status=<status>
candidate[1].name=<display_label>
candidate[1].url=<url_or_empty>
candidate[1].source=<source_or_empty>
candidate[1].created_at=<timestamp>
candidate[1].updated_at=<timestamp>
```

Recommended no-results output shape:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS
phase=<phase>
commit=<commit>
status_filter=<status>
limit=<limit>
count=0
NO_CANDIDATE_SELECTED_BY_LISTING
```

Recommended locked failure output shape:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_FAIL_LOCKED
reason=<safe_reason>
```

Failure reasons must be safe and must not print secrets.

## Future Query Behavior

The future query should:

- select only allowed fields
- filter by exact status
- order deterministically
- limit rows
- avoid joins unless separately approved
- avoid RPCs unless separately approved
- avoid writes
- avoid update/delete/insert/upsert
- avoid audit writes
- avoid decision routes
- avoid public publishing routes
- avoid cleanup routines
- avoid `approve_for_draft`

The script should avoid any code path that can mutate data.

## Future Static Safety Checks

The future implementation phase should include static checks that fail if mutation tokens appear.

Recommended prohibited token scan terms:

```text
insert(
update(
upsert(
delete(
rpc(
approve_for_draft
public.tools insert
from('tools').insert
from("tools").insert
candidate decision execution
cleanup mutation
```

The exact scan should avoid false positives in comments where possible, but mutation-capable code must not be present.

## Future Local Verification Before Live Execution

The implementation phase should verify:

- `node --check testing/discovery-candidate-decision-read-only-listing-gate.mjs`
- missing opt-in fails locked
- invalid phase token fails locked
- dirty repo fails locked, if testable safely
- unsupported status fails locked
- invalid limit fails locked
- lock flag set to true fails locked
- generic approval phrase fails locked
- no live DB connection is attempted during fail-locked cases before credentials are checked

Live database execution should not happen during implementation unless separately approved.

## Future Live Execution Gate

A later live execution approval gate must be separate.

Recommended future live execution gate phase:

```text
Phase 22Y — Candidate Decision Read-Only Candidate Listing Gate Live Execution Approval Gate
```

That phase should confirm:

- implementation was reviewed
- script remains read-only
- exact env contract is ready
- result limit is approved
- status filter is approved
- no uncommitted files exist
- James explicitly approves live read-only execution
- Gemini approves the live read-only execution package, if required

## Future Live Execution Phase

Recommended future live execution phase:

```text
Phase 22Z — Candidate Decision Read-Only Candidate Listing Gate Live Execution
```

That phase should:

- run exactly one approved read-only listing command
- capture output to `/tmp`
- copy raw output with `pbcopy`
- preserve exit status
- not commit
- not push
- not select a candidate
- not run preflight
- not mutate data

The live execution result should be documented in a later phase.

## Future Result Documentation Phase

Recommended future result documentation phase:

```text
Phase 22AA — Candidate Decision Read-Only Candidate Listing Gate Result Documentation
```

That phase should document:

- command run
- env values excluding secrets
- marker observed
- result count
- whether any candidates were available
- confirmation that no candidate was selected
- confirmation that no mutation occurred
- recommended next step

## Future Exact UUID Target Package

Only after a listing result is documented should the workflow proceed to:

```text
Phase 22AB — Candidate Decision Exact UUID Target Package
```

That phase should record one exact UUID manually selected by James.

It should remain docs-only.

It should not query Supabase.

It should not run preflight.

It should not execute decisions.

## Implementation Boundary for Phase 22W

If Phase 22W proceeds, the allowed implementation scope should be:

```text
Create testing/discovery-candidate-decision-read-only-listing-gate.mjs only.
No API changes.
No UI changes.
No Supabase schema changes.
No migrations.
No generated types.
No candidate decision execution code.
No public publishing code.
No approve_for_draft code.
No cleanup code.
No live DB execution.
```

Phase 22W should be a source-file implementation phase, not a live execution phase.

## Recommended Phase 22W Verification

Recommended Phase 22W verification:

- `git status --short --branch`
- latest commit guard
- file existence check
- `node --check`
- static mutation token scan
- fail-locked missing opt-in test
- fail-locked invalid status test
- fail-locked invalid limit test
- fail-locked true lock flag tests
- fail-locked generic approval phrase test
- no live execution
- `npm run check`
- guard that only the script file changed

## Future Gemini Review Requirement

Gemini should review Phase 22W before commit.

Gemini should confirm:

1. Only the future listing script file changed.
2. The script is locked by default.
3. The script is read-only.
4. The script cannot auto-select a candidate.
5. The script has bounded limit validation.
6. The script has explicit status filtering.
7. The script does not include mutation-capable code.
8. Public publishing remains locked.
9. `approve_for_draft` remains locked.
10. Cleanup mutation remains locked.
11. No live DB execution occurred during implementation.
12. It is safe to commit the script implementation.

## Rollback / Abort Criteria

Future implementation must abort if:

- schema assumptions cannot be verified safely
- the script needs broad listing to be useful
- the script needs mutation-capable permissions
- the script cannot avoid printing prohibited fields
- the script cannot guarantee manual target selection
- tests require live DB access before approval
- repository state is dirty beyond expected files
- Gemini rejects the implementation

## Commit Readiness Criteria

Phase 22V is safe to commit only if Gemini confirms:

- this phase is documentation-only
- no script is implemented
- no source files changed
- no executable files changed
- no live DB read is authorized
- no DB mutation is authorized
- no candidate is selected
- no candidate UUID is recorded
- future implementation scope is narrow
- future verification is sufficient
- future live execution remains separate
- public publishing remains locked
- `approve_for_draft` remains locked
- cleanup remains locked

## Phase 22V Conclusion

Phase 22V plans the future read-only candidate listing gate script.

It does not implement the script.

It does not run the listing.

It does not query the live database.

It does not select a candidate.

It does not record a candidate UUID.

It does not run preflight.

It does not execute a decision.

The Discovery Engine remains fail-closed before any live candidate interaction.
