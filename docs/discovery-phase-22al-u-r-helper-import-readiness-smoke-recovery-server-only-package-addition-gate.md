# Phase 22AL-U-R — Helper Import Readiness Smoke Recovery / `server-only` Package Addition Gate

## Phase purpose

Phase 22AL-U-R is a documentation-only recovery and package-addition approval gate.

It follows Phase 22AL-U, where the helper import readiness smoke failed safely while attempting to import the first helper module with the newly added local `tsx` runner.

Phase 22AL-U-R documents the failed-safe result, identifies the terminal runtime dependency gap, corrects the smoke-harness interpretation issue, and defines the future package-addition implementation boundary for `server-only`.

Phase 22AL-U-R does not install packages, does not modify `package.json`, does not modify `package-lock.json`, does not modify `node_modules`, does not run another helper import smoke, and does not run any live-staging or database operation.

## Current baseline

Phase 22AL-U-R starts from the synchronized Phase 22AL-T commit:

- `039a10e Add TypeScript runner tooling`

Phase 22AL-T added local TypeScript runner tooling:

- `tsx` added as a `devDependencies` entry.
- `package-lock.json` updated for `tsx`.
- Local runner verified: `node_modules/.bin/tsx`.
- `npm run check` passed.
- Final repo status after recovery verification: `## main...origin/main`.

## Phase 22AL-U observed result

Phase 22AL-U attempted a strict no-DB/no-Supabase-query/no-mutation import-only smoke using local `tsx`.

Initial safety checks passed:

- Repo root verified as `/Users/jamescarlodumaua/aifinder`.
- Repo status before smoke: `## main...origin/main`.
- Working tree clean.
- Latest commit: `039a10e Add TypeScript runner tooling`.
- Local `tsx` runner available: `tsx v4.22.5`.
- `tsx` remained devDependency-only.
- Intended helper modules existed:
  - `lib/discovery/discovery-candidate-staging-admin.ts`
  - `lib/discovery/discovery-candidate-preview-provider.ts`
  - `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts`

The temporary smoke file printed these zero-action markers before import:

- `helper_function_calls=0`
- `api_route_calls=0`
- `supabase_queries=0`
- `db_mutations=0`

The first helper import failed safely:

```text
importing=lib/discovery/discovery-candidate-staging-admin.ts

Error: Cannot find module 'server-only'
Require stack:
- /Users/jamescarlodumaua/aifinder/lib/discovery/discovery-candidate-staging-admin.ts
```

Post-failure safety checks confirmed:

- Repo status remained `## main...origin/main`.
- Repo remained clean.
- `npm run check` passed.
- No commit occurred.
- No push occurred.

## Correct Phase 22AL-U interpretation

Phase 22AL-U must be recorded as:

```text
FAILED SAFE
```

It must not be recorded as a pass.

The import smoke did its safety job by stopping before any helper compatibility could be assumed.

No live-staging retry may proceed from Phase 22AL-U.

## Smoke harness issue found

The Phase 22AL-U shell wrapper incorrectly printed:

```text
PHASE_22AL_U_IMPORT_SMOKE_PASS
```

after the `tsx` import process failed.

Root cause:

- The shell wrapper did not stop on the failed `tsx` command.
- The final pass marker was printed by the shell script after the failed subprocess, not by the temporary TypeScript smoke file.
- The repository stayed clean, but the result label was wrong.

Future retry smoke scripts must:

- capture the `tsx` exit code,
- fail immediately on non-zero `tsx` exit,
- print the final pass marker only after a zero exit code,
- avoid continuing to Gemini package generation as a successful smoke when import failed,
- preserve the raw terminal output and original failure code.

## `server-only` package rationale

The failed import was caused by an unresolved package import:

```ts
import "server-only";
```

in the helper module import chain.

Next.js documentation shows `server-only` usage by first installing the package:

```bash
npm install server-only
```

The npm package metadata currently identifies `server-only` as version `0.0.1` with zero dependencies.

Because AiFinder source files directly import `server-only`, the future package should be installed as a normal dependency, not as a dev-only runner dependency.

This is different from `tsx`:

- `tsx` is local terminal tooling and belongs in `devDependencies`.
- `server-only` is imported by application/server source modules and should be resolvable as a normal project dependency.

Adding `server-only` does not authorize any source behavior change by itself.

It only resolves the marker package import so the terminal runner can continue evaluating helper import compatibility.

## Phase 22AL-U-R boundary

Allowed in Phase 22AL-U-R:

- Verify repo state.
- Verify latest commit.
- Inspect current package dependency locations for `tsx` and `server-only`.
- Document the Phase 22AL-U failed-safe result.
- Document the smoke-harness false-pass issue.
- Define the future `server-only` package-addition approval phrase.
- Define the future package-addition command.
- Define future verification requirements.
- Prepare a Gemini review package.

Forbidden in Phase 22AL-U-R:

- No package installation.
- No `npm install`.
- No `npm install server-only`.
- No `npm install --save-dev server-only`.
- No package.json edit.
- No package-lock.json edit.
- No node_modules modification.
- No helper import retry.
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
- No API/UI/Supabase/schema/migration/typegen/source/package implementation changes.
- No commit until after Gemini approval.
- No push.

## Future package-addition approval phrase

The future `server-only` package-addition implementation must not run unless James provides this exact phrase:

```text
Approve Phase 22AL-U-S server-only package addition
```

Any other wording authorizes planning only.

This phrase authorizes only the reviewed package-addition command and package-file changes defined in this gate.

It does not authorize:

- helper import retry,
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

## Future Phase 22AL-U-S command

The future package-addition implementation phase should use this command shape:

```bash
cd /Users/jamescarlodumaua/aifinder
npm install server-only
```

The command must be run only after:

1. Phase 22AL-U-R receives Gemini approval.
2. Phase 22AL-U-R is committed and pushed.
3. James provides the exact Phase 22AL-U-S approval phrase.

## Future Phase 22AL-U-S allowed changes

Phase 22AL-U-S may change only:

- `package.json`
- `package-lock.json`

Expected change type:

- Add `server-only` under `dependencies`.
- Add corresponding lockfile entries required by npm.

Phase 22AL-U-S must not change:

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

## Future Phase 22AL-U-S verification requirements

Phase 22AL-U-S must verify:

- `package.json` includes `server-only` only in `dependencies`.
- `package-lock.json` includes the resolved `server-only` package.
- `server-only` is not added to `devDependencies`, `optionalDependencies`, or `peerDependencies`.
- `tsx` remains only in `devDependencies`.
- `npm run check` passes.
- `git diff --check` passes.
- Only `package.json` and `package-lock.json` changed.
- No source/API/UI/Supabase/schema/migration/typegen/docs files changed unless separately approved.
- No live DB read occurred.
- No Supabase query occurred.
- No live staging occurred.
- No DB mutation occurred.
- No candidate decision occurred.
- No public publishing or cleanup occurred.
- No commit until Gemini approval or the phase's reviewed commit path says otherwise.
- No push until James explicitly approves push.

## Future corrected helper import smoke retry

After Phase 22AL-U-S is committed and pushed, a separate corrected helper import smoke retry must run.

Recommended name:

```text
Phase 22AL-U-T — Corrected Helper Import Readiness Smoke Retry
```

It must remain:

- no DB,
- no Supabase query,
- no mutation,
- import-only,
- no helper function calls,
- no API route calls,
- no live staging,
- no extraction,
- no crawler,
- no fixture or candidate creation,
- no candidate decision,
- no public publishing,
- no cleanup mutation.

It must also fix the previous shell-wrapper issue:

- Use `set -e` or explicit exit-code checking around the `tsx` command.
- Do not print a pass marker unless the TypeScript smoke file exits successfully.
- Treat any import failure as failed-safe.
- Keep the repo clean.
- Copy raw output to clipboard.
- Prepare a Gemini review package only as a failure report if the smoke fails.

## Future live-staging retry remains blocked

Even after `server-only` is added:

- No live-staging retry is authorized.
- No candidate creation is authorized.
- No DB mutation is authorized.
- No API route execution is authorized.
- No extraction or crawler run is authorized.
- No candidate decision execution is authorized.
- No public publishing, cleanup mutation, or `approve_for_draft` is authorized.

A live-staging retry may only be considered after:

1. `server-only` package-addition implementation is approved, committed, and pushed.
2. Corrected helper import readiness smoke passes.
3. Gemini approves the corrected helper import readiness smoke result.
4. A separate retry approval gate is documented and approved.
5. James provides a separate exact live-staging retry approval phrase.

## Gemini review questions

Gemini should review:

1. Whether Phase 22AL-U is correctly recorded as failed-safe, not pass.
2. Whether the `server-only` missing module error is correctly interpreted as a terminal runtime dependency gap.
3. Whether adding `server-only` with `npm install server-only` is the right future package-addition command.
4. Whether `server-only` should be added as a normal `dependencies` entry instead of `devDependencies`.
5. Whether future Phase 22AL-U-S should be limited to `package.json` and `package-lock.json`.
6. Whether the corrected helper import smoke retry requirements are sufficient.
7. Whether live staging remains correctly blocked until after a successful corrected import smoke and separate retry gate.
8. Whether Phase 22AL-U-R may be committed as docs-only.

## Review conclusion

Gemini approved Phase 22AL-U-R for docs-only commit.

Gemini review summary:

- Phase 22AL-U is correctly recorded as `FAILED SAFE`, not as a pass.
- The missing `server-only` module error is correctly interpreted as a terminal runtime dependency gap discovered by the import readiness smoke.
- The Phase 22AL-U smoke preserved safety boundaries: no helper function calls, API route calls, Supabase queries, DB reads, live staging, extraction, crawler execution, fixture or candidate creation, candidate status changes, DB mutations, raw insert fallback, candidate decision execution, `approve_for_draft`, public publishing, cleanup mutation, source/API/UI/Supabase/schema/migration/typegen/package changes, commit, or push occurred.
- The shell-wrapper false-pass issue is correctly identified and must be fixed in the corrected retry smoke by checking the `tsx` exit code and printing a pass marker only after successful import completion.
- Adding `server-only` through a future package-addition phase is the correct recovery path.
- Because `server-only` is imported by application/server source modules, Gemini confirmed it should be treated as a normal `dependencies` entry, not a dev-only dependency.
- Future package-addition implementation must be limited to `package.json` and `package-lock.json`.
- A corrected helper import smoke retry must happen only after the `server-only` package addition is committed and pushed.
- Live staging remains blocked until a successful corrected helper import smoke, Gemini review, and a separate retry approval gate.

Commit approval is limited to this documentation update. No package install, package.json edit, package-lock edit, node_modules modification, helper import retry, live-staging command, Supabase query, target selection, extraction run, staging write, fixture creation, status transition, cleanup mutation, public publishing, `approve_for_draft`, or candidate decision may proceed from Phase 22AL-U-R.

## Next recommended phase after approval, commit, and push

Phase 22AL-U-S — `server-only` Package Addition Implementation.

Phase 22AL-U-S must not run until James gives the exact approval phrase after Phase 22AL-U-R has been reviewed, committed, and pushed.
