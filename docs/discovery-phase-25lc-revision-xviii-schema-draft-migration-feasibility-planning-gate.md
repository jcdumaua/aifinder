# Phase 25LC — Revision XVIII Schema-Draft Migration Feasibility Planning Gate

## Status

`PLANNING_ONLY — OPERATIONAL_REACTIVATION_BLOCKED`

## Baseline

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Approved Phase 25LB commit: `6c8b9f26c38a43a7b4890e4758a033bcb5ea43d0`
- Approved Phase 25LB subject: `Document Phase 25LB historical validator release metadata inventory`
- Phase 25LB artifact: `docs/discovery-phase-25lb-revision-xvii-read-only-historical-validator-release-metadata-inventory-result.md`
- Phase 25LB artifact SHA-256: `5939e3eb1d0039d976ec4812e36f0f00ccc46b939f6b8d0944403dbc13909cf9`
- Phase 25LB artifact byte count: `9569`

## Purpose

Define a documentation-only feasibility plan for determining whether the current Revision XVIII metadata schema family can be represented safely in an older JSON Schema draft that is compatible with an authentic pure-Python validator environment.

This phase does not authorize conversion, schema editing, validator installation, validation execution, runtime import, dependency resolution, or operational reactivation.

## Accepted Phase 25LB Findings

Phase 25LB established the following release boundary:

- `jsonschema 4.18.0` declares unconditional `rpds-py>=0.7.1`.
- `jsonschema 4.17.3` uses `pyrsistent` and does not declare `rpds-py`.
- `jsonschema 4.16.0` does not declare `rpds-py`.
- The dependency transition is bounded between `4.17.3` and `4.18.0`.
- The examined pre-boundary releases advertise only partial Draft 2020-12 support.
- No examined historical release qualifies as a preliminary validator candidate.
- Path 1, Historical Pure-Python Validator Evaluation, is closed.

## Phase 25LC Question

Can the current Revision XVIII schema requirements be translated to an older draft, provisionally Draft 7, without weakening required validation semantics, silently accepting invalid metadata, or changing runtime behavior?

The answer must remain unproven until a later approved inspection and evidence sequence is completed.

## Planning Boundary

Phase 25LC may document only:

1. The proposed source-schema inventory method.
2. The proposed keyword-by-keyword compatibility matrix.
3. The proposed semantic-equivalence classification rules.
4. The proposed risk and blocker taxonomy.
5. The proposed evidence package required before any conversion may be considered.
6. The proposed successor phases needed for static inspection, review, and any later controlled implementation.

Phase 25LC may not inspect or modify schema payloads.

## Proposed Keyword Compatibility Matrix

A later static inspection phase should produce one row for every schema keyword and structural construct used by the Revision XVIII schema family.

Each row should include:

| Field | Required content |
| --- | --- |
| Schema path | Exact repository-relative schema file and JSON pointer |
| Current draft | Declared draft or vocabulary |
| Keyword or construct | Exact keyword, vocabulary feature, or structural dependency |
| Draft 7 availability | Native, representable, unsupported, or unknown |
| Translation type | Identity, mechanical rewrite, semantic rewrite, removal prohibited, or unresolved |
| Semantic risk | None, low, medium, high, or blocking |
| Failure-mode risk | False acceptance, false rejection, annotation loss, reference change, evaluation-order change, or unknown |
| Required evidence | Specification citation, validator behavior evidence, static proof, or controlled test |
| Classification | Compatible, conditionally compatible, blocked, or unclassified |

No row may default to compatible.

## Required Compatibility Topics

The later inventory must explicitly account for, when present:

- `$schema`
- `$id`
- `$ref`
- `$defs` and any proposed `definitions` translation
- `$anchor`
- `$dynamicAnchor`
- `$dynamicRef`
- `unevaluatedProperties`
- `unevaluatedItems`
- `dependentSchemas`
- `dependentRequired`
- `prefixItems`
- tuple-form `items`
- `contains`, `minContains`, and `maxContains`
- `if`, `then`, and `else`
- `const`
- `propertyNames`
- `patternProperties`
- `additionalProperties`
- numeric exclusivity semantics
- format assertion versus annotation behavior
- vocabulary declarations
- annotation collection dependencies
- reference resolution scope
- recursive or cyclic references
- custom extension keywords
- application assumptions outside the schema files

This list is a planning minimum, not evidence that any listed keyword is present.

## Semantic Equivalence Rules

