# Phase 25KP — Revision XVII Static Correction Plan

## Identity

- Phase: `25KP`
- Revision: `XVII`
- Namespace: `v18`
- State: `APPROVED_REVISION_XVII_CORRECTION_PLAN`
- Repository baseline: `e02fb2d2403aadb65351fa8a06b71225bf350bea`
- Phase 25KO artifact SHA-256: `b3c1ab291a93c4e56495ee35a009eda82ece4a2c8de4f4aebb8e82cb3959a3a3`
- Historical Revision XVI core ZIP SHA-256: `c6ce30ab2170aef7e3a9ee56b8d0d1804d733cfb4ace92a45501f0424966187f`
- Historical Revision XVI core ZIP bytes: `32435`
- Preserved Python snapshots: `9`
- Target metadata artifacts: `22`
- Operational reactivation: `BLOCKED`

## Reviewer decision

`APPROVED (REVISION XVII CORRECTION PLAN)`

Phase 25KQ terminal-only Revision XVII static authoring may begin only after this planning artifact is committed and synchronized.

## Confirmed defect

Revision XVI registered a raw bootstrap manifest in the strict schema catalog.

The schema catalog expected canonical JSON Schema identity:

`aifinder.bootstrap-manifest.v17`

The bootstrap manifest contained `schema_version` but no JSON Schema `$id`.

The Phase 25KO preflight therefore correctly returned:

`FAILED_JSON_OR_CATALOG_PREFLIGHT`

Python syntax validation was correctly skipped.

## Revision XVII correction strategy

Revision XVII separates artifacts into seven closed primary catalogs:

1. Python module snapshots.
2. JSON Schema documents.
3. Raw data manifests.
4. Sandbox profiles.
5. Policies and contracts.
6. Package indexes and anchors.
7. Review-only records and matrices.

Each artifact must belong to exactly one primary catalog.

Cross-catalog references must be explicit, class-qualified, digest-bound, and non-ambient.

## Class-specific identity rules

### Python module snapshots

Required metadata:

- logical module name;
- artifact name;
- materialized filename;
- SHA-256;
- byte length.

Python module snapshots must not appear in the schema catalog.

### JSON Schema documents

Required metadata:

- canonical `$id`;
- artifact name;
- SHA-256;
- byte length.

Only genuine JSON Schema documents may appear in the schema catalog.

### Raw data manifests

Required metadata:

- `schema_version`;
- `document_type`;
- artifact name;
- SHA-256;
- byte length.

Raw data manifests must not be required to carry JSON Schema `$id`.

### Sandbox profiles

Required metadata:

- profile identity;
- artifact name;
- platform scope;
- SHA-256;
- byte length.

Sandbox profiles must not appear in the schema catalog.

### Policies and contracts

Required metadata:

- stable policy or contract identity;
- record type;
- artifact name;
- SHA-256;
- byte length.

Policies and contracts must not be treated as executable modules or JSON Schema documents.

### Package indexes and anchors

Required metadata:

- package record type;
- artifact name;
- SHA-256;
- byte length;
- record count or anchor binding where applicable.

Package indexes and anchors must not be treated as executable modules or JSON Schema documents.

### Review-only records

Required metadata:

- review record identity;
- artifact name;
- SHA-256;
- byte length.

Review-only records remain non-runtime and must not participate in executable discovery.

## Required Revision XVII metadata artifacts

Phase 25KQ is limited to authoring these 22 static text artifacts:

1. `aifinder-phase-25kp-artifact-class-catalog-schema-v18.json.txt`
2. `aifinder-phase-25kp-module-catalog-schema-v18.json.txt`
3. `aifinder-phase-25kp-schema-catalog-schema-v18.json.txt`
4. `aifinder-phase-25kp-data-manifest-catalog-schema-v18.json.txt`
5. `aifinder-phase-25kp-profile-catalog-schema-v18.json.txt`
6. `aifinder-phase-25kp-policy-catalog-schema-v18.json.txt`
7. `aifinder-phase-25kp-package-index-catalog-schema-v18.json.txt`
8. `aifinder-phase-25kp-review-record-catalog-schema-v18.json.txt`
9. `aifinder-phase-25kp-module-catalog-v18.json.txt`
10. `aifinder-phase-25kp-schema-catalog-v18.json.txt`
11. `aifinder-phase-25kp-data-manifest-catalog-v18.json.txt`
12. `aifinder-phase-25kp-profile-catalog-v18.json.txt`
13. `aifinder-phase-25kp-policy-catalog-v18.json.txt`
14. `aifinder-phase-25kp-package-index-catalog-v18.json.txt`
15. `aifinder-phase-25kp-review-record-catalog-v18.json.txt`
16. `aifinder-phase-25kp-bootstrap-manifest-v18.json.txt`
17. `aifinder-phase-25kp-root-trust-manifest-v18.json.txt`
18. `aifinder-phase-25kp-package-payload-index-v18.json.txt`
19. `aifinder-phase-25kp-package-index-anchor-v18.json.txt`
20. `aifinder-phase-25kp-contract-v18.json.txt`
21. `aifinder-phase-25kp-ledger-policy-v18.json.txt`
22. `aifinder-phase-25kp-artifact-class-closure-matrix.md`

## Preserved invariants

- Exactly nine Python snapshots remain unchanged.
- All nine remain pinned to `EXECUTION_ENABLED = False`.
- Every catalog entry retains exact SHA-256 and byte-length binding.
- Ambient module, schema, profile, policy, manifest, package-index, and review-record resolution remains forbidden.
- Artifact ownership is exclusive to one primary catalog.
- JSON Schema `$id` is required only for genuine schema documents.
- Raw manifests use `schema_version` and `document_type`.
- Operational reactivation remains blocked.

## Approved Phase 25KQ boundary

Phase 25KQ may:

- author the 22 approved static metadata artifacts in a private scratch workspace;
- preserve the nine Python snapshots unchanged;
- prepare one uncommitted Phase 25KQ Markdown tracking artifact;
- prepare a Gemini static-design review package.

Phase 25KQ must not:

- modify Python source;
- reconstruct or execute runtime capabilities;
- run Python syntax validation;
- materialize generated modules for execution;
- create or consume authorization;
- invoke C01 or C02;
- access a database or external service;
- invoke network capabilities;
- start a server;
- run application lint, build, or tests;
- deploy or publish;
- stage, commit, or push without a later approval gate;
- approve operational reactivation.

## Required successor sequence

1. Commit and synchronize this Phase 25KP planning artifact.
2. Phase 25KQ terminal-only Revision XVII static metadata authoring.
3. Gemini static-design review.
4. Phase 25KR fresh static source review.
5. Phase 25KS isolated package and catalog preflight.
6. Python syntax validation only after every static catalog check passes.
7. Materialization and execution remain separately gated.

## Repository boundary

Exactly one mode-100644 Phase 25KP Markdown planning artifact may be committed.

No Revision XVII schema, catalog, manifest, policy, index, anchor, matrix, package, identity, or review artifact may enter the repository in this phase.

## System layer progress report

- Phase 25KO failure result review: 100%
- Phase 25KO commit-and-push: 100%
- Phase 25KP Revision XVII correction planning: 100%
- Phase 25KP Gemini correction-plan review: 100%
- Phase 25KP commit-and-push: pending
- Phase 25KQ Revision XVII static authoring: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
