# Phase 13A — Candidate Extraction Admin UI Source Provider Design

## 1. Status

Phase 13A is a docs-only design phase.

This phase does not implement a candidate preview provider.

This phase does not modify UI components, API routes, helpers, tests, package files, migrations, or generated types.

This phase does not run live staging, live smoke, database commands, remote SQL, Supabase commands, or POST requests.

This phase does not fetch CSRF.

This phase does not enable dry_run: false.

This phase does not create, update, or delete discovery sources, discovery runs, candidate rows, audit rows, public tools, or discovered tools.

Phase 13A designs the trusted source-provider path that may eventually feed the inert Phase 12F Admin UI live staging scaffold.

## 2. Current Confirmed State

Latest pushed commit before Phase 13A:

f84010c Add disabled live staging scaffold

Current Admin UI state:

- the dry-run panel remains active and dry-run-only;
- the disabled live staging scaffold exists;
- the scaffold is rendered near the dry-run panel in the expanded Discovery Runs review area;
- the scaffold is wired with candidatePreview={null};
- the scaffold is wired with isLiveStagingAvailable={false};
- the scaffold shows exact run/source context;
- the scaffold shows max candidates: 1;
- the scaffold shows source scope: single_run;
- the scaffold shows live staging unavailable;
- the scaffold performs no POST requests;
- the scaffold performs no CSRF fetch;
- the scaffold has no production dry_run: false request builder;
- the scaffold has no public.tools write path;
- the scaffold has no discovered_tools write path;
- the scaffold has no audit_events write path;
- the scaffold has no Supabase client creation.

Current backend state:

- POST /api/admin/discovery/candidate-extraction/invoke exists;
- production POST remains fail-closed for dry_run: false;
- production POST passes no live gate dependency by default;
- helper supports manual_api_single_candidate_staging mode only through server-created gate metadata;
- helper requires max_candidates: 1;
- helper requires source_scope: single_run;
- helper remains dependency-injected;
- helper does not import Supabase clients directly;
- helper does not read environment variables directly.

## 3. Relationship To Prior Phases

Phase 12A designed the API/Admin UI live staging enablement gate.

Phase 12B planned the guarded backend live-staging foundation.

Phase 12C implemented the guarded backend foundation while keeping production fail-closed.

Phase 12D designed the high-friction Admin UI live-staging flow.

Phase 12E planned the disabled scaffold implementation.

Phase 12F implemented the inert disabled scaffold.

Phase 13A now designs where the scaffold's future trusted candidate preview and candidate input should come from.

## 4. Core Design Problem

The Phase 12F scaffold cannot become actionable until it receives a trusted candidate preview.

A trusted candidate preview must not be supplied by the client.

A trusted candidate preview must not be guessed from unbounded run stats.

A trusted candidate preview must not be created from raw HTML in the browser.

A trusted candidate preview must not be created from raw LLM output in the browser.

A trusted candidate preview must not be equivalent to live staging input unless the server separately validates it.

The core problem is:

How can the Admin UI safely display one reviewed candidate preview tied to one exact discovery run and source without creating a new mutation path or bypassing the server-side live gate?

## 5. Design Goals

The source provider design must:

- keep the UI zero-trust;
- keep candidate preview server-derived;
- keep preview read-only;
- keep preview bounded;
- keep preview sanitized;
- tie preview to one exact discovery_source_id;
- tie preview to one exact discovery_run_id;
- preserve max_candidates: 1;
- preserve source_scope: single_run;
- avoid public.tools writes;
- avoid discovered_tools writes;
- avoid public publishing;
- avoid live staging;
- avoid crawler execution;
- avoid LLM execution;
- avoid DB mutations in the provider read path;
- avoid exposing raw evidence or raw payloads.

## 6. Non-Goals

Phase 13A does not design or authorize:

- live staging activation;
- dry_run: false activation;
- public.tools insertion;
- discovered_tools insertion;
- public publishing;
- candidate approval/rejection queue;
- bulk candidate staging;
- source-wide staging;
- run-wide staging;
- crawler-triggered staging;
- LLM-triggered staging;
- background worker staging;
- DB schema changes;
- audit schema changes;
- storage changes;
- migrations;
- type regeneration;
- route implementation;
- UI implementation;
- tests implementation.

## 7. Candidate Preview Definition

A candidate preview is a sanitized, read-only summary that helps an admin decide whether a single candidate may later be staged.

Recommended preview shape:

- candidate_name;
- candidate_website_url;
- category_hint;
- pricing_hint;
- confidence_bucket;
- evidence_summary;
- source_evidence_locator;
- discovery_source_id;
- discovery_run_id;
- audit_correlation_id;
- preview_status;
- preview_generated_at;
- preview_schema_version.

Allowed preview_status values:

- unavailable;
- pending_review;
- reviewable;
- blocked;
- stale;

The UI may display a preview only when preview_status is reviewable.

Any non-reviewable status must keep live staging disabled.

## 8. Forbidden Preview Fields

The preview must never include:

- raw HTML;
- raw extracted page text;
- raw markdown scrape;
- raw LLM prompt;
- raw LLM output;
- cookies;
- credentials;
- API keys;
- CSRF tokens;
- service-role details;
- stack traces;
- SQL errors;
- database row dumps;
- full normalized candidate payload;
- arbitrary JSON payloads;
- crawler request/response bodies;
- unbounded evidence payloads;
- embedding vectors;
- token usage details unless summarized safely;
- personal data unrelated to the candidate;
- admin session data.

## 9. Recommended Source Provider Strategy

Recommended strategy:

Server-side read-only candidate preview provider backed by a trusted persisted review artifact.

Recommended future artifact name:

Candidate Extraction Preview Artifact

Recommended future artifact characteristics:

- created only by a separately approved dry-run or extraction review phase;
- persisted server-side;
- tied to one discovery_run_id;
- tied to one discovery_source_id;
- tied to one audit_correlation_id;
- stores only sanitized preview fields;
- stores no raw HTML;
- stores no raw LLM output;
- stores no service-role details;
- stores no secrets;
- stores no full normalized candidate payload;
- can be read by admin-only server code;
- can be rendered by Admin UI as preview only;
- cannot stage by itself;
- cannot publish by itself.

This design intentionally avoids deriving preview directly in the browser.

## 10. Rejected Source Provider Options

### Option A — Client-supplied candidate preview

Rejected.

Reason:

- client cannot be trusted;
- preview could be forged;
- admin identity could be spoofed;
- candidate payload could include hidden raw data;
- client could attempt to bypass provider validation.

### Option B — Read raw run stats directly in UI

Rejected for live-staging readiness.

Reason:

- run stats can contain broad operational data;
- current stats are not designed as candidate preview contracts;
- stats may be stale, incomplete, or mixed with non-candidate metadata;
- using stats directly risks accidental display of unsafe fields.

Run stats may remain useful as an internal server input only after a safe normalizer is designed.

### Option C — Browser parses raw HTML or evidence

Rejected.

Reason:

- raw HTML is explicitly forbidden in UI preview;
- browser-side parsing increases XSS and payload leakage risk;
- evidence processing belongs server-side.

### Option D — UI calls LLM for preview generation

Rejected.

Reason:

- UI must not trigger LLM analysis;
- introduces cost, latency, and prompt/payload exposure;
- violates current crawler/LLM automation boundary.

### Option E — Preview from public.tools or discovered_tools

Rejected for candidate staging.

Reason:

- the target flow is pre-public staging;
- public.tools and discovered_tools are explicitly non-targets for this phase;
- using them would confuse staging with publishing or legacy discovery records.

## 11. Preferred Future Read Path

A future implementation may introduce a read-only admin provider such as:

getCandidateExtractionPreviewForRun(...)

Recommended inputs:

- discoveryRunId;
- discoverySourceId;
- requestingAdminActorId;
- expectedSchemaVersion;

