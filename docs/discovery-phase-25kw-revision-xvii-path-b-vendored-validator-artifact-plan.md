# AiFinder Phase 25KW — Revision XVII Path B Vendored-Validator Artifact Plan

## Identity

- Phase: `25KW`
- State: `PENDING_GEMINI_PATH_B_PLAN_REVIEW`
- Repository baseline: `ded0fec5d2d788ba41a792bf7d2208e06fae56f6`
- Phase 25KV artifact SHA-256: `c4a9a0bc122b54617ae228d4264843ac2109b8376c7b6b1f999bf9d568654e7b`
- Phase 25KV result: `NO_QUALIFIED_EXISTING_HOST_VALIDATOR_CANDIDATE`
- Path A status: `CLOSED`
- Path B status: `PLANNING_ONLY`
- Python syntax-preflight planning: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Objective

Define a fail-closed planning chain for selecting, verifying, packaging, and using an offline JSON Schema validator artifact without installing host packages, changing application dependencies, using network resolution during validation, or introducing ambient runtime behavior.

## Non-authorization statement

Phase 25KW does not select a validator version, download a package, vendor files, modify metadata packages, import a validator, run schema validation, rerun Phase 25KT, or authorize Python syntax-preflight planning.

## Path B architecture

The vendored-validator path must separate five concerns:

1. Source selection and provenance.
2. License and redistribution review.
3. Dependency and file-inventory closure.
4. Deterministic artifact construction.
5. Isolated offline execution binding.

No later phase may combine these concerns into an unreviewed single operation.

## Source-selection requirements

A future selection phase must identify exactly one candidate release and record:

- canonical project name;
- exact release version;
- canonical upstream source location;
- release publication identity;
- expected archive filename;
- expected archive SHA-256;
- expected archive byte count;
- package format;
- Python-version compatibility;
- JSON Schema draft support;
- declared runtime dependencies;
- declared optional dependencies;
- license identifier;
- license file identity;
- known native-extension presence or absence;
- build-system requirements;
- install-hook presence or absence;
- telemetry or network behavior declarations.

The selected source must come from a canonical upstream publisher or an explicitly reviewed official distribution channel. Mirrors, reposts, repackaged archives, and mutable “latest” URLs are forbidden.

## License review requirements

Before any artifact is accepted:

1. The validator license must be identified exactly.
2. Every bundled runtime dependency license must be identified exactly.
3. License texts must be preserved in the review package.
4. Redistribution, modification, notice, and attribution obligations must be documented.
5. Incompatible, ambiguous, missing, or non-redistributable licensing fails closed.
6. The repository artifact plan must not imply legal approval beyond the recorded evidence.

## Dependency closure requirements

The vendored artifact must include only the minimum runtime files required for the approved validation operation.

A future dependency-closure gate must:

- identify all direct runtime dependencies;
- resolve all transitive runtime dependencies;
- reject undeclared dynamic imports;
- reject native binaries unless separately approved;
- reject install-time generated files;
- reject package-manager metadata that is not required at runtime;
- reject tests, benchmarks, caches, compiled bytecode, documentation bundles, and development-only files unless explicitly justified;
- produce an exhaustive retained-file ledger;
- produce an exhaustive excluded-file ledger with reasons;
- prove that every retained file belongs to the selected validator or an approved runtime dependency;
- prove that no external module is required outside the vendored artifact and Python standard library.

## Artifact structure

The future vendored-validator artifact must be a deterministic archive created outside the repository.

Required top-level contents:

- `manifest.json`
- `provenance.json`
- `licenses/`
- `runtime/`
- `file-ledger.json`
- `dependency-ledger.json`
- `exclusions-ledger.json`
- `README-INERT.txt`

The artifact must not contain:

- symlinks;
- hard links;
- absolute paths;
- traversal paths;
- device files;
- sockets;
- native executables;
- shell scripts;
- package-manager commands;
- installer entry points;
- activation scripts;
- `.env` files;
- compiled Python bytecode;
- generated AiFinder modules;
- application code;
- credentials or configuration values.

## Deterministic construction rules

A future construction gate must:

- use normalized relative paths;
- use stable lexical member ordering;
- normalize timestamps;
- normalize file modes;
- preserve exact source bytes for retained files;
- generate canonical JSON ledgers;
- reject duplicate archive members;
- reject case-fold collisions;
- reject Unicode-normalization collisions;
- produce exact archive SHA-256 and byte count;
- reconstruct twice independently and require identical archive bytes.

## Offline execution model

The future execution gate may use the vendored artifact only after approval and must:

