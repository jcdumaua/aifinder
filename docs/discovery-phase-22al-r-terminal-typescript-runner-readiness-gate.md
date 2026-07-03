# Phase 22AL-R — Terminal TypeScript Runner Readiness Gate

## Phase purpose

Phase 22AL-R is a documentation-only readiness gate to resolve the terminal TypeScript runner gap discovered during Phase 22AL.

Phase 22AL was approved with the exact phrase:

```text
Approve Phase 22AL natural live-staging repopulation
```

However, Phase 22AL failed safely before any live staging occurred because the local terminal environment did not have a `tsx` runner available.

Phase 22AL-R records that failed-safe result, evaluates the runner gap, rejects unsafe fallback paths, and defines the safest governed path before retrying live staging.

Phase 22AL-R does not install packages, does not run live staging, does not query Supabase, and does not mutate any database row.

## Current baseline

Phase 22AL-R starts from the pushed Phase 22AK commit:

- `bccf03e Document natural live-staging repopulation approval gate`

## Phase 22AL failed-safe result

Phase 22AL terminal output showed:

```text
Repo status before execution: ## main...origin/main
Latest commit: bccf03e Document natural live-staging repopulation approval gate
Working tree clean.
ERROR: tsx runner is not available locally. Refusing to fall back to raw/unreviewed insert.
Exit code: 1
```

The script stopped before creating the temporary TypeScript execution path and before any staging helper execution.

No live-staging mutation occurred.

## Preserved boundaries from Phase 22AL

The failed-safe Phase 22AL attempt preserved:

- No Supabase write.
- No candidate creation.
- No candidate status change.
- No DB mutation.
- No raw insert fallback.
- No API route call.
- No extraction execution.
- No crawler execution.
- No fixture creation.
- No candidate UUID printing.
- No candidate decision target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen/source changes.
- No repo file changes.
- No commit.
- No push.

## Boundary

Allowed in Phase 22AL-R:

- Verify repo state.
- Verify latest commit.
- Inspect local Node/npm versions.
- Inspect whether `node_modules/.bin/tsx` exists.
- Inspect `package.json` and lockfile for runner availability.
- Run static-only inspection of staging helper import surfaces.
- Run existing project checks.
- Define a safe runner readiness path.
- Prepare a Gemini review package.

Forbidden in Phase 22AL-R:

- No package installation.
- No `npm install`.
- No `npm exec --package ...` network package fetch.
- No package.json or lockfile edits.
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
- No candidate UUID selection or printing.
- No candidate target selection.
- No discovery run/source/preview target selection.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No source changes.
- No commit until after Gemini approval.
- No push.

## Runner gap

The Phase 22AL script intentionally refused to use a raw insert fallback.

The intended implementation path was:

1. Run a temporary terminal script.
2. Import existing repo TypeScript helpers:
   - `getCandidatePreview`
   - `stageNormalizedDiscoveryCandidate`
3. Re-run read-only eligibility discovery.
4. Use the governed staging helper to stage at most one candidate.

That path requires the terminal to execute TypeScript helper modules safely.

The local terminal does not currently provide `tsx` through `node_modules/.bin/tsx`.

## Unsafe fallback paths

Phase 22AL-R rejects these fallback paths:

### Raw insert fallback

Rejected.

Reason:

- It bypasses the governed staging helper.
- It duplicates mapping logic.
- It increases the risk of missing validation, duplicate checks, audit fields, or future helper changes.
- It violates the Phase 22AK intention to use the existing governed staging path.

### Unreviewed API route call

Rejected for the immediate retry path.

Reason:

- Phase 22AK explicitly separated the terminal helper execution path from API route execution.
- API route execution introduces authentication/session/CSRF concerns.
- It would require a separate approval gate if chosen.

### Network package fetch during live staging

Rejected.

Reason:

- Running `npm exec --package tsx ...` or equivalent during live staging could fetch new code during a mutation phase.
- Tooling should be resolved before the live mutation phase.
- Dependency or runner changes require separate review.

### Source-code workaround during live staging

Rejected.

Reason:

- Live staging should not include API/UI/source/tooling implementation changes.
- Any source or package changes must be separate, reviewed, committed, and pushed before retrying the mutation phase.

## Safe runner options

### Option A — Add a reviewed dev runner dependency

Add `tsx` as a dev dependency in a separate tooling phase.

Pros:

- Uses a common TypeScript runner.
- Keeps live-staging script small.
- Allows importing existing TypeScript helpers directly.
- Avoids raw insert fallback.
- Makes terminal helper execution reproducible.

Cons:

- Requires package.json and lockfile changes.
- Requires review, `npm run check`, commit, and push before retrying Phase 22AL.

This is the preferred path if Gemini agrees.

### Option B — Create a reviewed permanent project script

Add a dedicated package script such as:

```json
"discovery:phase22al:live-staging": "tsx /tmp/aifinder-phase-22al-natural-live-staging-repopulation.ts"
```

Rejected for now unless combined with Option A.

Reason:

- A package script alone does not solve runner availability.
- It adds permanent project surface for a one-time governed operation.

### Option C — Use Node-native TypeScript support

Possible but not selected by default.

Reason:

- Node-native TypeScript support may vary by Node version and project module configuration.
- The repo helpers may depend on TypeScript, ESM/CJS behavior, path aliases, or Next.js expectations.
- It needs a separate dry import readiness smoke before being used for a mutation phase.

### Option D — Use existing API route

Possible but not selected by default.

Reason:

- It would require admin auth/session/CSRF handling.
- It changes the approved execution surface.
- It should be planned separately if selected.

## Recommended path

Phase 22AL-R recommends the following safe sequence:

1. **Phase 22AL-S — Terminal TypeScript Runner Tooling Addition Gate**
   - Documentation-only gate to approve adding `tsx` as a dev dependency.
   - Define exact package command.
   - Require Gemini review.

2. **Phase 22AL-T — Terminal TypeScript Runner Tooling Addition Implementation**
   - Add `tsx` as a dev dependency only if Gemini approves.
   - Run `npm run check`.
   - Commit and push the package/lockfile update.

3. **Phase 22AL-U — Terminal Helper Import Readiness Smoke**
   - Run a no-DB, no-mutation smoke that imports:
     - `getCandidatePreview`
     - `stageNormalizedDiscoveryCandidate`
   - Confirm the terminal can load the helpers.
   - No Supabase query.
   - No live staging.

4. **Phase 22AL-V — Natural Live-Staging Repopulation Retry Approval Gate**
   - Reconfirm the exact live-staging phrase.
   - Reconfirm Phase 22AJ context may be re-derived internally.
   - Reconfirm one-candidate mutation boundary.

5. **Phase 22AL-W — Natural Live-Staging Repopulation Retry Execution**
   - Re-run the guarded live-staging script.
   - Use the existing governed staging helper.
   - Stage at most one candidate.

## Exact future approval phrase for tooling addition

A future tooling-addition phase must not install or modify packages unless James provides this exact phrase:

```text
Approve Phase 22AL-T TypeScript runner tooling addition
```

This phrase would authorize only a reviewed dev-dependency/tooling change.

It must not authorize:

- live staging,
- Supabase queries,
- candidate creation,
- DB mutation,
- API route calls,
- extraction,
- crawler execution,
- candidate decision execution,
- public publishing,
- cleanup mutation.

## Gemini review questions

Gemini should review:

1. Whether adding `tsx` as a dev dependency is the safest runner path.
2. Whether raw insert fallback should remain blocked.
3. Whether API route execution should remain blocked for the immediate retry.
4. Whether a no-DB helper import smoke should run before retrying live staging.
5. Whether the proposed 22AL-S through 22AL-W sequence is sufficiently governed.
6. Whether Phase 22AL-R may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AL-R for docs-only commit.

Gemini review summary:

- The Phase 22AL failed-safe behavior is confirmed: the script correctly halted when the `tsx` binary was unavailable.
- No raw insertion, governance bypass, Supabase write, candidate creation, status change, API route call, extraction, crawler execution, candidate decision, public publishing, cleanup mutation, repo change, commit, or push occurred during the failed-safe Phase 22AL attempt.
- Raw/unreviewed insert fallback remains rejected.
- Network-fetched dependencies during live staging remain rejected.
- Unreviewed API route execution remains rejected for the immediate retry path.
- The proposed sequence from Phase 22AL-S through Phase 22AL-W is approved as a disciplined governance path.
- Phase 22AL-U helper import readiness smoke is confirmed as an essential verification layer before retrying the mutation.
- Safety locks remain active for live staging, package changes, database mutation, candidate decisions, `approve_for_draft`, public publishing, cleanup mutation, and source/API/UI/Supabase/schema/migration/typegen changes.

Gemini asked whether `tsx` has been identified as the preferred runner or whether compatibility should be verified with existing AiFinder helper modules before adding it as a dev dependency.

Phase 22AL-R answer:

- `tsx` remains the preferred runner candidate because it is a common, lightweight TypeScript runtime suitable for temporary terminal scripts that need to import existing TypeScript helper modules.
- Compatibility must still be verified after the reviewed tooling addition and before any live-staging retry.
- Therefore, Phase 22AL-U remains mandatory: it must run a no-DB, no-Supabase-query, no-mutation helper import smoke that imports the relevant helper modules and confirms the terminal runtime can load them.
- If the helper import smoke fails, Phase 22AL-W must not run and a revised runner/tooling plan must be prepared.

Commit approval is limited to this documentation update. No package install, package.json edit, lockfile edit, live-staging command, Supabase query, target selection, extraction run, staging write, fixture creation, status transition, cleanup mutation, public publishing, `approve_for_draft`, or candidate decision may proceed from Phase 22AL-R.

## Next recommended phase after approval, commit, and push

Phase 22AL-S — Terminal TypeScript Runner Tooling Addition Gate.

Phase 22AL-S should remain docs-only and prepare a reviewed tooling addition plan before any package changes occur.
