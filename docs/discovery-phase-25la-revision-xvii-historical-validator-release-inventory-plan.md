# AiFinder Phase 25LA — Revision XVII Historical Validator Release Inventory Plan

## Identity

- Phase: `25LA`
- State: `PENDING_GEMINI_HISTORICAL_RELEASE_INVENTORY_PLAN_REVIEW`
- Repository baseline: `64162db8a0b0c4f348728c12eb3e917ead1fb7c4`
- Phase 25KZ artifact SHA-256: `64599b1fd09f7907085f3781ccb9d83eb63f7fad5b33c2a085c295bf356c8b45`
- Remediation path: `PATH_1_HISTORICAL_VALIDATOR_EVALUATION`
- Candidate selection: `BLOCKED`
- Public metadata lookup: `BLOCKED_PENDING_PHASE_25LA_APPROVAL`
- Package acquisition: `BLOCKED`
- Schema migration: `BLOCKED`
- Python syntax-preflight planning: `BLOCKED`
- Operational reactivation: `BLOCKED`

## Objective

Define a bounded, version-pinned, read-only metadata inventory for historical `jsonschema` releases that may predate the unconditional `rpds-py` dependency while retaining explicit Draft 2020-12 support and compatibility with the approved Python runtime.

## Non-authorization statement

Phase 25LA does not query public metadata, identify or select exact historical versions, download package artifacts, retain or inspect payloads, review actual license files, resolve dependencies, install packages, import validators, inspect schemas, migrate schema drafts, run validation, rerun Phase 25KT, or authorize Python syntax-preflight planning.

## Inventory purpose

The future Phase 25LB inventory must answer only these questions:

1. Which exact release first declares `rpds-py` as an unconditional runtime dependency?
2. Which exact earlier releases advertise Draft 2020-12 support?
3. Which exact earlier releases advertise compatibility with Python 3.9?
4. Which exact earlier releases expose a dependency set that may be statically closed without native components?
5. Which exact earlier releases provide sufficient canonical license metadata for later review?

The inventory does not select a validator or prove runtime eligibility.

## Bounded release set

Phase 25LB may inspect metadata for no more than three exact `jsonschema` releases.

The release set must include:

- one exact release known to declare `rpds-py`, used as the upper boundary witness;
- one exact release immediately before the dependency transition, when identifiable from canonical metadata;
- one earlier exact release that still advertises Draft 2020-12 and Python 3.9 support.

If the precise boundary cannot be established from three exact releases, Phase 25LB must return a fail-closed insufficient-evidence state rather than broadening the inventory.

## Version-binding requirements

Every candidate must be bound to:

- exact project name;
- exact semantic version;
- exact version-specific canonical metadata endpoint;
- resolved version equal to requested version;
- metadata response SHA-256;
- metadata response byte count;
- exact artifact filenames;
- exact published artifact SHA-256 values;
- exact artifact byte counts;
- exact upload timestamps.

Mutable project endpoints, `latest` aliases, branch URLs, mirrors, and third-party reposts are forbidden.

## Canonical metadata sources

Phase 25LB may query only canonical version-specific metadata endpoints from the official Python Package Index namespace for `jsonschema`.

No other registry, mirror, source archive, Git repository, issue tracker, changelog, blog, or search engine is authorized in Phase 25LB.

A later evidence-expansion plan is required before using any additional canonical upstream source.

## Dependency analysis requirements

For each exact release, Phase 25LB must separate:

- unconditional runtime dependencies;
- conditional runtime dependencies;
- optional-extra dependencies;
- unresolved or unusual environment markers.

The inventory must record:

- exact `rpds-py` requirement expressions;
- whether `rpds-py` is unconditional, conditional, optional, or absent;
- all direct runtime dependency expressions;
- declared dependency count by class;
- any package metadata inconsistency.

The inventory must not resolve, download, or inspect dependencies.

## Functional evidence requirements

For each exact release, Phase 25LB must record only claims present in canonical metadata:

- advertised Draft 2020-12 support;
- advertised other JSON Schema drafts;
- declared Python compatibility;
- project and documentation URLs;
- license expression;
- license-file declarations;
- distribution formats.

Absence of a claim must be classified as insufficient canonical evidence, not proof of non-support.

## Preliminary classifications

Each release must receive exactly one classification:

- `BOUNDARY_WITNESS_RPDS_UNCONDITIONAL`
- `PRE_BOUNDARY_PURE_PYTHON_CANDIDATE_FOR_LATER_REVIEW`
- `BLOCKED_DRAFT_2020_12_EVIDENCE`
- `BLOCKED_PYTHON_COMPATIBILITY`
- `BLOCKED_NATIVE_OR_BINARY_COMPONENT`
- `BLOCKED_LICENSE_EVIDENCE`
- `BLOCKED_DEPENDENCY_METADATA_AMBIGUITY`
- `BLOCKED_INSUFFICIENT_CANONICAL_EVIDENCE`

A pre-boundary classification is not selection and does not authorize acquisition.

## Boundary determination rule

The `rpds-py` transition is considered preliminarily bounded only when:

1. An exact later release declares `rpds-py` unconditionally.
2. An exact immediately earlier release is shown not to declare `rpds-py`.
3. Both release identities are version-pinned and canonical.
4. No metadata inconsistency is present.

If the immediately earlier release cannot be identified within the bounded set, return:

`HISTORICAL_DEPENDENCY_BOUNDARY_NOT_ESTABLISHED`

If the boundary is established but no earlier release meets the metadata criteria, return:

`BOUNDARY_ESTABLISHED_NO_PRELIMINARY_HISTORICAL_CANDIDATE`

If at least one earlier release meets the metadata criteria, return:

`PRELIMINARY_HISTORICAL_CANDIDATE_FOUND`

## Package-payload prohibition

Phase 25LB must not:

- download wheels;
- download source distributions;
- retain package files;
- inspect archive members;
- extract files;
- calculate payload digests independently;
- run package managers;
- install dependencies;
- import validator code;
- execute entry points;
- create virtual environments.

Published artifact digests may be recorded from canonical metadata only.

## Network boundary

The future script must:

- use exactly the approved version-specific metadata endpoints;
- use HTTPS only;
- set a fixed user-agent;
- enforce request timeouts;
- reject redirects to non-PyPI hosts;
- write no response bodies into the repository;
- retain only the final Markdown result in the repository;
- avoid printing environment values, headers, cookies, credentials, or response bodies.

## Result artifact requirements

Phase 25LB must create exactly one untracked Markdown result artifact containing:

- result state;
- exact baseline identity;
- Phase 25LA artifact identity;
- exact candidate count;
- one record per release;
- metadata response identities;
- dependency classification;
- Draft support evidence;
- Python compatibility evidence;
- license metadata;
- published artifact metadata;
- preliminary classification;
- boundary determination;
- preserved safety boundaries;
- downstream block state.

The Gemini review package must remain external under mode-0700 `/tmp` storage and be copied to the clipboard.

## Fail-closed conditions

Phase 25LB must fail without creating a commit if:

- repository baseline differs;
- working tree is not clean;
- any endpoint is mutable or not version-specific;
- requested and resolved versions differ;
- more than three releases are queried;
- a redirect escapes the approved host;
- metadata cannot be decoded strictly;
- dependency classification is incomplete;
- output scope exceeds one untracked Markdown artifact;
- any package payload is downloaded or retained.

## Planned successor boundary

After Phase 25LB:

- Gemini reviews the exact inventory result.
- The result may be committed only after explicit approval.
- A separate historical candidate provenance, license, and dependency-closure planning gate is required before acquisition.
- Phase 25LC schema-draft migration feasibility planning remains a separate unexecuted path.
- No remediation path selection occurs automatically.

## Required downstream sequence

1. Gemini reviews Phase 25LA.
2. Commit exactly one Phase 25LA planning artifact after approval.
3. Author Phase 25LB read-only metadata inventory.
4. Keep public metadata lookup blocked until Phase 25LA is synchronized.
5. Review and commit Phase 25LB only after approval.
6. Select no candidate during metadata inventory.
7. Keep package acquisition and schema migration blocked.
8. Keep Python syntax-preflight planning blocked until a later successful package-and-catalog preflight.

## Required total-pass condition

Historical release discovery does not unlock Python syntax-preflight planning.

A later complete package-and-catalog preflight must return:

`PASSED_PACKAGE_AND_CATALOG_PREFLIGHT_READY_FOR_SYNTAX_PLANNING`

Any other state keeps downstream operations blocked.

## Explicit exclusions

Phase 25LA does not:

- browse public metadata;
- identify exact historical releases;
- query package registries;
- select candidates;
- download or retain artifacts;
- inspect package payloads;
- review actual license files;
- resolve dependencies;
- install packages;
- create virtual environments;
- import or execute validators;
- inspect or modify schemas;
- migrate schema drafts;
- run schema validation;
- rerun Phase 25KT;
- run Python syntax validation;
- materialize or execute generated modules;
- modify application code, package files, or lockfiles;
- stage, commit, or push;
- access databases or external services;
- deploy, publish, or reactivate operations.

## Required Gemini decision

- `APPROVED — HISTORICAL VALIDATOR RELEASE INVENTORY PLAN`
- `APPROVED WITH REQUIRED CORRECTIONS`
- `REVISION REQUIRED`
- `REJECTED`

State whether exactly this Phase 25LA planning artifact may be committed and whether Phase 25LB read-only historical release metadata inventory authoring may begin after synchronization.

## System layer progress report

- Phase 25KZ remediation planning review and commit: 100%
- Phase 25LA historical validator release inventory planning: 100%
- Phase 25LA Gemini planning review: pending
- Phase 25LB historical validator release metadata inventory: 0%
- Phase 25LC schema-draft migration feasibility planning: 0%
- Phase 25LD schema-draft migration feasibility inventory: 0%
- Historical candidate selection: 0%
- Remediation path selection: 0%
- Package acquisition: 0%
- Schema migration: 0%
- Phase 25KT-equivalent rerun: 0%
- Python syntax validation: 0%
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
