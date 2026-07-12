# AiFinder Phase 25KX — Revision XVII Vendored-Validator Candidate-Selection Plan

## Identity

- Phase: `25KX`
- State: `PENDING_GEMINI_CANDIDATE_SELECTION_PLAN_REVIEW`
- Repository baseline: `e80add2c172851fcbbe6006b523248d1564384de`
- Phase 25KW artifact SHA-256: `31e71fd41707f9beb03d79af007b33d1ce20a7ac748ead1cd2e55a900f607607`
- Path A status: `CLOSED`
- Path B status: `CANDIDATE_SELECTION_PLANNING_ONLY`
- Candidate selected: `NO`
- Public-source inventory authorized: `NO`
- Package acquisition authorized: `NO`
- Python syntax-preflight planning: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Objective

Define the exact criteria, evidence fields, rejection rules, comparison method, and human approval sequence required to select one vendored JSON Schema validator release for later provenance inventory and dependency-closure work.

## Non-authorization statement

Phase 25KX does not browse package registries, query public sources, identify a current release, select a validator product, download archives, retain package payloads, inspect package contents, review licenses, resolve dependencies, construct artifacts, import validators, run schema validation, rerun Phase 25KT, or authorize Python syntax-preflight planning.

## Functional requirements

A candidate validator must support the exact validation operations required by the corrected Revision XVII metadata package:

- JSON Schema Draft 2020-12 validation.
- Validation of schema documents themselves.
- Validation of instances against approved schemas.
- Closed local reference resolution.
- Explicit in-memory registry or resolver binding.
- No implicit network fetching.
- No ambient filesystem discovery.
- Duplicate-key rejection remains handled before validator invocation.
- Deterministic error reporting suitable for static review.
- Pure-Python isolated execution or an equivalently reviewable runtime with no native extensions.

Support claims must later be backed by canonical upstream documentation and exact release evidence.

## Runtime compatibility criteria

A candidate release must be compatible with an explicitly approved Python runtime range.

Required compatibility evidence:

- minimum supported Python version;
- maximum or tested Python versions;
- support for isolated invocation using `python -I`;
- no dependence on user-site packages;
- no requirement to modify `PYTHONPATH` globally;
- no requirement for shell activation;
- no requirement for a package-manager installation step at validation time;
- no requirement for build tools or compiler toolchains;
- no native extension or platform-specific binary dependency.

A candidate that requires a newer runtime than the approved execution environment must be classified as blocked unless a separate runtime-selection track is approved.

## Canonical source criteria

A later evidence phase may consider only exact, immutable release artifacts from:

- the canonical upstream project repository release page;
- the canonical project package index namespace;
- another officially documented immutable distribution channel.

Required source evidence:

- canonical project owner;
- canonical project repository;
- exact version tag;
- release commit identity when available;
- release publication date;
- exact archive filename;
- immutable artifact URL or canonical artifact identifier;
- upstream-published SHA-256 when available;
- independently calculated SHA-256 after a separately authorized acquisition;
- exact byte count;
- source-distribution or wheel classification;
- signature or attestations when available.

Mutable aliases such as `latest`, branch archives, unversioned URLs, mirrors, cache copies, and third-party reposts are forbidden.

## Candidate class preference

Candidates must be evaluated in this order:

1. Pure-Python source distribution with no build step required for the retained runtime subset.
2. Pure-Python universal wheel whose contents can be deterministically reviewed and extracted without installation.
3. Any other format only through a separately approved exception gate.

Platform-specific wheels, native extensions, executables, binary shared libraries, and installer bundles are rejected by default.

## License criteria

A candidate cannot be selected without planned evidence for:

- exact license identifier;
- canonical license text;
- license file path inside the release artifact;
- copyright notices;
- attribution requirements;
- redistribution permissions;
- modification permissions;
- notice-preservation requirements;
- dependency license compatibility;
- absence of unresolved dual-license or optional-license ambiguity.

Candidate scoring must treat missing or ambiguous license evidence as an automatic rejection, not a lower score.

## Dependency criteria

A candidate release must expose a dependency set that can be statically closed.

Required planned evidence:

- direct runtime dependencies;
- environment markers;
- version constraints;
- optional extras;
- transitive runtime dependencies;
- standard-library-only boundaries;
- dynamic import behavior;
- plugin or entry-point behavior;
- resource-file requirements;
- generated metadata requirements;
- network or telemetry dependencies.

A candidate is rejected if dependency closure requires:

- an online package resolver;
- runtime installation;
- native code;
- install hooks;
- build isolation;
- unbounded version ranges without exact later resolution;
- undeclared dynamic imports;
- mutable external data;
- optional dependencies that cannot be proven unnecessary.

## Security and containment criteria

Each candidate must later be reviewed for:

- import-time side effects;
- subprocess use;
- filesystem writes;
- environment-variable reads;
- network access;
- telemetry;
- plugin discovery;
- entry-point execution;
- dynamic code loading;
- use of `eval`, `exec`, or runtime compilation;
- deserialization of executable formats;
- native library loading;
- cache creation;
- temporary-file behavior.

Any behavior outside the approved validator operation must be either proven unreachable in the isolated preflight or rejected.

## Candidate evidence record

A future Phase 25KY source-and-provenance inventory result must create one record per candidate containing:

- candidate identifier;
- project name;
- exact release version;
- canonical source references;
- publication identity;
- artifact filename and format;
- advertised Python compatibility;
- advertised JSON Schema draft support;
- license identity;
- declared direct dependencies;
- native-extension status;
- build requirement status;
- install-hook status;
- network behavior status;
- telemetry status;
- immutable evidence citations;
- unresolved questions;
- preliminary classification.

