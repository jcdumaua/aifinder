# Phase 25J-R — Verifier Re-Run Failure Documentation / Repair Planning Gate

## Status

Drafted for Gemini review.

## Phase purpose

Phase 25J-R documents the safe failure observed during Phase 25J and selects a repair path before any retry or verifier change.

Phase 25J did not fail because of a live-service operation. It failed because the repository-local verifier still contains fixed Phase 25E baseline expectations. The current rerun HEAD is Phase 25I, so the verifier correctly stopped with a non-zero exit code when its hardcoded HEAD expectation did not match the current repository state.

This phase is documentation-only. It does not rerun the verifier and does not modify the verifier.

## Boundary

Allowed in Phase 25J-R:

- Create this documentation file.
- Read repository files and git metadata.
- Statically confirm the Phase 25F verifier exists and remains unchanged.
- Document the Phase 25J failure.
- Document the root cause.
- Document repair options.
- Recommend the next safe repair phase.
- Prepare a Gemini review package.

Forbidden in Phase 25J-R:

- No verifier changes.
- No verifier execution.
- No retry.
- No source changes.
- No API changes.
- No UI changes.
- No package or lockfile changes.
- No package script changes.
- No schema, migration, or type generation changes.
- No direct database access.
- No live database reads.
- No DB mutation.
- No admin API invocation.
- No local server startup.
- No candidate decision execution.
- No approve_for_draft.
- No candidate UUID targeting.
- No extraction execution.
- No crawler execution.
- No LLM extraction execution.
- No evidence acquisition.
- No candidate staging.
- No public tools writes.
- No discovered_tools writes.
- No commit until Gemini review and explicit James approval.
- No push until a committed phase receives explicit James approval.

## Baseline terminal context

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Phase 25J-R baseline HEAD at doc creation: `8cd75f3`
- Phase 25J-R baseline subject: `Document Phase 25I verifier rerun approval gate`
- Synchronized with `origin/main`: yes
- Discovery Engine status: repository-local verifier exists; Discovery Engine is not operationally reactivated

## Phase 25J result

Phase 25J stopped safely.

The Phase 25J outer gate verified:

- repo identity;
- branch `main`;
- clean synced state at `8cd75f3`;
- clean working tree;
- verifier present and unchanged;
- no `AIFINDER_RUN_DISCOVERY_*` environment variables;
- package and lockfile guard;
- verifier safety markers.

The only command Phase 25J attempted was:

```bash
node testing/discovery-read-only-runtime-verification.mjs
```

The verifier exited with:

```text
verifier_exit_code=1
```

The Phase 25J wrapper stopped safely and copied the raw terminal output log.

## Failure summary

The verifier output showed the current repository state:

```text
head_short=8cd75f3
head_subject=Document Phase 25I verifier rerun approval gate
```

The verifier then reported:

```text
ERROR: Expected HEAD c7e89af.
ERROR: Expected HEAD subject Document Phase 25E runtime verifier planning.
```

The final verifier result was:

```text
FAILED: Discovery read-only runtime verification stopped safely.
```

The final Phase 25J wrapper result was:

```text
FAILED: Phase 25J verifier rerun execution gate stopped safely.
```

## Root cause

The Phase 25F verifier was implemented with fixed baseline expectations for the original Phase 25E implementation context:

- expected HEAD: `c7e89af`
- expected subject: `Document Phase 25E runtime verifier planning`

That design was correct for the initial Phase 25F implementation gate because the verifier was first intended to run while it was still the only untracked artifact on top of Phase 25E.

However, Phase 25J attempted to rerun the same committed verifier after later documentation phases were pushed:

- Phase 25F pushed the verifier.
- Phase 25G documented post-implementation review.
- Phase 25H documented the verifier baseline result.
- Phase 25I documented the verifier rerun approval gate.

Therefore, the current HEAD is correctly `8cd75f3`, not `c7e89af`.

The failure is a verifier baseline-design issue, not evidence of DB/API/crawler/extraction/candidate/public publishing activity.

## Safety assessment

Phase 25J preserved all safety boundaries:

- No verifier changes.
- No source/API/UI/schema/migration/typegen/package/lockfile changes.
- No package script changes.
- No direct DB access.
- No live DB reads.
- No DB mutation.
- No admin API invocation.
- No local server startup.
- No crawler execution.
- No extraction execution.
- No LLM extraction execution.
- No evidence acquisition.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public tools writes.
- No discovered_tools writes.
- No commit.
- No push.

The repository remained clean and synced before the verifier command.

## Important observation

The verifier still completed many safe static inspections before failing:

- required Phase 25A through Phase 25E docs were present;
- Phase 25C through Phase 25E boundary markers were present;
- Discovery documentation inventory was reported;
- Discovery test script inventory was reported;
- `lib/discovery` inventory was reported;
- admin discovery API route inventory was reported;
- opt-in marker inventory was reported;
- package discovery script inventory was reported;
- static risk warnings were emitted.

However, because the verifier exit code was non-zero, Phase 25J must be treated as failed and must not be recorded as a successful rerun.

## Repair options

### Option A — Update verifier baseline constants to current expected HEAD

This would update the verifier to expect the latest pushed planning commit before rerun.

