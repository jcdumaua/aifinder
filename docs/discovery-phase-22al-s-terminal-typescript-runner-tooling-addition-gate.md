# Phase 22AL-S — Terminal TypeScript Runner Tooling Addition Gate

## Phase purpose

Phase 22AL-S is a documentation-only approval gate for adding a terminal TypeScript runner to AiFinder.

Phase 22AL-S follows Phase 22AL-R, which confirmed that the Phase 22AL live-staging attempt failed safely because no local `tsx` runner was available and that raw/unreviewed insert fallback must remain blocked.

Phase 22AL-S defines the future tooling addition boundary for Phase 22AL-T.

Phase 22AL-S does not install packages, does not modify `package.json`, does not modify `package-lock.json`, and does not run any live-staging or database operation.

## Current baseline

Phase 22AL-S starts from the pushed Phase 22AL-R commit:

- `1b4b133 Document terminal TypeScript runner readiness gate`

## Phase 22AL-R conclusion

Phase 22AL-R documented:

- Phase 22AL failed safely before staging because `tsx` was unavailable.
- No raw insert fallback was used.
- No Supabase write occurred.
- No candidate was created.
- No candidate status changed.
- No API route was called.
- No candidate decision was executed.
- No public publishing, cleanup mutation, or `approve_for_draft` occurred.
- No repo files changed during the failed-safe execution.
- `tsx` is the preferred runner candidate.
- Compatibility must still be verified by a no-DB/no-Supabase-query/no-mutation helper import smoke before retrying live staging.

## Boundary

Allowed in Phase 22AL-S:

- Verify repo state.
- Verify latest commit.
- Inspect Node and npm versions.
- Inspect whether `node_modules/.bin/tsx` exists.
- Inspect `package.json` and `package-lock.json` for existing runner entries.
- Inspect relevant docs and helper import surfaces.
- Run existing project checks.
- Define the exact future Phase 22AL-T approval phrase.
- Define the exact future package command.
- Define the future verification and commit/push rules.
- Prepare a Gemini review package.

Forbidden in Phase 22AL-S:

- No package installation.
- No `npm install`.
- No `npm install --save-dev tsx`.
- No `npm exec --package ...` package fetch.
- No package.json edit.
- No package-lock.json edit.
- No node_modules modification.
- No live DB read.
- No Supabase query.
- No API route call.
- No live-staging execution.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate creation.
- No candidate status change.
- No DB mutation.
- No raw insert fallback.
- No candidate UUID selection or printing.
- No candidate target selection.
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen/source changes.
- No implementation changes.
- No commit until after Gemini approval.
- No push.

## Runner choice

Phase 22AL-S selects `tsx` as the preferred runner candidate for the next tooling implementation phase.

Reason:

- The needed terminal script is temporary and must import existing TypeScript helper modules.
- `tsx` is a lightweight TypeScript runtime commonly used for local script execution.
- It avoids raw SQL/insert fallback.
- It keeps Phase 22AL-W aligned with the governed staging helper path.
- It supports a small, auditable terminal execution wrapper.

This selection is conditional.

Phase 22AL-U must still verify compatibility with AiFinder helper modules before any live-staging retry.

## Future Phase 22AL-T approval phrase

Phase 22AL-T must not install packages or modify package files unless James provides this exact phrase:

```text
Approve Phase 22AL-T TypeScript runner tooling addition
```

Any other wording authorizes planning only.

This phrase authorizes only the reviewed tooling addition defined here.

It does not authorize:

- live staging,
- Supabase queries,
- candidate creation,
- DB mutation,
- API route calls,
- extraction,
- crawler execution,
- candidate decision execution,
- `approve_for_draft`,
- public publishing,
- cleanup mutation.

## Future Phase 22AL-T command

The future tooling implementation phase should use this command shape:

```bash
cd /Users/jamescarlodumaua/aifinder
npm install --save-dev tsx
```

The command must be run only after:

1. Phase 22AL-S receives Gemini approval.
2. Phase 22AL-S is committed and pushed.
3. James provides the exact Phase 22AL-T approval phrase.

## Future Phase 22AL-T allowed changes

Phase 22AL-T may change only:

- `package.json`
- `package-lock.json`

Expected change type:

- Add `tsx` under `devDependencies`.
- Add the corresponding lockfile entries required by npm.

Phase 22AL-T must not change:

- application source files,
- API routes,
- UI files,
- Supabase schema files,
- migrations,
- generated type files,
- docs except possible result documentation if separately approved,
- tests unless separately approved,
- `.env` files,
- database state.

## Future Phase 22AL-T verification requirements

Phase 22AL-T must verify:

