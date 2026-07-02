# Discovery Phase 19R — Candidate Decision RPC Type Generation Gate

## Status

Phase 19R generated Supabase TypeScript types after the Candidate Decision Mutation RPC was applied and verified in Phase 19Q.

Baseline commit:

```text
a752aa2 Document candidate decision RPC apply result
```

Generated types file:

```text
lib/supabase/database.types.ts
```

Target RPC now represented in generated types:

```text
public.admin_apply_discovery_candidate_decision
```

Migration already applied in Phase 19Q:

```text
20260702190000
```

## Execution Note

The initial Phase 19R script generated the types successfully, then stopped at an overly strict assertion that expected the exact text `number | null`.

The continuation did not rerun type generation.

The continuation inspected the already-regenerated `database.types.ts` and verified the RPC generated type block using marker-based checks that allow Supabase CLI bigint/default argument formatting.

## Generated RPC Shape Summary

| Generated RPC shape check | Result |
| --- | --- |
| `rpc_block_extracted` | yes |
| `args_present` | yes |
| `returns_present` | yes |
| `duplicate_of_tool_id_scalar_marker_present` | yes |
| `contains_number_marker` | yes |
| `contains_string_marker` | yes |
| `contains_bigint_marker` | no |

## Verification Performed

Phase 19R verified:

- repository was on `main`
- local `main` matched `origin/main`
- baseline commit was Phase 19Q
- changed-file scope after the first typegen pass contained only generated types before writing this result document
- generated types include `public.Functions.admin_apply_discovery_candidate_decision`
- generated RPC types include all expected argument fields
- generated RPC types include all expected return fields
- generated RPC type block contains an accepted scalar marker for `duplicate_of_tool_id`
- generated RPC type block does not contain publish workflow markers
- `npm run check` passed after type generation
- `git diff --check` passed after type generation
- changed-file scope was limited to generated types and this result document

## Expected RPC Argument Markers

```text
p_candidate_id
p_action
p_reason
p_notes
p_duplicate_of_candidate_id
p_duplicate_of_tool_id
p_actor_label
p_request_correlation_id
```

## Expected RPC Return Markers

```text
id
candidate_status
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
```

## Preserved Boundaries

Phase 19R did not:

- rerun type generation during the continuation
- run `supabase db push`
- run schema apply
- run migration apply
- run database reset
- run database pull
- run live mutation smoke
- run API smoke
- mutate candidate rows
- mutate audit rows
- write to public tools
- write to discovered tools
- implement helper code
- implement API routes
- implement UI components
- create decision buttons
- commit
- push

Approve for draft remains not publish.

Public tools write remains forbidden until a separate publish workflow phase is approved.

## Recommended Next Phase

Recommended next phase after Gemini review, commit, and push:

```text
Phase 19S — Candidate Decision Mutation RPC Helper/API Implementation Plan Patch
```

Alternative if Gemini accepts the existing RPC-backed plan as sufficient for implementation:

```text
Phase 19S — Candidate Decision Mutation API Implementation
```

## Gemini Review Questions

Gemini should review:

```text
Did Phase 19R correctly regenerate Supabase TypeScript types after the applied RPC?
Does lib/supabase/database.types.ts now include public.admin_apply_discovery_candidate_decision?
Are the generated Args and Returns shapes present?
Is the relaxed duplicate_of_tool_id scalar assertion acceptable given Supabase CLI bigint/default formatting?
Is it acceptable that Phase 19R changed only generated types plus this result doc?
Should Phase 19R be committed?
Should the next phase be a helper/API implementation plan patch, or implementation directly?
```

## Conclusion

Phase 19R completed the type generation gate for the applied Candidate Decision Mutation RPC.