Pros:

- Minimal change.
- Keeps strict HEAD expectation.

Cons:

- The verifier would need editing for every new documentation phase.
- This repeats the same rigidity that caused the Phase 25J rerun failure.
- It is not ideal for a reusable repository-local verifier.

### Option B — Add explicit configurable expected HEAD / subject inputs

This would allow the verifier to accept the expected HEAD and expected subject from environment variables or CLI flags while still failing closed when expectations are missing.

Pros:

- Preserves strict HEAD verification.
- Allows the verifier to be rerun after future committed phases.
- Avoids hardcoding a stale phase baseline.
- Keeps the verifier reusable while still controlled.

Cons:

- Requires a verifier implementation change.
- Requires a separate implementation planning and review gate.
- Requires careful guard design so it cannot be run loosely.

### Option C — Split immutable baseline verifier from reusable current-state verifier

This would preserve the Phase 25F verifier as a historical baseline tool and create a separate current-state verifier for re-entry checks.

Pros:

- Avoids changing the historical verifier.
- Keeps baseline evidence immutable.
- Allows future current-state checks to evolve separately.

Cons:

- Adds another verifier file.
- Requires more documentation and review.
- May duplicate logic.

## Recommended repair path

Choose **Option B — Add explicit configurable expected HEAD / subject inputs**.

Reason:

The Discovery Engine needs a verifier that can be rerun safely from future approved phases without editing hardcoded constants each time. Option B preserves strictness while making the expected baseline explicit in the execution gate.

The future verifier should fail closed unless:

- an expected HEAD is supplied;
- an expected subject is supplied;
- the current branch is `main`;
- the branch is clean and synced;
- no `AIFINDER_RUN_DISCOVERY_*` environment variables are set;
- no unexpected working tree changes exist;
- all safety markers and required files remain present.

## Recommended next safe phase

Recommended next phase:

**Phase 25K — Verifier Rerun Failure Result Documentation**

Purpose:

- Document the Phase 25J failed rerun result as an audit artifact.
- Confirm no operational reactivation occurred.
- Confirm no retry is allowed yet.
- Confirm Option B as the preferred repair path.

After Phase 25K, the safest implementation path is:

**Phase 25L — Configurable Verifier Expected HEAD/Subject Implementation Planning Gate**

Phase 25L should be docs-only and should define exactly how configurable expected HEAD and subject inputs will work before any verifier code change.

## Why not patch immediately

Do not patch the verifier immediately.

The failure was safe, but the verifier is a governance-critical tool. A verifier behavior change should follow the same planning, Gemini review, implementation, result documentation, commit, and push gates as the earlier phases.

## Crawler status clarification

Crawler-related infrastructure exists in the repository, but Phase 25J-R does not activate, test, or validate crawler behavior.

For this gate:

- crawler execution remains blocked;
- evidence acquisition remains blocked;
- extraction remains blocked;
- no crawler command is run;
- no crawler readiness claim is made.

## Operational reactivation status

Operational reactivation remains blocked.

No Phase 25J or Phase 25J-R step authorizes:

- direct DB access;
- live DB reads;
- DB mutation;
- admin API invocation;
- local server startup;
- crawler execution;
- extraction execution;
- LLM extraction execution;
- evidence acquisition;
- candidate staging;
- candidate decisions;
- approve_for_draft;
- public tools writes;
- discovered_tools writes.

## Risk controls carried forward

| Risk control | Phase 25J-R handling |
|---|---|
| Treat failed verifier as failed | Phase 25J is not recorded as a successful rerun |
| Avoid automatic retry | No retry occurs in Phase 25J-R |
| Avoid unreviewed patch | No verifier change occurs in Phase 25J-R |
| Preserve docs-first sequencing | Repair is documented before implementation planning |
| Preserve DB safety | No direct DB access, no live DB reads, no DB mutation |
| Preserve admin API safety | No admin API invocation and no local server startup |
| Preserve candidate decision sensitivity | No candidate UUID, no decision command, no approve_for_draft |
| Preserve crawler/extraction boundary | No crawler, extraction, LLM, or evidence acquisition |
| Preserve public publishing boundary | No public tools or discovered_tools writes |
| Preserve package safety | No package, lockfile, or package script changes |
| Preserve commit/push gates | Commit and push remain separate explicit gates |

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25J-R drafting.

Reason:

The Phase 25J failure exposed a verifier reuse issue, not an operational failure. The Discovery Engine remains structurally close to completion, but the re-entry verifier must be repaired before it can be used as a reusable current-state check.

## Review questions for Gemini

Gemini should review whether:

1. Phase 25J-R accurately documents the Phase 25J failure.
2. The root cause is correctly identified as stale hardcoded verifier baseline expectations.
3. The safety assessment is accurate.
4. Phase 25J is correctly treated as failed, not partially successful.
5. Option B is the safest repair path.
6. Phase 25K is the safest next phase before implementation planning.
7. This Phase 25J-R document is safe to commit as documentation-only after James approval.

## Review checklist

Before commit, verify:

- [ ] Gemini approves the Phase 25J-R failure documentation and repair planning gate.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes if allowed by the local environment.
- [ ] No package or lockfile changed.
- [ ] No verifier/source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
