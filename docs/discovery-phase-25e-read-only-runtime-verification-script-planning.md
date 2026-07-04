# Phase 25E — Read-Only Runtime Verification Script Planning

## Status

Drafted for Gemini review.

## Phase purpose

Phase 25E designs a future read-only runtime verification script for the Discovery Engine without implementing that script.

This phase converts the Phase 25D selected lane into an exact planning contract for a future repository-local verifier. The future verifier should help confirm local Discovery Engine structure, guardrails, and readiness signals without operationally reactivating the Discovery Engine.

## Boundary

Allowed in Phase 25E:

- Create this documentation file.
- Read repository files and git metadata.
- Define the future verifier purpose, allowed assertions, forbidden operations, output contract, and failure behavior.
- Prepare a Gemini review package.

Forbidden in Phase 25E:

- No runtime verifier implementation.
- No executable script changes.
- No source changes.
- No API changes.
- No UI changes.
- No package or lockfile changes.
- No schema, migration, or type generation changes.
- No direct database access.
- No live database reads.
- No DB mutation.
- No candidate decision execution.
- No approve_for_draft.
- No candidate UUID targeting.
- No extraction execution.
- No crawler execution.
- No LLM extraction execution.
- No evidence acquisition.
- No public tools writes.
- No discovered_tools writes.
- No commit until Gemini review and explicit James approval.
- No push until a committed phase receives explicit James approval.

## Baseline terminal context

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Baseline HEAD at doc creation: `7d51f3f`
- Baseline subject: `Document Phase 25D next-safe planning gate`
- Synchronized with `origin/main`: yes
- Phase 25D status: committed and pushed
- Discovery Engine status: documentation-only re-entry; not operationally reactivated

## Future Phase 25F target

Recommended next phase after Phase 25E:

**Phase 25F — Read-Only Runtime Verification Script Implementation**

Phase 25F should implement a local repository verifier only if Phase 25E is approved and committed.

The future Phase 25F verifier should remain non-operational. It should not connect to live services, call admin routes, set opt-in execution environment variables, execute smoke tests, mutate data, or publish tools.

## Future verifier purpose

The future verifier should answer this question:

Can the local repository prove that the Discovery Engine has the expected documented structure, static guardrails, and re-entry controls before any future operational phase is considered?

It should not answer:

- whether the live database contains expected rows;
- whether live Supabase permissions are correct;
- whether crawler or extraction flows work against live targets;
- whether candidate decisions can execute;
- whether public publishing is ready.

Those questions require separate future phases.

## Future verifier allowed inspection categories

The future verifier may inspect local repository state only.

Allowed categories:

1. Git and repo identity

   - Verify repo path.
   - Verify origin URL.
   - Verify branch.
   - Verify expected HEAD.
   - Verify ahead/behind state.
   - Verify clean working tree unless a specific expected artifact is allowed.

2. Documentation presence

   - Verify Phase 25A through Phase 25E documentation files exist where expected.
   - Verify current-state and planning docs contain required boundary markers.
   - Verify no future phase wording accidentally authorizes operational execution.

3. Local testing script inventory

   - List Discovery Engine testing scripts.
   - Verify read-only script names are distinguishable from smoke or mutation-capable scripts.
   - Verify opt-in smoke scripts are not executed.

4. Discovery helper inventory

   - List `lib/discovery` files.
   - Verify expected helper files exist at a static path level.
   - Avoid importing helpers if imports could initialize environment or service clients.

5. Admin discovery API route inventory

   - List admin discovery route files.
   - Verify route files exist at a static path level.
   - Do not invoke route handlers.
   - Do not start a local server.

6. Opt-in execution marker inventory

   - Search for `AIFINDER_RUN_DISCOVERY_*` markers.
   - Print marker names.
   - Verify the verifier itself does not set any of those markers.

7. Package script static inventory

   - Read `package.json` as local text.
   - List relevant Discovery Engine script names if present.
   - Do not run mutation-capable scripts.
   - Do not run live smoke scripts.
   - Do not install packages.

## Future verifier forbidden operations

The future verifier must not:

- connect to Supabase;
- run Supabase SQL;
- run `supabase db push`;
- regenerate Supabase types;
- invoke admin discovery API routes;
- start a local web server;
- call production or preview URLs;
- run live smoke tests;
- set `AIFINDER_RUN_DISCOVERY_*` environment variables;
- run crawler execution;
- run extraction execution;
- run LLM extraction;
- acquire external evidence;
- stage candidates;
- mutate candidate queue rows;
- execute candidate decisions;
- run approve_for_draft;
- write to public tools;
- write to discovered_tools;
- change source, API, UI, schema, migration, generated type, package, or lockfile files.

