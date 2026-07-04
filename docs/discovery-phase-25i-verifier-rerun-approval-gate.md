# Phase 25I — Verifier Re-Run Approval Gate

## Status

Drafted for Gemini review.

## Phase purpose

Phase 25I defines the approval contract for a future rerun of the already-committed Phase 25F read-only runtime verifier.

This phase is documentation-only. It does not rerun the verifier. It defines the exact command, expected safe conditions, expected output, failure handling, and boundaries for the next execution phase.

## Boundary

Allowed in Phase 25I:

- Create this documentation file.
- Read repository files and git metadata.
- Statically confirm the Phase 25F verifier file exists and remains unchanged.
- Define the future verifier rerun command.
- Define future rerun preconditions and expected output.
- Define failure handling for a future rerun.
- Prepare a Gemini review package.

Forbidden in Phase 25I:

- No verifier changes.
- No verifier execution.
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
- Phase 25I baseline HEAD at doc creation: `937b80b`
- Phase 25I baseline subject: `Document Phase 25H verifier baseline result`
- Synchronized with `origin/main`: yes
- Phase 25F status: verifier implemented, committed, and pushed
- Phase 25G status: post-implementation review committed and pushed
- Phase 25H status: baseline result documentation committed and pushed
- Discovery Engine status: repository-local verifier exists; Discovery Engine is not operationally reactivated

## Verifier artifact

The verifier targeted by the future rerun is:

`testing/discovery-read-only-runtime-verification.mjs`

The verifier was introduced in:

- Commit: `5bc38ca`
- Subject: `Add Discovery read-only runtime verifier`

Phase 25I does not modify or execute this file.

## Future rerun phase

The future execution phase should be:

**Phase 25J — Verifier Re-Run Execution Gate**

Phase 25J should run the already-committed verifier from a clean synced `main` branch after Phase 25I is committed and pushed.

Phase 25J must remain repository-local and read-only.

## Exact future rerun command

The exact command for the future Phase 25J rerun should be:

```bash
node testing/discovery-read-only-runtime-verification.mjs
```

No `AIFINDER_RUN_DISCOVERY_*` environment variable should be set.

No local server should be started.

No admin API should be invoked.

No database command should be run.

## Future Phase 25J preconditions

Before running the verifier in Phase 25J, the execution script must verify:

1. Current working directory is `/Users/jamescarlodumaua/aifinder`.
2. Git origin is `https://github.com/jcdumaua/aifinder.git`.
3. Current branch is `main`.
4. `main` is clean and synchronized with `origin/main`.
5. The expected HEAD is the pushed Phase 25I commit.
6. Working tree is clean before execution.
7. `testing/discovery-read-only-runtime-verification.mjs` exists.
8. The verifier file is unchanged before execution.
9. No `AIFINDER_RUN_DISCOVERY_*` environment variable is set.
10. No package or lockfile changes exist.
11. No source/API/UI/schema/migration/typegen changes exist.

## Future Phase 25J allowed action

Only this command is allowed:

```bash
node testing/discovery-read-only-runtime-verification.mjs
```

The command is allowed only inside a Phase 25J script that also:

- logs all terminal output with `tee`;
- captures the verifier exit code;
- copies the verifier result package on success;
- copies raw terminal output on failure;
- exits with the original verifier success or failure code;
- does not commit;
- does not push.

## Expected success output

The future rerun must include the verifier success line:

```text
PASSED: Discovery read-only runtime verification completed safely.
```

Expected safe output should also include:

```text
terminal_workflow=repository_local_static_verifier
operational_mode=read_only
no_live_services=true
no_db_access=true
no_api_invocation=true
no_crawler_extraction_candidate_or_publishing_execution=true
```

The rerun should continue to report static inventory sections for:

- required documentation files;
- boundary marker checks;
- Discovery documentation inventory;
- Discovery testing script inventory;
- `lib/discovery` inventory;
- admin discovery API route inventory;
- opt-in marker inventory;
- package script static inventory;
- static risk warnings;
- overall Discovery Engine progress report.

## Expected failure handling

If the future verifier rerun fails, Phase 25J must:

- stop safely;
- copy the raw terminal output log to clipboard;
- leave the working tree unchanged;
- perform no commit;
- perform no push;
- perform no DB/API/crawler/extraction/candidate/public publishing operation;
- document the failure before any retry;
- require a separate recovery or correction gate before proceeding.

