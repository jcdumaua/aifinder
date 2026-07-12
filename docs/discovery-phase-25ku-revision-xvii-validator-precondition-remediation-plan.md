# AiFinder Phase 25KU — Revision XVII Validator Precondition Remediation Plan

## Identity

- Phase: `25KU`
- State: `PENDING_GEMINI_REMEDIATION_PLAN_REVIEW`
- Repository baseline: `e4cf82dfdae1c4c4b67e5ad86cb6957460e8ce74`
- Phase 25KT artifact SHA-256: `12e16aba4a1c80b4290a751278abdde897c51889fea78ebc93739f048261f913`
- Phase 25KT result: `FAILED_SCHEMA_CATALOG_PREFLIGHT`
- Precondition failure: `VALIDATOR_PRECONDITION_UNSATISFIED: PackageNotFoundError: jsonschema`
- Python syntax-preflight planning: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Objective

Define a fail-closed remediation sequence for satisfying the approved local JSON Schema validator precondition without weakening isolation, installing dependencies implicitly, fetching packages during validation, or introducing handwritten schema-validation logic.

## Current condition

The approved Phase 25KT execution gate used:

`/Library/Developer/CommandLineTools/usr/bin/python3`

That runtime could not resolve an installed `jsonschema` distribution. The package-and-catalog preflight therefore stopped before schema and class-catalog validation. The fail-closed result was correct and must be preserved as historical evidence.

## Approved remediation paths

Exactly one remediation path may eventually be selected after static evidence review.

### Path A — Existing host-runtime qualification

Use a Python runtime already present on the host only when a later inventory gate proves all of the following without installing or modifying anything:

1. The runtime is located at an explicit absolute path.
2. The runtime version is recorded.
3. The `jsonschema` distribution is already installed.
4. The exact `jsonschema` version is recorded.
5. The distribution files can be enumerated locally.
6. A deterministic SHA-256 ledger can be generated for the installed distribution files.
7. The runtime does not require network access to resolve schemas.
8. The runtime can be invoked in isolated mode.
9. No repository file, shell profile, global package registry, or interpreter configuration is changed.
10. The later Phase 25KT-equivalent rerun binds to the exact runtime path, runtime version, validator version, and distribution-file ledger.

### Path B — Approved vendored validator artifact

Use a separately reviewed validator package only when a later planning and authoring chain proves all of the following before any use:

1. The source artifact and provenance are documented.
2. The artifact has an exact SHA-256 and byte count.
3. Its license and included dependencies are documented.
4. Its complete file inventory is reviewed.
5. No native extension, install hook, build step, network fetch, telemetry, or dynamic dependency resolution is required.
6. Extraction occurs only in private external scratch space.
7. The validator is imported only by the preflight engine, never by generated modules.
8. The artifact is not added to application dependencies, package manifests, lockfiles, or production deployment configuration.
9. Schema resolution remains closed, offline, and digest-bound.
10. Gemini approves the exact vendored artifact before execution.

## Preferred order

Path A must be evaluated first because it can satisfy the precondition without adding a new artifact or changing dependency state.

Path B may be considered only if no existing host runtime can be qualified under the full fail-closed criteria.

This preference is not authorization to execute either path.

## Phase 25KV planned scope

A later Phase 25KV host-validator inventory gate may perform read-only host inspection limited to:

- Enumerating explicit Python 3 executable paths from approved fixed locations and `command -v`.
- Recording interpreter path and version.
- Checking whether `jsonschema` metadata is locally resolvable.
- Recording the installed validator version.
- Enumerating the local distribution files through metadata only.
- Hashing only files belonging to the resolved validator distribution and its explicitly declared local dependencies.
- Recording whether isolated invocation is supported.
- Producing exactly one untracked Markdown inventory result.

The inventory gate must not:

- run `pip install`, `pip download`, `brew install`, or any package-manager mutation;
- create or modify a virtual environment;
- change `PATH`, shell startup files, Python configuration, or global package state;
- access package indexes or other network services;
- import generated AiFinder modules;
- open environment files or print environment values;
- run schema validation;
- rerun Phase 25KT;
- run Python syntax validation;
- stage, commit, or push.

## Candidate classification

Each discovered runtime must be classified as exactly one of:

- `QUALIFIED_EXISTING_HOST_VALIDATOR_CANDIDATE`
- `BLOCKED_VALIDATOR_NOT_INSTALLED`
- `BLOCKED_VALIDATOR_VERSION_UNRESOLVED`
- `BLOCKED_DISTRIBUTION_FILES_UNRESOLVED`
- `BLOCKED_DISTRIBUTION_LEDGER_INCOMPLETE`
- `BLOCKED_ISOLATED_INVOCATION_UNAVAILABLE`
- `BLOCKED_UNAPPROVED_RUNTIME_LOCATION`

No candidate may be selected automatically. Gemini review and explicit user approval remain required.

## Required evidence for a qualified candidate

A qualified host-runtime candidate record must include:

- absolute interpreter path;
- interpreter version;
- validator distribution name;
- validator version;
- distribution root or roots;
- complete in-scope file count;
- deterministic file-ledger SHA-256;
- declared direct dependency names and locally resolved versions;
- isolated-mode command shape;
- network boundary statement;
- repository-preservation statement;
- no-install/no-mutation statement.

## Successor decision rules

If Phase 25KV identifies one or more qualified candidates:

1. Gemini reviews the inventory result.
2. Exactly one candidate may be selected in a separate planning gate.
3. A later execution gate may bind the preflight to that exact candidate.
4. Phase 25KT-equivalent validation must be rerun from the original approved corrected package.
5. Python syntax-preflight planning remains blocked until the rerun returns:

`PASSED_PACKAGE_AND_CATALOG_PREFLIGHT_READY_FOR_SYNTAX_PLANNING`

If Phase 25KV identifies no qualified candidate:

1. Commit the fail-closed inventory result after approval.
2. Begin a separate vendored-validator artifact planning chain.
3. Do not install or download anything during the inventory phase.

## Explicit exclusions

Phase 25KU does not:

- enumerate host runtimes;
- resolve or import `jsonschema`;
- inspect distribution files;
- install, download, upgrade, or vendor packages;
- create a virtual environment;
- run JSON Schema validation;
- rerun Phase 25KT;
- run Python syntax validation;
- materialize, import, or execute generated modules;
- modify repository application files;
- stage, commit, or push;
- access databases or external services;
- deploy, publish, or reactivate operations.

## Required successor sequence

1. Gemini reviews this Phase 25KU remediation plan.
2. Commit exactly one Phase 25KU Markdown planning artifact after approval.
3. Phase 25KV authors and runs the read-only host-validator inventory gate.
4. Gemini reviews the Phase 25KV result.
5. Commit the inventory result only after approval.
6. Select a validator candidate only through a separate reviewed planning gate.
7. Rerun the package-and-catalog preflight only after exact candidate approval.
8. Keep Python syntax-preflight planning blocked until the required total-pass state is achieved.

## Required Gemini decision

- `APPROVED — VALIDATOR REMEDIATION PLAN`
- `APPROVED WITH REQUIRED CORRECTIONS`
- `REVISION REQUIRED`
- `REJECTED`

State whether exactly this Phase 25KU planning artifact may be committed and whether Phase 25KV read-only host-validator inventory authoring may begin after synchronization.

## System layer progress report

- Phase 25KT package-and-catalog preflight execution: 100%
- Phase 25KT result review and commit: 100%
- Phase 25KU validator remediation planning: 100%
- Phase 25KU Gemini planning review: pending
- Phase 25KV host-validator inventory: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
