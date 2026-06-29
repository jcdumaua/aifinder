# Discovery Phase 14K-A — Controlled Reviewable Preview Artifact Preparation Gate

## Status

Draft preparation gate only.

This phase does not create a preview artifact, does not create a candidate, does not run a live smoke, does not run a browser staging action, does not run a database command, and does not perform any production mutation.

## Background

Phase 14J defined the controlled live staging smoke gate.

Phase 14K readiness inspection passed locally, but the read-only preview context selector found:

- `Reviewable v2 preview artifacts scanned: 0`;
- `Eligible preview contexts: 0`;
- no eligible preview context exists for the live smoke.

A follow-up read-only inventory diagnostic confirmed:

- `discovery_candidate_preview_artifacts` currently has zero rows;
- no live smoke was run;
- no mutation was performed.

A repository inspection confirmed:

- preview artifact schema, provider, route, docs, and tests exist;
- existing package scripts include candidate staging live/RLS smoke scripts;
- no existing approved script or package command currently creates one reviewable v2 preview artifact for Phase 14K.

Therefore, Phase 14K must pause before live smoke execution until a safe, bounded, approved preparation path can create exactly one trusted reviewable v2 preview artifact.

## Purpose

Phase 14K-A defines the safe preparation gate for creating one reviewable v2 candidate preview artifact that can later be used by the Phase 14J/14K controlled live staging smoke.

The target is not to stage a candidate.

The target is to prepare exactly one preview context that the existing provider, route, resolver, and admin UI can revalidate.

## Non-goals

Phase 14K-A does not authorize:

- running the live staging smoke;
- clicking the Admin UI `Stage candidate` action;
- POSTing to `/api/admin/discovery/candidate-extraction/invoke`;
- sending `dry_run: false`;
- creating candidate staging rows;
- writing to `public.tools`;
- writing to `discovered_tools`;
- publishing any tool;
- approving any candidate;
- bulk preview creation;
- crawler automation;
- LLM automation;
- schema changes;
- type generation;
- changing the provider, route, resolver, or UI implementation;
- running existing live staging smoke scripts.

## Required exact approval before preview artifact creation

A future preparation script must not create a preview artifact unless the user gives this exact approval phrase:

`Approve run Phase 14K-A controlled preview artifact preparation`

Any other wording, including `approved`, `approved, proceed`, or `next step`, authorizes planning, inspection, and Gemini review only.

## Required exact approval before live smoke

Even after a reviewable preview artifact exists, the live staging smoke must still not run unless the user gives this exact approval phrase from Phase 14J:

`Approve run Phase 14J controlled live staging smoke`

The preview artifact preparation approval and the live smoke approval are separate gates.

## Preparation principle

The future preparation must prove only this:

> One trusted, sanitized, server-derived reviewable v2 preview artifact exists for one exact discovery source, one exact discovery run, and one audit correlation ID.

It must not prove staging, publishing, ranking, approval, discovery automation, or public catalog visibility.

## Preferred approach

Use a dedicated, opt-in terminal script for one controlled preview artifact preparation.

The script should:

1. Require an explicit opt-in environment variable.
2. Require exact user approval before execution.
3. Use the Supabase service role only inside the local operator terminal.
4. Read one existing safe discovery source and run if available, or create a narrowly marked preparation source/run only if explicitly approved by the same gate.
5. Insert exactly one row into `public.discovery_candidate_preview_artifacts`.
6. Use `preview_schema_version = 'candidate_preview_artifact.v2'`.
7. Use `preview_status = 'reviewable'`.
8. Include a safe HTTPS `source_url_snapshot`.
9. Include a safe HTTPS `candidate_website_url`.
10. Ensure `source_url_snapshot` and `candidate_website_url` are different.
11. Include `source_url_snapshot_validated` in `safety_flags`.
12. Use a unique `audit_correlation_id`.
13. Avoid any public `tools` or `discovered_tools` writes.
14. Avoid creating any `discovery_candidate_tools` rows.
15. Print the selected IDs and preview artifact ID.
16. Rerun the read-only selector after creation.

## Preferred test fixture values

The future preview artifact should use a clearly marked smoke/preparation fixture, not a real public recommendation.

Suggested values:

- candidate name: `Phase 14K Controlled Preview Artifact Smoke Tool`
- candidate website URL: `https://example.com/phase-14k-controlled-preview-tool`
- source URL snapshot: `https://example.com/phase-14k-controlled-preview-source`
- evidence summary: `Controlled Phase 14K-A preview artifact fixture for live staging smoke readiness only.`
- source evidence locator: `manual:phase-14k-a-controlled-preview-artifact-preparation`
- category hint: `Productivity`
- pricing hint: `unknown`
- confidence bucket: `medium`
- safety flags:
  - `source_url_snapshot_validated`

The exact allowed category/pricing/confidence values must be verified against the current table constraints before any insert.

## Source and run strategy

Preferred option:

1. Reuse one existing manual/controlled discovery source and one existing completed run only if:
   - the source URL is public HTTPS;
   - the run belongs to the source;
   - the run is not stale or ambiguous;
   - using it will not confuse production history.

Fallback option:

2. Create one clearly marked preparation source/run pair only if the future preparation approval explicitly authorizes those narrow writes.

The fallback must still avoid public `tools`, `discovered_tools`, and candidate staging writes.

## Data constraints to verify before creation

Before creating the preview artifact, the future script must inspect current constraints and types for:

- `preview_schema_version`;
- `preview_status`;
- `category_hint`;
- `pricing_hint`;
- `confidence_bucket`;
- `evidence_summary` length;
- `source_evidence_locator` length;
- `source_url_snapshot` length and HTTPS rule;
- `safety_flags` allowlist;
- reviewable required fields;
- unique reviewable run/source index.

## Future write plan

The future preparation script may perform only these writes, and only after exact approval:

- optionally one controlled `discovery_sources` row if no safe existing source is available;
- optionally one controlled `discovery_runs` row tied to the controlled source if no safe existing run is available;
- exactly one `discovery_candidate_preview_artifacts` row.

The future preparation script must not perform these writes:

- `public.tools`;
- `discovered_tools`;
- `discovery_candidate_tools`;
- public publishing tables;
- approval records;
- bulk rows;
- unrelated audit rows unless a later gate explicitly approves audit event insertion.

## Idempotency requirements

The future preparation script must be idempotent enough to avoid duplicates:

- use a unique marker such as `phase-14k-a-controlled-preview-artifact`;
- search for existing preparation artifacts before creating a new one;
- stop if more than one matching artifact exists;
- stop if a reviewable artifact already exists for the selected run/source;
- print whether it reused or created the preparation context.

## Post-preparation verification

After the preview artifact is created, the script must run the read-only selector and verify:

- exactly one eligible preview context exists for the chosen run/source;
- the artifact is v2;
- the artifact is reviewable;
- the artifact has `source_url_snapshot`;
- source URL snapshot is safe HTTPS;
- candidate website URL is safe HTTPS;
- source and candidate URLs differ;
- `audit_correlation_id` is present;
- no staged candidate exists for that audit correlation ID.

## Abort conditions

Abort before any write if:

- working tree is dirty;
- environment variables are missing;
- exact approval phrase has not been provided;
- table constraints cannot be inspected;
- safe source/run cannot be selected or created under the approved scope;
- source URL is unsafe;
- candidate website URL is unsafe;
- source and candidate URLs are identical;
- allowed enum/check values are uncertain;
- a staged candidate already exists for the selected audit correlation ID;
- more than one reviewable artifact exists for the selected run/source;
- any public/discovered/candidate staging write would be required.

## Gemini review questions

Gemini should review:

1. Whether a dedicated opt-in preview artifact preparation phase is the correct next step before Phase 14K live smoke.
2. Whether the exact approval phrase is strong enough.
3. Whether source/run fallback creation is acceptable if clearly marked and bounded.
4. Whether the future write scope is properly limited.
5. Whether the fixture values are safe.
6. Whether the idempotency requirements are sufficient.
7. Whether post-preparation verification is complete.
8. Whether this gate is safe to commit before implementing the preparation script.

## Acceptance criteria

Phase 14K-A gate is complete when:

- this gate document is committed and pushed;
- no preview artifact has been created in this phase;
- no live smoke has been run;
- no candidate has been staged;
- no database command has been run from this gate script;
- no source code has changed;
- no UI code has changed;
- no route code has changed;
- no schema migration has been added;
- `npm run check` passes;
- Gemini approves the preparation gate.

## Recommended next phase after this gate

If Gemini approves this gate, the next phase should be:

Phase 14K-B — Controlled Reviewable Preview Artifact Preparation Script

Phase 14K-B should implement the opt-in preparation script, get Gemini review, and require the exact approval phrase before creating the preview artifact.