No automatic retry is allowed.

No cleanup mutation is allowed.

No reset, deletion, or overwrite is allowed unless explicitly approved in a separate recovery gate.

## What a future successful rerun would prove

A future successful rerun would prove repository-local facts at the time of the rerun, including:

- the repo identity remains correct;
- branch and HEAD expectations are met;
- working tree scope is clean;
- required documentation files exist;
- required boundary markers remain present;
- Discovery Engine local structure can still be inventoried safely;
- no `AIFINDER_RUN_DISCOVERY_*` environment variables are set during execution;
- static risk warnings and progress reporting still work.

## What a future successful rerun would not prove

Even if Phase 25J passes, it still would not prove:

- live database state;
- live Supabase permissions;
- RLS behavior;
- production schema freshness;
- production route behavior;
- crawler behavior;
- evidence acquisition behavior;
- extraction quality;
- LLM extraction behavior;
- candidate staging correctness;
- candidate queue mutation safety;
- candidate decision correctness;
- approve_for_draft behavior;
- public publishing readiness;
- public `tools` write readiness;
- `discovered_tools` write readiness;
- production deployment status.

## Crawler status clarification

AiFinder has crawler-related infrastructure and prior crawler/evidence acquisition phases, but Phase 25I does not activate, test, or validate crawler behavior.

For this gate:

- crawler-related files may exist in the repository;
- crawler execution remains blocked;
- evidence acquisition remains blocked;
- extraction remains blocked;
- the future Phase 25J verifier rerun still must not execute crawler behavior;
- no crawler readiness claim is made.

A future crawler readiness phase must be separately planned, reviewed, approved, executed, documented, committed, and pushed.

## Operational reactivation status

Operational reactivation remains blocked.

No Phase 25I or planned Phase 25J step authorizes:

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

## Recommended next safe phase

Recommended next phase:

**Phase 25J — Verifier Re-Run Execution Gate**

Purpose:

- Run the already-committed Phase 25F verifier once from clean synced `main`.
- Capture the full verifier output.
- Copy the verifier rerun result package to clipboard on success.
- Copy raw terminal output on failure.
- Do not commit.
- Do not push.

After Phase 25J, the next documentation phase should record the rerun result before any live readiness planning.

## Why Phase 25J should still not be operational work

Phase 25J would only rerun a repository-local static verifier. It would not be a live DB check, live API check, crawler check, extraction check, or candidate decision check.

Operational work should remain blocked until after:

1. Phase 25J verifier rerun execution;
2. Phase 25K verifier rerun result documentation;
3. a separate live-readiness risk review gate;
4. explicit approval for a narrowly scoped read-only live check.

## Risk controls carried forward

| Risk control | Phase 25I handling |
|---|---|
| Preserve docs-first sequencing | Defines the rerun contract before executing it |
| Avoid accidental execution | Does not run the verifier |
| Keep verifier integrity | No verifier changes |
| Keep docs-only scope isolated | Creates only this documentation file |
| Preserve DB safety | No direct DB access, no live DB reads, no DB mutation |
| Preserve admin API safety | No admin API invocation and no local server startup |
| Preserve candidate decision sensitivity | No candidate UUID, no decision command, no approve_for_draft |
| Preserve crawler/extraction boundary | No crawler, extraction, LLM, or evidence acquisition |
| Preserve public publishing boundary | No public tools or discovered_tools writes |
| Preserve package safety | No package, lockfile, or package script changes |
| Preserve commit/push gates | Commit and push remain separate explicit gates |
| Preserve failure discipline | No automatic retry and no cleanup mutation |

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25I drafting.

Reason:

Phase 25I defines the future safe rerun contract but does not execute the verifier, add runtime capability, perform live checks, mutate data, or publish public tools.

## Review questions for Gemini

Gemini should review whether:

1. Phase 25I correctly remains docs-only and does not execute the verifier.
2. The future Phase 25J rerun command and preconditions are safe and complete.
3. The expected success output and failure handling are appropriate.
4. The crawler status clarification is accurate and safely bounded.
5. Operational reactivation remains blocked.
6. Phase 25J is the safest next phase.
7. This Phase 25I document is safe to commit as documentation-only after James approval.

## Review checklist

Before commit, verify:

- [ ] Gemini approves the Phase 25I verifier rerun approval gate.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes if allowed by the local environment.
- [ ] No package or lockfile changed.
- [ ] No verifier/source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