1. Verify archive SHA-256 and byte count before opening.
2. Extract only into a new mode-0700 `/tmp` workspace.
3. Write extracted files mode 0600 unless execute permission is explicitly required and approved.
4. Reject links, traversal, duplicate names, and unexpected members.
5. Bind Python import resolution only to the extracted `runtime/` directory.
6. Invoke Python in isolated mode with user-site disabled.
7. Clear proxy and package-index environment variables from the child process without printing their values.
8. Disable network schema resolution.
9. Disable ambient filesystem schema discovery.
10. Import only the approved validator and declared runtime dependencies.
11. Keep generated AiFinder modules unmaterialized and unimported.
12. Delete the external scratch workspace after review evidence is preserved.

## Repository placement rule

The vendored validator archive itself must not enter the repository during planning, selection, provenance review, license review, dependency closure, or construction review.

A later explicit repository-placement gate would be required before any binary or archive artifact could be added. That future gate must separately justify:

- repository location;
- file-size impact;
- reviewability;
- Git history cost;
- update and revocation process;
- supply-chain risk;
- whether an external digest-pinned artifact store is safer.

No repository placement is authorized by Phase 25KW.

## Planned successor phases

### Phase 25KX — Candidate selection planning

Documentation-only planning for:

- candidate release criteria;
- canonical source constraints;
- supported JSON Schema draft requirements;
- Python compatibility;
- native-code prohibition;
- license evidence;
- dependency closure evidence.

### Phase 25KY — Candidate source and provenance inventory

Read-only public-source evidence gathering only after explicit approval. No download or retention of package payloads.

### Phase 25KZ — License and dependency closure planning

Documentation-only plan for exact license, retained-file, dependency, and exclusion ledgers.

### Later phases

Only after separate approvals:

- exact source-artifact acquisition;
- source-artifact digest verification;
- license review;
- dependency closure;
- deterministic vendored-artifact construction;
- fresh static review;
- isolated execution preflight;
- Phase 25KT-equivalent rerun.

## Candidate rejection rules

A candidate must be rejected if any of the following applies:

- mutable or unofficial source;
- missing exact release identity;
- missing archive digest;
- incompatible Python version;
- inadequate JSON Schema draft support;
- ambiguous or incompatible licensing;
- unresolved dependency;
- native extension or binary dependency without separate approval;
- install hook, build requirement, or dynamic dependency resolution;
- network dependency;
- telemetry not provably disabled;
- inability to produce a complete deterministic file ledger;
- inability to run from isolated scratch space;
- requirement to modify repository dependency files or host package state.

## Required total-pass condition

Path B does not unlock Python syntax-preflight planning by itself.

After exact candidate approval and isolated artifact verification, a complete package-and-catalog preflight rerun must return:

`PASSED_PACKAGE_AND_CATALOG_PREFLIGHT_READY_FOR_SYNTAX_PLANNING`

Any other state keeps all downstream operations blocked.

## Explicit exclusions

Phase 25KW does not:

- browse or query public package registries;
- select a validator release;
- download or retain package payloads;
- create or modify a vendored artifact;
- inspect package contents;
- review licenses;
- resolve dependencies;
- install packages;
- create virtual environments;
- import validators;
- run schema validation;
- rerun Phase 25KT;
- run Python syntax validation;
- materialize or execute generated modules;
- modify application dependencies, package files, or lockfiles;
- stage, commit, or push;
- access databases or external services;
- deploy, publish, or reactivate operations.

## Required successor sequence

1. Gemini reviews this Phase 25KW plan.
2. Commit exactly one Phase 25KW Markdown planning artifact after approval.
3. Begin Phase 25KX candidate-selection planning.
4. Review and commit Phase 25KX before any public-source inventory.
5. Gather provenance evidence only in a separately approved read-only phase.
6. Keep all package acquisition and artifact construction blocked until their own gates.
7. Keep Python syntax-preflight planning blocked until the required total-pass state is achieved.

## Required Gemini decision

- `APPROVED — PATH B VENDORED-VALIDATOR PLAN`
- `APPROVED WITH REQUIRED CORRECTIONS`
- `REVISION REQUIRED`
- `REJECTED`

State whether exactly this Phase 25KW planning artifact may be committed and whether Phase 25KX candidate-selection planning may begin after synchronization.

## System layer progress report

- Phase 25KV host-validator inventory: 100%
- Phase 25KV result review and commit: 100%
- Phase 25KW Path B vendored-validator planning: 100%
- Phase 25KW Gemini planning review: pending
- Phase 25KX candidate-selection planning: 0%
- Vendored artifact acquisition: 0%
- Vendored artifact construction: 0%
- Phase 25KT-equivalent rerun: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