## Future verifier output contract

The future verifier should print:

- terminal workflow summary;
- explicit boundary;
- repo identity check;
- expected HEAD check;
- branch sync check;
- working tree check;
- documentation inventory;
- testing script inventory;
- `lib/discovery` inventory;
- admin discovery API route inventory;
- opt-in marker inventory;
- package script static inventory;
- static risk warnings;
- final PASSED or FAILED line;
- overall Discovery Engine progress report.

The future verifier should create a review package on success when a review package is useful.

On failure, it should copy the raw terminal output log to clipboard.

## Future verifier implementation constraints

The future Phase 25F implementation script should follow the AiFinder terminal workflow:

1. Run the main script work inside a main function.
2. Save all terminal output with tee to `/tmp/aifinder-<phase>-<task>-<timestamp>.log`.
3. Capture the original script success/failure code from PIPESTATUS[0].
4. Always copy output to clipboard:
   - success: copy the review package when one exists;
   - failure: copy raw terminal output log.
5. Exit with the original success/failure code.
6. After successful phase work, print an overall Discovery Engine progress report:
   - controlled build sequence status;
   - current Phase re-entry progress;
   - operational reactivation progress;
   - next recommended phase.
7. Provide the generated script as a downloadable `.sh` file.

## Proposed future file path

Recommended future implementation file:

`testing/discovery-read-only-runtime-verification.mjs`

Reason:

- It keeps the verifier with other local Discovery Engine testing/verification scripts.
- It distinguishes the verifier from docs-only phases.
- It avoids modifying source, API, UI, schema, migration, or package files.

Phase 25F should not add a package script unless separately approved.

## Proposed future command

Recommended future command:

```bash
node testing/discovery-read-only-runtime-verification.mjs
```

This command should remain local and read-only.

The script should fail if any required opt-in execution variable is already set in the shell environment, including any variable matching:

```text
AIFINDER_RUN_DISCOVERY_*
```

## Failure behavior

The future verifier should fail closed if:

- the repo path is wrong;
- origin URL is wrong;
- branch is not `main`;
- expected HEAD does not match the approved baseline;
- branch is ahead or behind unexpectedly;
- working tree is dirty unexpectedly;
- required documentation files are missing;
- required boundary markers are missing;
- package or lockfile changes exist;
- any `AIFINDER_RUN_DISCOVERY_*` environment variable is set;
- any implementation scope would require live DB, API, crawler, extraction, candidate, or publishing operations.

## Review questions for Gemini

Gemini should review whether:

1. Phase 25E correctly remains documentation-only and does not implement the verifier.
2. The proposed Phase 25F verifier scope is repository-local and non-operational.
3. The allowed inspection categories are useful without creating live-service risk.
4. The forbidden operations are complete enough to prevent accidental Discovery Engine reactivation.
5. The proposed output contract and failure behavior match the AiFinder terminal workflow.
6. The future file path and command are appropriate.
7. Phase 25E is safe to commit as documentation-only after James approval.

## Risk controls carried forward

| Risk control | Phase 25E handling |
|---|---|
| Do not stack on unpushed commits | Phase 25E starts from synced `main...origin/main` at Phase 25D commit |
| Keep docs-only scope isolated | Phase 25E creates only this documentation file |
| Prevent accidental operational reactivation | No verifier implementation in Phase 25E |
| Preserve DB safety | Future verifier is repository-local only |
| Preserve candidate decision sensitivity | No candidate UUID, no decision command, no approve_for_draft |
| Preserve crawler/extraction boundary | Future verifier does not crawl, extract, use LLMs, or acquire evidence |
| Preserve public publishing boundary | No public tools or discovered_tools writes |
| Preserve package safety | No package or lockfile changes; no package script without separate approval |
| Preserve commit/push gates | Commit and push remain separate explicit gates |

## Phase 25E recommendation

Commit Phase 25E only after Gemini confirms that:

- documentation-only scope is preserved;
- the future verifier is strictly repository-local;
- the proposed Phase 25F implementation path is safe;
- no wording accidentally authorizes live DB/API/crawler/extraction/candidate/publishing execution.

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25E drafting.

Reason:

Phase 25E improves verification design and operational discipline, but it does not add runtime capability, execute verification, perform a live smoke test, mutate data, or publish public tools.

## Review checklist

Before commit, verify:

- [ ] Gemini approves the Phase 25E read-only runtime verifier planning gate.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes if allowed by the local environment.
- [ ] No package or lockfile changed.
- [ ] No source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
