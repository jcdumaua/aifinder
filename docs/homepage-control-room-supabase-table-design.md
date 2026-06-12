# Homepage Control Room Supabase Table Design

## Purpose

This document proposes the future Supabase table design for AiFinder’s Homepage Control Room.

This is design documentation only. Do not create tables, SQL, migrations, API routes, Admin editors, or live publishing behavior until this design is reviewed and approved.

The future system should support:

Draft → Preview → Validate → Publish to Homepage

The public homepage should only read the active validated published configuration.

## Design Principles

- Use versioned rows, not a single-row overwrite model.
- Enforce only one active published homepage config.
- Store featured tool placements by Tool UUID/ID, not slug.
- Public reads must expose only published content/settings.
- Drafts, previews, audit events, checklist state, admin notes, and validation internals must stay private.
- Admin writes must require authenticated Admin access and CSRF/session protection.
- Publish/revert actions must create audit events.
- Homepage publishing is content/settings publishing, not code deployment.

## Proposed Tables

## 1. `homepage_control_configs`

Stores homepage control configurations for draft, preview, and published states.

### Suggested Columns

- `id`
  - UUID primary key
- `status`
  - text enum-like value: `draft`, `preview`, `published`
- `version`
  - integer or timestamp-based version number
- `is_active_published`
  - boolean
  - only one row should be true at a time
- `content_config`
  - jsonb
  - hero text, CTA labels, SEO/supporting copy
- `layout_config`
  - jsonb
  - section visibility/order, layout preset, density preset
- `tool_placements`
  - jsonb
  - placement IDs and Tool UUID/ID references
- `starter_chips`
  - jsonb
  - approved starter search chips
- `validation_errors`
  - jsonb or text array
- `validation_warnings`
  - jsonb or text array
- `created_by`
  - admin user/profile UUID, nullable during early single-admin phase
- `created_by_label`
  - safe actor label
- `created_at`
  - timestamp
- `updated_at`
  - timestamp
- `published_at`
  - timestamp, nullable
- `reverted_from_config_id`
  - UUID nullable reference to previous config

### Required Constraints

- `status` must be one of:
  - `draft`
  - `preview`
  - `published`
- Only one active published config should be allowed.
- Tool placements must reference Tool UUID/ID, not slug.
- Published rows must pass validation before becoming active.

### Recommended Indexes

- Index on `status`
- Index on `is_active_published`
- Index on `published_at`
- Index on `created_at`

### Public Access

The public homepage should not read this table directly unless a strict public-safe policy is approved.

Preferred approach:

- Public reads use a safe view or database function that only returns the single active published config.
- The view/function must strip admin-only metadata.

## 2. `homepage_control_audit_events`

Stores audit history for Homepage Control Room actions.

### Suggested Columns

- `id`
  - UUID primary key
- `config_id`
  - UUID reference to `homepage_control_configs`
- `action`
  - text enum-like value
- `message`
  - text
- `actor_id`
  - admin user/profile UUID, nullable during early single-admin phase
- `actor_label`
  - safe actor label
- `validation_errors`
  - jsonb or text array
- `metadata`
  - jsonb, admin-only, no secrets
- `created_at`
  - timestamp

### Suggested Actions

- `created-draft`
- `updated-draft`
- `previewed`
- `published`
- `reverted`
- `validation-failed`

### Required Rules

- Audit events must not store secrets, tokens, private environment values, or sensitive internals.
- Publish and revert actions must create audit events.
- Validation failures should create audit events.
- Audit history must not be deleted by revert actions.

### Recommended Indexes

- Index on `config_id`
- Index on `action`
- Index on `created_at`
- Index on `actor_id`

### Public Access

No public access.

Audit events must be admin-only.

## 3. `homepage_control_checklist_runs`

Stores future pre-publish checklist completion state.

### Suggested Columns

- `id`
  - UUID primary key
- `config_id`
  - UUID reference to `homepage_control_configs`
- `checklist_items`
  - jsonb
- `all_required_complete`
  - boolean