A proposed translation may be classified as compatible only when all required behavior is preserved.

The later evidence sequence must fail closed when a translation could:

- accept an instance rejected by the current schema;
- reject an instance accepted by the current schema;
- change reference resolution;
- remove an enforced closed-world property constraint;
- alter array tuple semantics;
- change conditional validation behavior;
- convert an assertion into an annotation;
- depend on validator-specific behavior not established by specification and evidence;
- require application code changes;
- require schema or migration changes outside the explicitly approved scope.

Absence of evidence is a blocker, not compatibility evidence.

## Proposed Classification Taxonomy

### `COMPATIBLE_IDENTITY`

The construct exists with materially equivalent semantics and requires no rewrite beyond draft declaration changes.

### `COMPATIBLE_MECHANICAL_TRANSLATION`

A deterministic syntax translation appears possible, but must still be proven through static review and later controlled equivalence testing.

### `CONDITIONALLY_COMPATIBLE`

A translation may be possible only under documented constraints that are already guaranteed by the schema structure or application contract.

### `BLOCKED_SEMANTIC_GAP`

The older draft cannot represent the required behavior without weakening or changing semantics.

### `BLOCKED_REFERENCE_MODEL`

Reference, anchor, vocabulary, or recursive-resolution behavior cannot be shown equivalent.

### `BLOCKED_APPLICATION_DEPENDENCY`

The schema relies on application behavior that would require source, API, UI, database, migration, or runtime changes.

### `UNCLASSIFIED_FAIL_CLOSED`

Evidence is missing, ambiguous, or contradictory.

## Evidence Requirements Before Any Conversion

No schema-draft conversion may be proposed for implementation until a later reviewed package contains:

1. An exact inventory of all in-scope schema files.
2. Cryptographic identity for every inspected schema.
3. A complete keyword and construct matrix with zero unclassified rows.
4. Specification-backed rationale for every non-identity translation.
5. Explicit identification of every semantic gap.
6. A determination of whether Draft 7 is sufficient or blocked.
7. A rollback and original-schema preservation plan.
8. A controlled equivalence-test design using fixed valid and invalid fixtures.
9. A validator provenance and dependency plan that remains compatible with repository and platform constraints.
10. Independent Gemini review before any implementation or execution.

## Proposed Successor Sequence

### Phase 25LD — Static Schema Surface Inventory Planning Gate

Define the exact files, identity checks, and read-only extraction fields for a later schema surface inventory.

### Phase 25LE — Static Schema Surface Inventory Result

Read only the approved schema files and record the exact keywords and constructs present. No conversion or validation.

### Phase 25LF — Keyword Compatibility Matrix Planning Gate

Define the evidence and classification method for each observed construct.

### Phase 25LG — Keyword Compatibility Matrix Result

Classify only observed constructs, with unsupported or ambiguous items blocked.

### Phase 25LH — Schema-Draft Migration Feasibility Review Gate

Determine whether the migration path is viable, conditionally viable, or blocked.

Any implementation, schema rewrite, fixture construction, validator installation, or validation run requires separate later authorization.

## Repository Scope

Exactly one new Markdown artifact is allowed for Phase 25LC:

`docs/discovery-phase-25lc-revision-xviii-schema-draft-migration-feasibility-planning-gate.md`

No existing file may be modified.

## Prohibited Actions

- No schema file inspection in this phase.
- No schema edit, translation, normalization, or migration.
- No validator or dependency installation.
- No wheel or source-distribution download.
- No virtual-environment creation.
- No Python, validator, or dependency import.
- No schema validation.
- No Phase 25KT rerun.
- No Python syntax validation.
- No server startup.
- No route invocation.
- No browser automation.
- No live database, API, Supabase, or external service access.
- No environment-value printing.
- No source, API, UI, schema, migration, generated-type, package, or lockfile change.
- No staging, commit, or push.
- No operational reactivation.

## Planned Result State

The expected result of Phase 25LC is:

`SCHEMA_DRAFT_MIGRATION_FEASIBILITY_METHOD_ESTABLISHED`

This state establishes only a planning method. It does not establish that Draft 7 migration is feasible.

## Operational Posture

- Discovery Engine progress estimate: `99%`
- Path 1 — Historical Pure-Python Validator Evaluation: `CLOSED`
- Path 2 — Schema-Draft Migration Feasibility: `PLANNING`
- Operational reactivation: `BLOCKED`
