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

## Commit Flow

1. npm run check
2. git status
3. git add .
4. git commit -m "Clear commit message"
5. git push
6. git status

The final git status should show:

nothing to commit, working tree clean
