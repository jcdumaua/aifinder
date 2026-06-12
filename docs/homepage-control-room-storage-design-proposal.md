# Homepage Control Room Storage/Design Proposal

## Purpose

The future Homepage Control Room should let Admin safely publish approved homepage content and settings through a controlled flow:

Draft → Preview → Validate → Publish to Homepage

This is a CMS-like publishing model for homepage content/settings. It is not code deployment. Actual code upgrades, security changes, API changes, database schema changes, dependency changes, and search/discovery logic changes must continue through the VS Code/Codex/GitHub/Vercel workflow.

## What Admin Can Eventually Control

Future Admin homepage controls may safely manage approved content/settings such as:

- Hero title and subtitle
- Homepage section visibility and order
- Starter search chips
- Featured tool placements
- Visual, layout, and density presets
- SEO/supporting homepage text
- Homepage announcement or promotional copy, if separately approved

All controls must stay within approved schema, validation, and preset boundaries.

## What Admin Must Not Control

Admin must not directly control:

- Raw CSS
- Arbitrary class names
- Random pixel values
- Code deployment
- Security rules
- API logic
- Search algorithm behavior
- Database schema changes
- Dependency installation or removal
- Environment variables or secrets

## Proposed Supabase Storage Model

This proposal suggests the following future table ideas only. Do not create tables or SQL until reviewed and approved.

### `homepage_control_configs`

Purpose: Store draft, preview, and published homepage configuration records.

Possible responsibilities:

- Store homepage content/settings
- Store publish status: draft, preview, or published
- Store version metadata
- Track created/updated/published timestamps
- Track admin actor labels where safe
- Keep public-safe published settings separate from admin-only metadata
- Store featured tool placement references by Tool UUID/ID, not slug, for referential integrity
- Use versioned rows rather than a single-row overwrite model
- Enforce only one active published config at the database level

### `homepage_control_audit_events`

Purpose: Store audit history for homepage control actions.

Possible responsibilities:

- Track draft updates
- Track preview actions
- Track publish actions
- Track revert actions
- Track validation failures
- Store action, message, createdAt, actorLabel, and safe validation errors
- Never store secrets, tokens, or private environment values

### `homepage_control_checklist_runs`

Purpose: Store future pre-publish checklist state.

Possible responsibilities:

- Track required checklist completion before publish
- Track desktop/tablet/mobile QA confirmation
- Track accessibility/readability QA confirmation
- Track validation pass/fail state
- Track admin-safe notes only, if approved later

## Draft / Preview / Published Separation

Draft, preview, and published states must stay separated.

Suggested behavior:

- Draft is where Admin can safely edit content/settings.
- Preview is where Admin can inspect validated draft settings without changing the live homepage.
- Published is the only state the public homepage should read.
- Published homepage config should only come from a valid preview state.
- Invalid status jumps must be blocked by validation.
- Public homepage output must never be directly mutated from an editor form.

## Public Homepage Read Contract

The public homepage may only read validated published homepage content/settings.

Required behavior:

- Public homepage does not read drafts.
- Public homepage does not read preview configs.
- Public homepage does not read audit events.
- Public homepage does not read checklist state.
- Public homepage does not read admin-only metadata.
- If published config is missing or invalid, the homepage falls back to safe default content/settings.
- Public reads must not require admin authentication.
- Public reads must not expose secrets, private admin notes, validation internals, or audit details.

## Admin Write Contract

Admin writes must be authenticated, protected, validated, and audit-tracked.

Required behavior:

- Admin writes require authenticated Admin access.
- Admin writes must respect existing session and CSRF protections.
- Admin writes must validate payloads against approved Homepage Control Room schema helpers before saving.
- Admin writes must not store raw CSS, arbitrary class names, secrets, tokens, or private environment values.
- Publish and revert writes must respect workflow transitions, readiness validation, checklist requirements, and audit trail rules.
- Failed validation must show clear admin-safe errors and must not partially publish changes.

## Validation Flow

Future save, preview, and publish actions should use existing schema helpers before writing or publishing.

Validation should cover:

- Homepage control config
- Homepage content config
- Tool placements
- Visual/layout/density presets
- Publish workflow transitions
- Audit event readiness
- Pre-publish checklist
- Overall Control Room readiness