Recommended output:

- accepted: boolean;
- rejected: boolean;
- rejection_code;
- preview: CandidateExtractionLiveStagingPreview | null;
- preview_status;
- safety_flags;
- audit_correlation_id;
- no_public_write_confirmed;
- no_discovered_write_confirmed;

Recommended behavior:

- authenticate admin before read;
- verify exact run/source match;
- reject missing source;
- reject missing run;
- reject stale preview;
- reject preview with unsafe fields;
- reject preview not tied to the requested run/source;
- return sanitized preview only;
- perform no writes;
- perform no staging;
- perform no publishing.

## 12. Possible Future API Route

A future read-only route may be considered:

GET /api/admin/discovery/runs/[id]/candidate-preview

This route is not implemented in Phase 13A.

If implemented later, it must:

- require admin session;
- use same-origin credentials;
- use no-store response headers;
- use nosniff response headers;
- verify discovery_run_id from path;
- verify discovery_source_id from query or server-loaded run;
- return only sanitized preview fields;
- return unavailable status when no trusted preview exists;
- avoid POST;
- avoid CSRF requirement if kept as safe read-only GET;
- avoid DB mutations;
- avoid live staging;
- avoid public.tools writes;
- avoid discovered_tools writes;
- avoid audit writes unless a separate read-audit design is approved.

If a later design decides read-audit events are required, that must be separated from the first read-only provider implementation.

## 13. Candidate Input vs Candidate Preview Boundary

Candidate preview and candidate input are related but not identical.

The preview is for admin review.

The staging input is for server-side staging execution.

The UI must never convert preview into staging input.

A future live staging route must not trust preview fields sent back by the client.

When live staging is eventually enabled, the server must re-resolve the candidate input from the trusted source provider or artifact.

The client may send only bounded intent fields approved by a later phase, such as:

- discovery_source_id;
- discovery_run_id;
- audit_correlation_id;
- invocation_reason;
- max_candidates: 1;
- source_scope: single_run;
- schema_version;

The client must not send candidate payload fields as staging input.

## 14. Artifact Freshness Rules

A future preview artifact should be considered stale if:

- discovery_run_id does not match;
- discovery_source_id does not match;
- schema_version is unsupported;
- preview_generated_at is missing;
- source evidence locator is missing;
- candidate website URL is missing or invalid;
- candidate name is missing;
- preview references raw evidence that is unavailable;
- preview was generated before a run failure or run replacement;
- preview status is not reviewable;
- safety flags include blocking issues.

Stale previews must keep the scaffold disabled.

## 15. Preview Sanitization Rules

A future provider must sanitize:

- candidate name length;
- website URL length;
- website URL protocol;
- category hint;
- pricing hint;
- confidence bucket;
- evidence summary length;
- evidence locator format;
- audit correlation ID format;
- timestamps.

The provider must reject or null out values containing:

- angle brackets;
- script-like values;
- raw payload markers;
- HTML markers;
- secret-like markers;
- token-like markers;
- password markers;
- service-role markers;
- stack trace markers;
- credential markers;
- cookie markers;
- CSRF markers;
- Supabase secret markers.

The existing Phase 12F UI normalizer may remain a second line of defense, but the primary sanitization should occur server-side.

## 16. Preview Eligibility Rules

A future preview should become reviewable only if:

- exactly one candidate is selected;
- candidate name is present;
- candidate website URL is present;
- candidate URL passes safety checks;
- source/run context is exact;
- source_scope is single_run;
- max_candidates is 1;
- no public write occurred;
- no discovered write occurred;
- no live staging occurred;
- no raw payload is included;
- no blocking safety flag exists.

If multiple candidates are available, the provider must either:

- select none and return blocked;
- or require a separate candidate-selection design phase.

The first source provider should avoid multi-candidate selection.

## 17. Audit And Traceability Design

The preview should include an audit_correlation_id.

The audit_correlation_id should allow future admins to connect:

- source;
- run;
- dry-run/review event;
- preview artifact;
- later staging request, if approved.

Known limitation:

Direct candidate-audit linkage remains TBD.

Phase 13A does not authorize audit writes.

Future audit design must avoid:

- raw payloads;
- raw HTML;
- secrets;
- CSRF tokens;
- service-role details;
- stack traces;
- unredacted client body.

## 18. Storage Design Options

### Option 1 — Existing discovery_runs.stats preview section

Possible, but not recommended as the long-term source unless a strict schema and sanitizer are added.

Pros:

- no migration;
- already tied to discovery_run_id;
- easy to read in the current runs API.

Cons:

- stats are broad operational data;
- preview contract could become mixed with unrelated run metadata;
- stale preview detection may be weaker;
- harder to enforce field-level boundaries.

### Option 2 — Dedicated preview artifact table

Recommended long-term, but requires future migration design.

Possible table concept:

public.discovery_candidate_preview_artifacts

Possible fields:

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
- created_at;
- updated_at;

Pros:

- clean contract;
- easier RLS and admin-only read rules;
- easier stale detection;
- avoids mixing preview data with run stats;
- supports future review queue.

Cons:

- requires migration;
- requires RLS design;
- requires service/admin read design;
- requires separate implementation and verification.

### Option 3 — Existing public.discovery_candidate_tools table

Not recommended for preview source.

Reason:

- it is a staging destination, not a preview source;
- using it would imply candidate already staged;
- it does not solve pre-staging preview.

Recommended decision:

Use Option 2 as the long-term design target, but do not implement it yet.

For the immediate next phase, create a docs-only implementation plan for a read-only provider contract before any migration.

## 19. Recommended Future Phase Sequence

Recommended next phases:

1. Phase 13B — Candidate Preview Provider Implementation Plan
   - docs-only;
   - defines exact provider function signatures;
   - defines exact API route contract if needed;
   - defines whether a migration is required later;
   - still no code changes.

2. Phase 13C — Candidate Preview Artifact Schema Design Gate
   - docs-only if a dedicated table is selected;
   - designs table, RLS, retention, and audit boundaries;
   - no migration apply.

3. Phase 13D — Candidate Preview Artifact Migration Draft
   - migration draft only;
   - no db push;
   - no remote SQL apply.

4. Phase 13E — Read-Only Preview Provider Implementation
   - server read path only;
   - returns unavailable unless trusted artifact exists;
   - no staging writes.

5. Later phase — Scaffold Wiring To Read-Only Provider
   - GET-only UI/provider wiring;
   - still no live staging.

6. Later phase — Live Staging Activation Gate
   - only after preview/provider/audit path is verified;
   - exact live approval phrase required.

## 20. Stop Conditions

Future implementation must stop if it requires:

- live staging;
- dry_run: false activation;
- POST request from scaffold;
- CSRF fetch from scaffold before enabled-flow design;
- raw candidate payload from client;
- raw HTML exposure;
- raw LLM output exposure;
- public.tools write;
- discovered_tools write;
- audit write without approved audit design;
- Supabase client creation in UI;
- route live gate activation;
- crawler execution;
- LLM execution;
- migration apply without approval;
- DB push without approval;
- type regeneration without approval;
- batch candidate selection;
- source-wide staging;
- run-wide staging;
- public publishing.

## 21. Phase 13A Verification Plan

After this document is created, run:

- git diff --check
- npm run check
- git diff --stat
- git diff --name-only
- git status --short --branch

Expected changed file:

- docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md

Expected forbidden changes:

- no UI component changes;
- no API route changes;
- no helper changes;
- no test changes;
- no package changes;
- no migration changes;
- no generated type changes.

## 22. Commit Readiness Criteria

Phase 13A is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only the Phase 13A docs file is staged;
- no code files are changed;
- no live commands were run;
- no DB commands were run;
- no POST requests were sent;
- no dry_run: false activation occurred.
