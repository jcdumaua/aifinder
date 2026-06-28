# Phase 13C — Candidate Preview Artifact Schema Design Gate

## 1. Status

Phase 13C is a docs-only schema design gate.

This phase does not draft a migration.

This phase does not apply a migration.

This phase does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, or CSRF fetches.

This phase does not implement a candidate preview provider.

This phase does not create a route.

This phase does not modify UI components, API routes, helpers, tests, package files, migrations, or generated types.

This phase does not create, update, or delete discovery sources, discovery runs, candidate rows, preview rows, audit rows, public tools, or discovered tools.

Phase 13C designs the future schema for a dedicated candidate preview artifact table.

## 2. Current Confirmed State

Latest pushed commit before Phase 13C:

ca7ebb7 Document candidate preview provider implementation plan

Current design state:

- Phase 13A selected a server-derived, read-only preview artifact strategy;
- Phase 13B defined a future dependency-injected provider contract;
- no preview artifact table exists yet;
- no preview provider exists yet;
- no preview route exists yet;
- no UI preview wiring exists yet;
- the live staging scaffold remains disabled;
- production live staging remains fail-closed.

Existing relevant tables:

- public.discovery_sources;
- public.discovery_runs;
- public.discovery_audit_events;
- public.discovery_candidate_tools.

The candidate preview artifact table is intended to be a pre-staging preview source, not a staging destination.

## 3. Relationship To Prior Phases

Phase 13A recommended a dedicated preview artifact as the long-term source provider target.

Phase 13B defined the future provider contract around that artifact.

Phase 13C now designs the table shape, constraints, indexes, RLS posture, retention policy, and migration prerequisites.

Phase 13C does not create SQL.

Phase 13C does not draft SQL.

Phase 13C does not authorize DB apply.

## 4. Design Goal

The future table should store one sanitized, server-derived preview artifact for one candidate tied to one exact discovery run and one exact discovery source.

The table should support:

- read-only admin preview;
- future provider lookup;
- exact run/source validation;
- preview freshness checks;
- preview status checks;
- safety flag checks;
- audit correlation;
- future UI display;
- future live staging readiness checks.

The table must not become:

- a public catalog table;
- a discovered_tools replacement;
- a live staging queue by itself;
- a raw evidence store;
- a raw LLM output store;
- a browser-submitted candidate payload store.

## 5. Proposed Table Name

Recommended future table:

public.discovery_candidate_preview_artifacts

Rationale:

- clear ownership under Discovery Engine;
- explicitly candidate-preview scoped;
- distinct from public.discovery_candidate_tools;
- distinct from public.discovered_tools;
- distinct from public.tools;
- describes an artifact, not a mutation action;
- supports future read-only provider contract.

## 6. Proposed Column Set

Recommended future columns:

- id;
- discovery_source_id;
- discovery_run_id;
- audit_correlation_id;
- preview_schema_version;
- preview_status;
- candidate_name;
- candidate_website_url;
- category_hint;
- pricing_hint;
- confidence_bucket;
- evidence_summary;
- source_evidence_locator;
- safety_flags;
- preview_generated_at;
- created_at;
- updated_at.

Optional later columns, not required for the first migration draft:

- blocked_reason_code;
- artifact_origin;
- expires_at;
- reviewed_by_admin_user_id;
- reviewed_at.

The first schema should stay minimal unless Gemini approves expanded fields.

## 7. Recommended Column Semantics

id:

- primary key;
- generated UUID;
- not supplied by client.

discovery_source_id:

- required;
- references public.discovery_sources(id);
- should use on delete restrict or cascade only after review;
- recommended initial posture: restrict to avoid deleting source history accidentally.

discovery_run_id:

- required;
- references public.discovery_runs(id);
- should use on delete cascade only if run lifecycle explicitly owns preview artifacts;
- recommended initial posture: cascade may be acceptable because preview has no meaning without the run, but this must be reviewed in the migration draft.

audit_correlation_id:

- required or nullable depending on final audit policy;
- recommended: not null if artifact is produced by an approved extraction/review process;
- bounded text;
- should not contain raw client body or secrets.

preview_schema_version:

- required;
- bounded text;
- example future value: candidate_preview_artifact.v1;
- used by provider freshness and compatibility checks.

preview_status:

- required;
- constrained to approved values;
- allowed values:
  - unavailable;
  - pending_review;
  - reviewable;
  - blocked;
  - stale.

candidate_name:

- nullable text;
- required for reviewable status;
- bounded length.

candidate_website_url:

- nullable text;
- required for reviewable status;
- bounded length;
- must be validated by provider logic;
- optional database check may reject obviously unsafe schemes.

category_hint:

- nullable text;
- bounded length;
- display hint only.

pricing_hint:

- nullable text;
- bounded length;
- display hint only.

confidence_bucket:

- nullable text;
- bounded length;
- display hint only;
- recommended allowed values for future consideration:
  - low;
  - medium;
  - high;
  - review;
  - blocked.

evidence_summary:

- nullable text;
- bounded length;
- sanitized summary only;
- never raw evidence.

source_evidence_locator:

- nullable text;
- required for reviewable status;
- references where safe evidence came from, not the raw evidence itself;
- must not contain raw HTML or payloads.

safety_flags:

- text array or jsonb array;
- recommended initial option: text[] with length and value checks if feasible;
- must not contain raw payloads, secrets, or stack traces.

preview_generated_at:

- timestamp with time zone;
- required for freshness checks;
- required for reviewable status.

created_at:

- timestamp with time zone;
- default now.

updated_at:

- timestamp with time zone;
- default now;
- should use an updated_at trigger if table supports updates.

## 8. Proposed Constraints

A future migration should consider these constraints:

- primary key on id;
- foreign key discovery_source_id to public.discovery_sources(id);
- foreign key discovery_run_id to public.discovery_runs(id);
- check preview_schema_version is non-empty and bounded;
- check preview_status is one of approved values;
- check candidate_name length is bounded;
- check candidate_website_url length is bounded;
- check category_hint length is bounded;
- check pricing_hint length is bounded;
- check confidence_bucket length is bounded;
- check evidence_summary length is bounded;
- check source_evidence_locator length is bounded;
- check audit_correlation_id length is bounded;
- check reviewable previews have candidate_name;
- check reviewable previews have candidate_website_url;
- check reviewable previews have source_evidence_locator;
- check reviewable previews have preview_generated_at.

The database should not be the only sanitizer.

Provider-level sanitization remains required.

## 9. Unique Constraint Strategy

Recommended first unique constraint:

- unique active reviewable artifact per discovery_run_id and discovery_source_id.

Possible shape:

- unique partial index on discovery_run_id and discovery_source_id where preview_status = 'reviewable'.

Rationale:

- prevents ambiguity for the first single-candidate provider;
- supports Phase 13B multi-candidate fail-closed behavior;
- avoids accidental multiple reviewable previews for one run/source.

If multiple non-reviewable historical artifacts must exist later, that should be designed separately.

Alternative stricter option:

- unique discovery_run_id and discovery_source_id across all statuses.

This is simpler but may make future status history harder.

Recommended decision:

Use a partial unique index for reviewable artifacts only, unless Gemini recommends stricter uniqueness.

## 10. Recommended Indexes

Future migration should consider:

- index on discovery_run_id;
- index on discovery_source_id;
- index on discovery_run_id and discovery_source_id;
- index on preview_status;
- index on preview_schema_version;
- index on audit_correlation_id;
- index on created_at descending;
- partial unique index on reviewable run/source pair.

Rationale:

- provider lookup needs run/source;
- admin review may filter by status;
- audit correlation lookup may be useful later;
- created_at supports maintenance and retention.

## 11. RLS And Grants Design

Recommended security posture:

- enable row level security;
- revoke all from anon and authenticated;
- create deny-all policies for anon/authenticated;
- no public read policy;
- no public write policy;
- admin server access should use service-role server code only;
- browser must never create Supabase client access to this table.

This should match the existing Discovery Engine hardening style used for discovery tables.

The first migration draft should not add broad authenticated policies.

If admin-specific RLS is later desired, it must be designed separately.

## 12. Insert And Update Boundary

Preview artifacts should be created only by approved server-side workflows.

The Admin UI must not insert preview artifacts.

The Admin UI must not update preview artifacts.

The candidate preview GET route must not insert or update preview artifacts.

The live staging route must not create preview artifacts unless a later phase explicitly approves that workflow.

Recommended write boundary:

- preview artifact creation belongs to a future extraction/review artifact creation phase;
- provider phase remains read-only;
- UI wiring phase remains read-only.

## 13. Retention Policy

Recommended first retention policy:

- retain preview artifacts long enough for admin review;
- avoid storing raw evidence, so security risk is lower than raw HTML storage;
- still treat previews as pre-public sensitive data;
- define expiry policy before high-volume automation.

Possible future retention rule:

- keep reviewable/blocked/stale artifacts for 30 to 90 days;
- or keep the latest artifact per run/source and archive older artifacts.

Phase 13C does not decide final retention length.

Phase 13D migration draft should document whether retention is enforced by schema, scheduled cleanup, or manual maintenance.

## 14. Stale Artifact Policy

A future provider should mark or treat artifact as stale if:

- preview_schema_version is unsupported;
- discovery_run_id mismatch exists;
- discovery_source_id mismatch exists;
- preview_generated_at is missing;
- source_evidence_locator is missing for reviewable status;
- candidate_name is missing for reviewable status;
- candidate_website_url is missing for reviewable status;
- run updated_at is newer than preview_generated_at and the provider chooses strict freshness;
- safety_flags contain blocking values;
- preview_status is stale or blocked.

The schema may support stale status, but the provider must enforce freshness.

The first migration should not rely on database constraints alone.

## 15. Safety Flags

Recommended safety_flags behavior:

- store only safe short tokens;
- no raw payloads;
- no HTML;
- no stack traces;
- no secrets;
- no CSRF tokens;
- no cookies;
- no service-role details;
- no SQL errors.

Example safe flags:

- bounded_preview;
- server_sanitized;
- source_run_matched;
- no_public_write;
- no_discovered_write;
- no_raw_html;
- no_llm_output;
- unsafe_url_blocked;
- stale_schema_blocked;
- ambiguous_preview_blocked.

A later provider implementation should allowlist or validate flags.

## 16. Relationship To discovery_candidate_tools

public.discovery_candidate_preview_artifacts is a preview source.

public.discovery_candidate_tools is a staging destination.

The preview artifact must not imply a candidate has been staged.

The preview artifact must not include candidate_status.

The preview artifact must not replace staging review.

The preview artifact must not publish to public.tools.

A future live staging route must re-resolve trusted candidate input server-side and not trust client-returned preview fields.

## 17. Relationship To discovery_runs.stats

discovery_runs.stats should not become the long-term preview contract.

Stats may remain operational metadata.

If stats are used as an internal source for generating preview artifacts later, that transformation must be server-side and sanitized.

The Admin UI must not derive preview artifacts directly from broad stats payloads.

## 18. Relationship To discovery_audit_events

Phase 13C does not alter discovery_audit_events.

The preview table may include audit_correlation_id for traceability.

Direct preview-artifact audit linkage remains optional and should be designed later.

Future audit writes must avoid:

- raw payloads;
- raw HTML;
- secrets;
- CSRF tokens;
- service-role details;
- stack traces;
- unredacted client bodies.

## 19. Future Migration Draft Requirements

A future Phase 13D migration draft should include:

- create table public.discovery_candidate_preview_artifacts;
- primary key;
- foreign keys;
- status check constraint;
- bounded text constraints;
- reviewable-field constraints;
- indexes;
- partial unique index decision;
- updated_at trigger if needed;
- RLS enablement;
- revoke grants from anon/authenticated;
- deny-all policy;
- comments on table and key columns.

Phase 13D must be migration draft only.

Phase 13D must not run db push.

Phase 13D must not apply remote SQL.

Phase 13D must not regenerate types unless separately approved after apply.

## 20. Future Verification Requirements

A future migration draft should be verified with:

- git diff --check;
- npm run check;
- migration file inspection;
- no db push;
- no remote SQL apply;
- no type generation;
- no live staging;
- no POST;
- no CSRF fetch.

A future apply/type-generation phase must be separate and require explicit approval.

## 21. Stop Conditions

Future schema or migration work must stop if it requires:

- applying a migration;
- running db push;
- running remote SQL;
- regenerating types;
- adding public read access;
- adding authenticated broad access;
- storing raw HTML;
- storing raw LLM output;
- storing raw payloads;
- storing secrets;
- storing CSRF tokens;
- writing public.tools;
- writing discovered_tools;
- staging candidates;
- publishing candidates;
- route implementation;
- provider implementation;
- UI implementation;
- crawler execution;
- LLM execution.

## 22. Recommended Next Phase

Recommended next phase:

Phase 13D — Candidate Preview Artifact Migration Draft

Scope:

- migration draft only;
- no db push;
- no remote SQL apply;
- no type generation;
- no provider implementation;
- no route implementation;
- no UI wiring;
- no live staging.

## 23. Phase 13C Verification Plan

After this document is created, run:

- git diff --check;
- npm run check;
- git diff --stat;
- git diff --name-only;
- git status --short --branch.

Expected changed file:

- docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md

Expected forbidden changes:

- no migration files;
- no UI component changes;
- no API route changes;
- no helper changes;
- no test changes;
- no package changes;
- no generated type changes.

## 24. Commit Readiness Criteria

Phase 13C is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only the Phase 13C docs file is staged;
- no migration is drafted;
- no code files are changed;
- no live commands were run;
- no DB commands were run;
- no POST requests were sent;
- no CSRF fetch occurred;
- no dry_run false activation occurred.