No payload download is authorized during that inventory.

## Preliminary classifications

Each candidate record must receive exactly one preliminary classification:

- `ELIGIBLE_FOR_PROVENANCE_AND_LICENSE_REVIEW`
- `BLOCKED_MUTABLE_OR_UNOFFICIAL_SOURCE`
- `BLOCKED_PYTHON_COMPATIBILITY`
- `BLOCKED_DRAFT_2020_12_SUPPORT`
- `BLOCKED_NATIVE_OR_BINARY_COMPONENT`
- `BLOCKED_BUILD_OR_INSTALL_REQUIREMENT`
- `BLOCKED_LICENSE_EVIDENCE`
- `BLOCKED_DEPENDENCY_CLOSURE`
- `BLOCKED_NETWORK_OR_TELEMETRY_BEHAVIOR`
- `BLOCKED_INSUFFICIENT_CANONICAL_EVIDENCE`

Preliminary eligibility is not candidate selection.

## Comparison method

A future selection review may compare eligible candidates only across these dimensions:

- exact functional fit;
- Python compatibility;
- source immutability;
- license clarity;
- dependency count;
- dependency closure complexity;
- retained runtime file count;
- absence of native code;
- absence of build and install behavior;
- offline resolver support;
- import-side-effect risk;
- deterministic packaging feasibility;
- maintainability and revocation process.

Security and closure criteria are pass/fail. They must not be traded away through weighted scoring.

## Selection rule

Exactly one candidate may eventually be selected only when:

1. It has passed canonical-source inventory.
2. Its exact release identity is fixed.
3. Its license evidence is complete.
4. Its dependency closure is complete.
5. Its native-code status is clear and acceptable.
6. Its retained runtime subset is defined.
7. Its deterministic artifact construction is feasible.
8. Gemini approves the candidate-selection record.
9. The user explicitly approves the exact candidate and version.

No automatic selection is permitted.

## Planned Phase 25KY boundary

Phase 25KY may perform read-only public-source evidence gathering only after Phase 25KX approval and synchronization.

Phase 25KY may:

- inspect canonical upstream project pages;
- inspect canonical release metadata;
- inspect canonical package metadata;
- record exact published compatibility, license, and dependency declarations;
- compare a small bounded set of candidates;
- create exactly one untracked Markdown inventory result.

Phase 25KY must not:

- download package archives or wheels;
- retain payload files;
- run package managers;
- install packages;
- create virtual environments;
- import candidate code;
- inspect extracted package contents;
- execute candidate code;
- run schema validation;
- rerun Phase 25KT;
- run Python syntax validation;
- modify repository application files;
- stage, commit, or push.

## Bounded candidate set

The public-source inventory must evaluate no more than three candidate projects or release lines in one gate.

The candidate set must be selected from mature JSON Schema implementations with explicit Draft 2020-12 support and pure-Python distribution availability.

The inventory gate must not broaden into a general ecosystem survey.

## Rejection finality

A rejected candidate remains rejected for the evaluated release identity. Reconsideration requires:

- a different exact release;
- new canonical evidence;
- a separate reviewed reopening gate.

Historical rejection records must not be overwritten.

## Required downstream sequence

1. Gemini reviews this Phase 25KX candidate-selection plan.
2. Commit exactly one Phase 25KX planning artifact after approval.
3. Author Phase 25KY read-only source-and-provenance inventory.
4. Review and commit the Phase 25KY result.
5. Begin separate license and dependency closure planning.
6. Select no candidate until provenance, license, and dependency evidence are complete.
7. Keep package acquisition blocked until an exact candidate and artifact are approved.
8. Keep Python syntax-preflight planning blocked until a successful Phase 25KT-equivalent rerun.

## Required total-pass condition

Path B selection does not unlock Python syntax-preflight planning.

A later complete package-and-catalog preflight must return:

`PASSED_PACKAGE_AND_CATALOG_PREFLIGHT_READY_FOR_SYNTAX_PLANNING`

Any other result keeps all downstream operations blocked.

## Explicit exclusions

Phase 25KX does not:

- browse public sources;
- select candidates or releases;
- download or retain artifacts;
- inspect package contents;
- review actual license files;
- resolve dependencies;
- install packages;
- create virtual environments;
- import or execute validators;
- construct vendored artifacts;
- run schema validation;
- rerun Phase 25KT;
- run Python syntax validation;
- materialize or execute generated modules;
- modify package files or lockfiles;
- stage, commit, or push;
- access databases or external services;
- deploy, publish, or reactivate operations.

## Required Gemini decision

- `APPROVED — VENDORED-VALIDATOR CANDIDATE-SELECTION PLAN`
- `APPROVED WITH REQUIRED CORRECTIONS`
- `REVISION REQUIRED`
- `REJECTED`

State whether exactly this Phase 25KX planning artifact may be committed and whether Phase 25KY read-only source-and-provenance inventory authoring may begin after synchronization.

## System layer progress report

- Phase 25KW Path B vendored-validator planning: 100%
- Phase 25KW result review and commit: 100%
- Phase 25KX candidate-selection planning: 100%
- Phase 25KX Gemini planning review: pending
- Phase 25KY source-and-provenance inventory: 0%
- Candidate selection: 0%
- Vendored artifact acquisition: 0%
- Vendored artifact construction: 0%
- Phase 25KT-equivalent rerun: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
