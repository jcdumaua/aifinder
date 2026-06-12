# AiFinder AI Handoff

Use this file when continuing AiFinder work with ChatGPT, Gemini, Roo, or Codex.

## Current Workflow

Before starting any work:

- git status
- npm run check

Only continue if the working tree is clean and the check passes.

After making changes:

- npm run check
- git status

Do not commit if lint or build fails.

## Important Project Rules

- Keep changes small and focused.
- Do not make broad refactors without approval.
- Do not change Supabase schema unless explicitly approved.
- Do not add database constraints unless explicitly approved.
- Do not expose secrets.
- Do not edit or commit .env.local.
- Only .env.example should be committed for environment variable documentation.

## Recent Terminal Upgrades

These upgrades were completed and pushed:

- Homepage category filter now uses TOOL_CATEGORIES from lib/tool-categories.ts.
- Admin Add/Edit and public Submit category dropdowns use standardized TOOL_CATEGORIES.
- middleware.ts was migrated to proxy.ts for Next.js 16.
- package.json now includes npm run check.
- README.md includes Developer Commands.
- .env.example documents required environment variables with empty values only.

## Do Not Undo

Do not undo these changes:

- Do not change homepage filter back to the filtered categories list.
- Do not recreate middleware.ts.
- Keep the exported function in proxy.ts as proxy.
- Do not remove npm run check.
- Do not put real secrets in .env.example.

## Validation Command

Use this before commit:

npm run check

This runs:

npm run lint -- --quiet && npm run build

## Expected Build Note

The build may show this warning:

Using edge runtime on a page currently disables static generation for that page

This is currently acceptable. Do not try to fix it unless specifically assigned.

## Responsive QA Requirement

For UI changes, test:

- Desktop: 1440x1000
- iPad/tablet portrait: 768x1024
- iPad/tablet landscape: 1024x768
- iPad mini portrait: 744x1133
- iPad mini landscape: 1133x744
- Mobile: 390x844
- Small mobile: 360x740
- Foldable cover screen: 344x882
- Foldable open screen: 768x884

Check for:

- no horizontal scrolling
- no clipped buttons
- no hidden controls
- no overlapping modals
- no sticky or fixed elements covering content

## Discovery Search Quality QA

For search relevance changes, build passing is not enough. Manually spot-check
homepage search, one category page, and `/compare` when relevant.

Preserve useful searches:

- ai art
- art generator
- photo generator
- assistant
- website builder
- code helper
- voice generator
- seo
- search ranking

Check noisy false positives:

- artisan
- cart
- cartoon
- business card
- random unrelated text

Exact/direct matches should still appear. Smart matches should not be caused by
unsafe substring matches.

Plural search tolerance checks:

- website builders
- voice generators
- AI assistants
- coding helpers
- art generators
- developer assistants

Double-s safety checks:

- business
- process
- class
- glass

Plural matching must stay word-boundary safe. Do not reintroduce substring noise
such as artisan -> art, cart -> art, or cartoon -> art. Build passing is not
enough; manual search QA is required for search relevance changes.

## Homepage Control Room Safety Rules

Future Homepage Control Room work should use approved presets, not raw CSS.
Edits should follow Draft -> Preview -> Publish, with mobile, tablet, and
desktop responsive safety checked before publish.

- Section ordering should be controlled, not unlimited free drag-and-drop at first.
- Visual controls should use safe presets like compact, normal, and spacious,
  not random pixel values.
- Homepage text changes should preserve SEO clarity and brand tone.
- Discovery chips and featured tools should remain curated and non-noisy.
- Build passing is not enough; visual QA is required for homepage control changes.

## Homepage Content Control QA Rules

- Homepage text must preserve AiFinder's brand tone: clean, simple, fast, premium.
- Hero title/subtitle must stay clear for SEO and user understanding.
- CTA labels must stay short and action-focused.
- No raw HTML or script-like content.
- Text length limits must be respected.
- Draft -> Preview -> Publish is required before future live text changes.
- Visual QA is required on desktop, tablet/iPad, and mobile.
- Build passing is not enough for homepage content/control changes.

## Homepage Tool Placement QA Rules

- Featured tools and Editor's Picks must remain curated and high-quality.
- Tool placement controls must use approved placement IDs only.
- Do not allow duplicate tool slugs inside the same placement.
- Respect safe max item limits.
- Sponsored/paid placement behavior must not be added without separate review.
- Tool placements must not override discovery quality or mislead users.
- Visual QA is required on desktop, tablet/iPad, and mobile.
- Build passing is not enough for homepage placement changes.

## Homepage Visual Preset QA Rules

- Visual controls must use approved presets only.
- Do not allow raw CSS, arbitrary class names, or random pixel values.
- Presets must preserve AiFinder's clean, simple, fast, premium design.
- Presets must not reduce readability, contrast, or accessibility.
- Layout and density changes must be checked on desktop, tablet/iPad, and mobile.
- No horizontal scrolling, clipped buttons, overlapping cards, or hidden controls.
- Search-first layouts must keep discovery/search easy to find.
- Build passing is not enough; visual QA is required.

