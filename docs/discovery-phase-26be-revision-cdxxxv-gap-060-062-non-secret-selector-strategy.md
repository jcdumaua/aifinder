# AiFinder Phase 26BE — Revision CDXXXV — GAP-060–GAP-062 Non-Secret Selector Strategy

## Required selectors

A future reviewed operation may require:

- Project selector.
- Optional team selector.
- Fixed target selector: `production`.
- Fixed branch selector: `main`.

## Approved input model

Selectors must be supplied explicitly by the operator as reviewed non-secret strings:

- `AIFINDER_VERCEL_PROJECT_SELECTOR`
- `AIFINDER_VERCEL_TEAM_SELECTOR` only when team context is required.

## Selector rules

### Project selector

- Must be supplied explicitly.
- Must not be auto-discovered.
- Must match an independently reviewed expected form.
- May be a documented project name or project identifier.
- Must not be printed in raw command output.
- May be represented in the sanitized review package only as `present=true` and `match=true|false`.

### Team selector

- Optional by default.
- May be supplied only after a separate need determination.
- Must not be auto-discovered.
- Must not be printed.
- May be represented only as `team_context_used=true|false`.

### Fixed selectors

- `target=production`
- `branch=main`
- `limit=1`

## Prohibited selector sources

- Vercel project listing.
- Team listing.
- Account enumeration.
- Repository scanning for identifiers.
- Environment-value scanning.
- Deployment URL parsing.
- Browser storage or cookie inspection.
- Guessing or fallback selectors.

## Current state

- Project selector obtained: `NO`
- Team selector obtained: `NO`
- Selector discovery authorized: `NO`
- Platform lookup authorized: `NO`

## Result

`NON_SECRET_SELECTOR_INPUT_STRATEGY_DEFINED_DISCOVERY_BLOCKED`