- `node_modules/.bin/tsx` exists after installation.
- `package.json` includes `tsx` only in `devDependencies`.
- `package-lock.json` includes the resolved `tsx` package.
- `npm run check` passes.
- `git diff --check` passes.
- Only `package.json` and `package-lock.json` changed.
- No source/API/UI/Supabase/schema/migration/typegen files changed.
- No live DB read occurred.
- No Supabase query occurred.
- No live staging occurred.
- No DB mutation occurred.
- No candidate decision occurred.
- No public publishing or cleanup occurred.
- No commit until Gemini approval or the phase's reviewed commit path says otherwise.
- No push until James explicitly approves push.

## Future Phase 22AL-U helper import readiness smoke

After Phase 22AL-T is committed and pushed, Phase 22AL-U must run before any live-staging retry.

Phase 22AL-U must be no-DB, no-Supabase-query, and no-mutation.

It should verify that the terminal runner can import the relevant helper modules, including:

- `lib/discovery/discovery-candidate-staging-admin.ts`
- `lib/discovery/discovery-candidate-preview-provider.ts`
- `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts` if needed

Phase 22AL-U should not call helper functions that create clients, read Supabase, write Supabase, run extraction, stage candidates, call API routes, or execute candidate decisions.

If Phase 22AL-U fails, Phase 22AL-W must not run.

## Future Phase 22AL-W retry protection

Even after `tsx` is added and helper imports pass:

- Phase 22AL-W must still require a separate exact live-staging retry approval phrase.
- Phase 22AL-W must re-run the read-only eligibility discovery internally.
- Phase 22AL-W must stop unless exactly one eligible context exists.
- Phase 22AL-W must use the governed staging helper.
- Phase 22AL-W must stage at most one candidate.
- Phase 22AL-W must not print candidate UUIDs or restricted target identifiers by default.
- Phase 22AL-W must not run candidate decision execution, `approve_for_draft`, public publishing, or cleanup mutation.

## Risk notes

Adding `tsx` as a dev dependency is a tooling change, not a production behavior change by itself.

However, it still changes the dependency graph and lockfile.

For that reason:

- it must be reviewed,
- it must be committed separately from live-staging retry,
- it must be pushed before retrying live staging,
- helper import readiness must be verified after the dependency is installed.

## Gemini review questions

Gemini should review:

1. Whether `tsx` is the appropriate preferred runner for this repo's terminal helper execution need.
2. Whether the future Phase 22AL-T command should be `npm install --save-dev tsx`.
3. Whether Phase 22AL-T should be limited to `package.json` and `package-lock.json`.
4. Whether Phase 22AL-U no-DB helper import smoke is sufficient before live-staging retry.
5. Whether raw insert fallback, unreviewed API route calls, and network package fetches during live staging remain correctly blocked.
6. Whether Phase 22AL-S may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AL-S for docs-only commit.

Gemini review summary:

- Phase 22AL-S is confirmed as documentation-only: no package installation, package edits, source changes, live DB reads, Supabase queries, API route calls, live staging, or mutations are authorized.
- The runner choice is confirmed: adding `tsx` as a `devDependencies` entry is sound and safe for the repo's temporary terminal helper execution need.
- The future Phase 22AL-T mutation boundary is confirmed as tooling-only and limited to the reviewed `npm install --save-dev tsx` command.
- Future Phase 22AL-T must be limited to `package.json` and `package-lock.json` changes.
- The Phase 22AL-S through Phase 22AL-W governance sequence is confirmed as safe and disciplined:
  - Phase 22AL-T: tooling implementation,
  - Phase 22AL-U: no-DB/no-mutation helper import readiness smoke,
  - Phase 22AL-V: retry approval gate,
  - Phase 22AL-W: live-staging retry execution.
- Phase 22AL-U remains a critical safety layer and must verify helper import compatibility before any live-staging retry.
- Raw insert fallback remains blocked.
- Unreviewed API route execution remains blocked for the immediate retry path.
- Network-fetched dependencies during live staging remain blocked.
- Safety locks remain active for live staging, Supabase queries, candidate creation, database mutation, API route calls, extraction, crawler execution, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, and source/API/UI/Supabase/schema/migration/typegen changes.
- The exact future approval phrase is confirmed: `Approve Phase 22AL-T TypeScript runner tooling addition`.

Commit approval is limited to this documentation update. No package install, package.json edit, package-lock edit, node_modules modification, live-staging command, Supabase query, target selection, extraction run, staging write, fixture creation, status transition, cleanup mutation, public publishing, `approve_for_draft`, or candidate decision may proceed from Phase 22AL-S.

## Next recommended phase after approval, commit, and push

Phase 22AL-T — Terminal TypeScript Runner Tooling Addition Implementation.

Phase 22AL-T must not run until James gives the exact approval phrase after Phase 22AL-S has been reviewed, committed, and pushed.