Publishing must be blocked when validation errors exist.

## Audit Trail

Future Control Room actions must create audit events.

Audit events should be created for:

- Draft creation
- Draft updates
- Preview actions
- Publish actions
- Revert actions
- Validation failures

Audit events should include:

- action
- message
- createdAt
- actorLabel
- validationErrors, when applicable

Audit logs must not expose secrets, tokens, private environment values, or sensitive internals.

## Pre-Publish Checklist

Future homepage publishing must require a pre-publish checklist.

Required checks should include:

- Content validation
- Layout validation
- Tool placement validation
- Workflow validation
- Audit event readiness
- Search Quality QA complete
- Desktop QA complete
- Tablet/iPad QA complete
- Mobile QA complete
- Accessibility/readability QA complete

Failed checks must block publishing and show clear validation errors.

## Rollback / Revert

Revert behavior must restore a previously validated published homepage config.

Required behavior:

- Revert actions create a new audit event.
- Revert actions do not delete audit history.
- Revert actions do not hide the original publish event.
- Reverted configs must still pass validation.
- If revert fails or the previous config is invalid, the homepage falls back to safe default content/settings.
- Revert behavior must not change app code, database schema, API behavior, search logic, or security rules unless separately approved.

## Security / RLS Expectations

Future storage must be designed with clear access boundaries.

High-level expectations:

- Admin-only writes for drafts, previews, publishing, reverting, audit events, and checklist state.
- Public read access only for validated published homepage content/settings.
- No public access to drafts, preview configs, audit events, checklist internals, admin notes, or validation internals.
- RLS must protect write actions.
- Admin API routes must verify session and CSRF protection.
- Public homepage reads must not expose private metadata.
- Public reads should use a public-safe view/function that only returns the active published config.

## Gemini Review Changes Required Before Phase 1C

Gemini reviewed this proposal and returned: Approved with changes.

Before moving to Supabase table design, the following changes must be incorporated.

### Required Changes

- Featured tool placements should store Tool UUID/ID for database referential integrity.
- The application layer should resolve tool slugs for UI routing.
- Search Quality QA must be added to the pre-publish checklist because starter chips and featured tools affect homepage discovery quality.
- The database design must enforce only one active published homepage config at a time.
- Public homepage reads should use a public-safe Supabase view or database function that only exposes the active published config.
- Drafts, previews, audit events, checklist state, admin notes, and validation internals must never be exposed through public reads.

### Recommended Storage Direction

- Use versioned rows for `homepage_control_configs`, not a single-row overwrite model.
- Keep enough published versions to support rollback/revert.
- Define a future retention policy, such as keeping the last 10 published versions.
- Audit events should eventually store an admin ID when multi-admin support exists, while actor labels may remain acceptable during early single-admin phases.
- Public homepage config should be cached or revalidated instead of fetched from Supabase on every request.

### Public Fetch Recommendation

The preferred future public fetch model is:

- Public homepage reads from a safe published-config view/function.
- Only validated published content/settings are returned.
- Admin-only metadata is stripped.
- Next.js should cache or revalidate the result.
- Publishing from Admin should eventually trigger revalidation.

### Phase 1C Gate

Phase 1C may proceed only after these changes are reflected in the proposal.

## Implementation Phases After Proposal

Recommended next phases:

1. Phase 1B: James/Gemini review this proposal.
2. Phase 1C: Supabase table design.
3. Phase 1D: Draft-only Admin editor.
4. Phase 1E: Preview-only mode.
5. Phase 1F: Validation and audit wiring.
6. Phase 1G: Protected publish flow.
7. Phase 1H: Responsive visual QA.

No live editable homepage controls should begin until the proposal and storage design are reviewed and approved.

## Open Questions

Before implementation, decide:

- Should homepage published config be one row or versioned rows?
- How many previous published versions should be kept?
- Should preview links ever be allowed, or should preview remain admin-only forever?
- Should section order be controlled by numeric order or array order?
- Featured tool placements should reference Tool UUID/ID as the database source of truth; the app layer should resolve slugs for routing.
- Should published homepage config be cached, revalidated, or fetched dynamically?
- Should audit events store only actor labels or future admin IDs?
- Should checklist completion expire after content/settings change?
- Should rollback restore the previous version only, or allow choosing from several older versions?
