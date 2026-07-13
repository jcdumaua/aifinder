# AiFinder Phase 26BK — Revision CDXLI — GAP-060–GAP-062 Candidate Patch Diff Plan

## Planned future change scope

Exactly one existing file:

- `scripts/discovery-gap-060-062-read-only-metadata-check-candidate.sh`

No documentation, package, lockfile, source, schema, migration, type-generation, or configuration file may be changed in the patch-application phase unless separately reviewed.

## Planned edit regions

1. Replace the execution-baseline placeholder.
2. Replace the timeout placeholder.
3. Replace the adapter-label placeholder check.
4. Add exact token-reference presence checking without reading or printing neighboring environment variables.
5. Add exact project-selector and optional team-selector presence checks.
6. Replace the unconditional `NO_PLATFORM_COMMAND_SELECTED` stop with the reviewed single-request adapter block.
7. Add the strict local parser.
8. Preserve the final normalized output and original exit status.

## Mode and execution invariants

- File mode before patch: `100644`
- File mode after patch: `100644`
- Execute permission before patch: `NO`
- Execute permission after patch: `NO`
- Candidate execution during patch phase: `0`
- API requests during patch phase: `0`

## Patch rejection rules

Reject the patch if it:

- Adds more than one request.
- Adds retries.
- Allows redirects.
- Adds a request body.
- Enumerates environment variables.
- Prints token or selector values.
- Prints raw response data.
- Adds mutation-capable methods.
- Changes file mode.
- Removes the repository identity checks.
- Broadens output fields.
- Adds fallback targets or selector discovery.

## Result

`ONE_FILE_STATIC_PATCH_PLAN_DEFINED_NO_PATCH_APPLIED`
