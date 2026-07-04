# Phase 25D — Next Safe Documentation / Planning Gate

## Status

Drafted for Gemini review.

## Phase purpose

Phase 25D selects the next safe Discovery Engine lane after the Phase 25C current-state map and risk register.

The purpose is to keep re-entry controlled by choosing a documentation-only planning gate before any executable runtime verification, live database read, mutation, extraction, crawler execution, candidate decision, or public publishing step.

## Boundary

Allowed in Phase 25D:

- Create this documentation file.
- Read repository files and git metadata.
- Convert the Phase 25C recommendation into a bounded next-phase plan.
- Define the future verification target at a planning level.
- Prepare a Gemini review package.

Forbidden in Phase 25D:

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
- No public `tools` writes.
- No `discovered_tools` writes.
- No commit until Gemini review and explicit James approval.
- No push until a committed phase receives explicit James approval.

## Baseline terminal context

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Baseline HEAD at doc creation: `70acfa5`
- Baseline subject: `Document Discovery Engine current-state map risk register`
- Synchronized with `origin/main`: yes
- Phase 25C status: committed and pushed
- Discovery Engine status: documentation-only re-entry; not operationally reactivated

## Selected next-safe lane

Recommended selected lane:

**Read-Only Runtime Verification Gate Planning**

This option is safer than immediately implementing a runtime verifier because it preserves one more planning boundary after the Phase 25C map and risk register.

## Why this lane is next

Phase 25C concluded that the Discovery Engine is close to operational maturity but that the next safest work should be one bounded verification or planning step at a time.

A read-only runtime verification plan is the correct next step because it can define exactly what a future script may inspect without authorizing:

- live database reads;
- database mutation;
- candidate decision execution;
- candidate approval or rejection;
- extraction or LLM execution;
- crawler or evidence acquisition;
- public publishing.

## Future Phase 25E target

Recommended next phase after Phase 25D:

**Phase 25E — Read-Only Runtime Verification Script Planning**

Purpose:

- Design a future script that verifies repository-level Discovery Engine runtime readiness without accessing live data.
- Define exact file-level, route-level, helper-level, and test-level assertions.
- Define expected output, failure behavior, clipboard behavior, and progress reporting.
- Preserve strict non-operational boundaries.

Phase 25E should still be documentation-only.

## Future verifier scope candidates

A future verifier may inspect only local repository state, such as:

- Discovery Engine documentation presence.
- Discovery-related testing scripts.
- `lib/discovery` helper files.
- Admin discovery API route files.
- Known opt-in execution markers.
- Package script names without executing mutation-capable or opt-in smoke commands.
- Static file existence and static text markers.

The future verifier must not:

- connect to Supabase;
- invoke admin discovery API routes;
- run live smoke tests;
- set `AIFINDER_RUN_DISCOVERY_*` environment variables;
- run extraction, crawler, acquisition, candidate staging, candidate queue mutation, candidate decision, or public publishing commands;
- write source, API, UI, schema, migration, generated type, package, or lockfile changes.

## Planning questions for Gemini

Gemini should review whether:

1. Phase 25D correctly chooses a documentation-only planning gate before any executable runtime verification.
2. The selected Phase 25E target is safer than implementing a verifier immediately.
3. The future verifier scope stays repository-local and avoids live DB/API/crawler/extraction/candidate/publishing operations.
4. The lane sequencing preserves the Phase 25C risk register.
5. This Phase 25D document is safe to commit as documentation-only after James approval.

## Risk controls carried forward from Phase 25C

| Risk control | Phase 25D handling |
|---|---|
| Do not stack on unpushed commits | Phase 25D starts from synced `main...origin/main` at Phase 25C commit |
| Keep docs-only scope isolated | Phase 25D creates only this documentation file |
| Prevent accidental operational reactivation | No runtime script implementation in Phase 25D |
| Preserve candidate decision sensitivity | No candidate UUID, no decision command, no approval phrase |
| Preserve DB safety | No live DB read, no DB mutation, no Supabase SQL |
| Preserve public publishing boundary | No public `tools` or `discovered_tools` writes |
| Preserve package safety | No package or lockfile changes |
| Preserve commit/push gates | Commit and push remain separate explicit gates |

## Phase 25D recommendation

Commit Phase 25D only after Gemini confirms that:

- documentation-only scope is preserved;
- the next selected lane is appropriate;
- Phase 25E should remain planning-only;
- no wording accidentally authorizes execution.

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25D drafting.

Reason:

Phase 25D improves sequencing discipline and re-entry safety, but it does not add a new runtime capability, execute a verification script, perform a live smoke test, mutate data, or publish public tools.

## Review checklist

Before commit, verify:

- [ ] Gemini approves the Phase 25D next-safe planning gate.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes if allowed by the local environment.
- [ ] No package or lockfile changed.
- [ ] No source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