- `completed_by`
  - admin user/profile UUID, nullable during early single-admin phase
- `completed_by_label`
  - safe actor label
- `created_at`
  - timestamp
- `updated_at`
  - timestamp

### Required Checklist Items

- Content validation
- Layout validation
- Tool placement validation
- Workflow validation
- Audit event readiness
- Search Quality QA
- Desktop QA
- Tablet/iPad QA
- Mobile QA
- Accessibility/readability QA

### Required Rules

- Publishing must be blocked unless all required checklist items are complete.
- Checklist state must not be faked or bypassed.
- Checklist completion should expire or reset when relevant content/settings change.

### Public Access

No public access.

Checklist runs must be admin-only.

## Public-Safe Published Config View or Function

A future public-safe view/function should expose only:

- active published homepage content/settings
- layout preset
- density preset
- section order/visibility
- starter chips
- featured tool placement references resolved safely for the homepage

It must not expose:

- draft configs
- preview configs
- audit events
- checklist state
- admin notes
- actor IDs
- validation internals
- secrets or environment values

## RLS Expectations

### Public Role

Public/anonymous users may only read the safe published-config view/function.

Public users must not read:

- `homepage_control_configs` drafts/previews
- audit events
- checklist runs
- admin-only metadata

### Admin Role

Authenticated Admin users may:

- create/update draft configs
- create preview configs
- validate configs
- publish through protected flow
- revert through protected flow
- read audit events
- read checklist runs

Admin writes must require:

- authenticated session
- CSRF protection through existing Admin API flow
- server-side validation
- audit trail creation where required

## Versioning and Retention

Recommended direction:

- Use versioned rows.
- Do not overwrite the only published row.
- Keep enough previous published versions for rollback.
- Suggested future retention policy:
  - keep the last 10 published versions
  - keep audit events longer than config drafts, if storage allows
  - prune abandoned drafts after a future approved policy

## Tool Placement Reference Strategy

Use Tool UUID/ID as the database source of truth.

Reason:

- Better referential integrity
- Safer if slugs change
- Safer if tool names change
- Allows app layer to resolve current slug for routing

The app layer should resolve:

Tool ID → tool record → current slug/logo/name/category

## Public Fetch Strategy

Recommended direction:

- Use cached or revalidated public reads.
- Do not fetch from Supabase on every homepage hit if avoidable.
- Use Next.js ISR or tag-based revalidation in the future.
- When Admin publishes, trigger homepage revalidation after protected publish flow is approved.

## Publish Flow Summary

Future protected publish flow should:

1. Load draft/preview config.
2. Validate config, content, layout, tool placements, workflow state, audit readiness, and checklist.
3. Confirm all required pre-publish checklist items are complete.
4. Create audit event.
5. Mark previous active published config inactive.
6. Mark new config as active published.
7. Trigger cache/revalidation.
8. Public homepage reads updated published config.

## Rollback/Revert Summary

Future revert flow should:

1. Select a previous validated published config.
2. Validate it again.
3. Create a new audit event.
4. Mark current active published config inactive.
5. Mark reverted config or restored copy as active published.
6. Trigger cache/revalidation.
7. Fall back to safe defaults if revert validation fails.

## Open Questions Before SQL

- Should `status` be a Postgres enum or text with a check constraint?
- Should active published enforcement use a partial unique index?
- Should reverted configs be reused directly or copied into a new row?
- Should audit events reference Admin profile IDs immediately or wait for multi-admin profile support?
- Should checklist items be stored as jsonb or normalized rows?
- Should starter chips be part of `content_config` or separate jsonb?
- Should public-safe view resolve tool IDs to slug/name/logo, or should the app resolve after fetch?
- Should abandoned drafts expire automatically?
- Should publish revalidation use ISR revalidate time or tag-based revalidation?

## Recommended Next Step

Before SQL or migrations:

1. James reviews this table design.
2. Gemini reviews security/scalability/RLS risks.
3. Revise this document if needed.
4. Only then create a SQL migration proposal.