## Homepage Control Audit Trail QA Rules

- Future homepage control changes must create an audit event.
- Draft updates, previews, publishes, reverts, and validation failures must be trackable.
- Audit events must include action, message, createdAt, and actor label.
- Validation errors should be recorded when publish or preview fails.
- Audit logs must not expose secrets, tokens, or private environment values.
- Publish/revert actions must require separate review before live use.
- Build passing is not enough; audit behavior must be manually verified when live controls are added.

## Homepage Publish Workflow QA Rules

- Future homepage edits must start in draft status.
- Draft changes must be previewed before publishing.
- Published changes must only come from a valid preview state.
- Reverts must move through a controlled status transition.
- Invalid status jumps must be blocked by validation.
- Publish actions must require visual QA on desktop, tablet/iPad, and mobile.
- Publish actions must create an audit trail event.
- Build passing is not enough; workflow behavior must be manually verified when live controls are added.

## Homepage Pre-Publish Checklist QA Rules

- Future homepage publishing must require a pre-publish checklist.
- Required checks must pass before publish is allowed.
- Content, layout, tool placements, workflow state, and audit readiness must be validated.
- Desktop, tablet/iPad, and mobile QA must be completed before publish.
- Accessibility/readability checks must be completed before publish.
- Failed checks must block publishing and show clear validation errors.
- Completed checklist state must not be faked or bypassed.
- Build passing is not enough; checklist behavior must be manually verified when live controls are added.

## Homepage Control Room Readiness QA Rules

- Future live homepage controls must check Control Room readiness before publishing.
- Readiness must include config, content, tool placement, workflow, audit, and checklist validation.
- Errors must block publishing.
- Warnings must be visible to admins before publishing.
- Readiness status must not be hardcoded or bypassed.
- Admin readiness display must stay read-only unless a future editable phase explicitly approves controls.
- Build passing is not enough; readiness behavior must be manually verified when live controls are added.

## Homepage Control Room Live Implementation Gate Rules

- Do not add live editable homepage controls without an explicitly approved future phase.
- Future implementation must move through storage/design proposal, draft-only admin editor, preview-only mode, validation and audit wiring, protected publish flow, and responsive visual QA.
- No homepage change should go live directly from an editor form.
- Draft, preview, readiness, checklist, and audit rules must be respected before publish.
- Raw CSS, arbitrary styling, and uncontrolled drag-and-drop remain blocked unless separately approved.
- Public homepage behavior must not change during blueprint-only phases.
- Build passing is not enough; Gemini/James review and visual QA are required before live controls.

## Homepage Control Room CMS Publishing Model

- Future Admin homepage changes should work like a CMS publish flow.
- Safe content/settings changes may include hero text, section visibility/order, starter chips, featured tools, visual presets, layout presets, and SEO text.
- These changes should use Draft -> Preview -> Validate -> Publish to Homepage.
- Publishing homepage settings should not require a Vercel redeploy when only content/settings change.
- Actual code upgrades, security changes, schema changes, API changes, dependency changes, and search logic changes must remain in VS Code/Codex/GitHub/Vercel workflow.
- Admin publishing must not bypass readiness validation, pre-publish checklist, audit trail, responsive QA, or James/Gemini review.
- Do not call this "code deployment"; call it "Publish to Homepage" for content/settings.

### Homepage Control Room Phase 0 Status

- Phase 0 is blueprint/foundation work only.
- Completed foundations include homepage config, content, tool placement, visual presets, audit trail, publish workflow, pre-publish checklist, readiness validation, and CMS publishing model.
- Phase 0 must not create live editable homepage controls, database publishing, or public homepage behavior changes.
- Future live implementation must start with a storage/design proposal before any draft editor, preview mode, validation wiring, or protected publish flow.
- “Publish to Homepage” means publishing approved content/settings, not deploying code.

### Homepage Control Room Storage and Design Proposal Gate

- Before live editable Homepage Control Room controls are added, create a storage/design proposal first.
- The proposal must define where homepage drafts, previews, published settings, audit events, and checklist state will live.
- The proposal must explain Supabase table structure, Row Level Security expectations, admin-only access, rollback/revert behavior, and validation flow.
- Do not add database tables, migrations, API routes, or live publishing until the proposal is reviewed and approved.
- Storage/design approval must happen before draft editor, preview mode, validation wiring, or protected publish flow.

### Homepage Control Room Storage Proposal Checklist

A future storage/design proposal must define:

- Tables needed for homepage drafts, previews, published config, audit events, and checklist state.
- Which data is admin-only and which data can be safely read by the public homepage.
- Row Level Security expectations for read, write, publish, revert, and audit access.
- How draft, preview, and published states stay separated.
- How validation errors, warnings, and checklist completion are stored.
- How publish and revert actions create audit events.
- How rollback works if a published homepage config causes issues.
- How responsive QA and accessibility QA are confirmed before publish.
- Migration/backfill plan if existing homepage content becomes database-driven.


## Commit Flow

1. npm run check
2. git status
3. git add .
4. git commit -m "Clear commit message"
5. git push
6. git status

The final git status should show:

nothing to commit, working tree clean
