# Phase 25LW — Revision XXXVIII SEC-LR-007 Non-Value-Printing Flagged-Literal Static Source Review Planning Gate

## Status

`PLANNING_ONLY — NO FLAGGED-FILE INSPECTION — NO VALUE OUTPUT`

## Baseline

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Approved Phase 25LV commit: `2cbe96f2023b63bb33aafd35e667644af18f9f85`
- Approved Phase 25LV subject: `Document Phase 25LV public launch readiness blocker disposition plan`
- Phase 25LV artifact: `docs/discovery-phase-25lv-revision-xxxvii-public-launch-readiness-blocker-disposition-planning-gate.md`
- Phase 25LV artifact SHA-256: `69f7d88814c09a9810b45ffd2b741349b501571081e755dfa49b2dba62a48ed2`
- Phase 25LV artifact byte count: `9972`

## Purpose

Define the exact safe method for reviewing the files flagged under SEC-LR-007 without printing, copying, hashing for credential comparison, encoding, or otherwise disclosing any matched literal value.

This phase is planning-only.

It does not open flagged files, inspect matched lines, search for literal values, modify source, run tests, build, install packages, access Supabase, deploy, stage, commit, or push.

## Preserved State

- SEC-LR-007: `FAIL`
- Phase 25LS: `SECURITY_SUPABASE_LEGAL_OPERATIONS_EVIDENCE_FAILED`
- Phase 25LO: `LOCAL_BUILD_VERIFICATION_BLOCKED`
- Phase 25LQ: `DEPLOYED_SURFACE_AND_DEVICE_EVIDENCE_BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Automated Discovery Engine: `BLOCKED`
- Operational reactivation: `BLOCKED`

This planning gate cannot clear SEC-LR-007.

## Review Objective

The later Phase 25LX review must determine whether each SEC-LR-007 match is:

- a real credential or secret;
- an inert test fixture;
- a safe synthetic example;
- a false-positive pattern match;
- or unresolved.

The review must produce enough structural evidence to justify the classification while never revealing the value itself.

## Exact Input Boundary

The later review may inspect only file paths already identified by the approved Phase 25LS result.

The review must fail closed if the exact flagged-path list cannot be reconstructed safely from the approved artifact or an approved detector rerun.

The review may not broaden into:

- repository-wide secret remediation;
- unrelated source review;
- build-output review;
- browser enablement;
- Supabase metadata collection;
- legal review;
- operational ownership confirmation.

## Non-Value-Printing Rule

The later review must never output:

- full matched literal;
- partial literal;
- prefix;
- suffix;
- middle segment;
- encoded form;
- reversible transformation;
- character-by-character representation;
- entropy sample;
- fingerprint intended for external credential matching;
- secret hash intended for breach or validity lookup;
- environment value;
- token;
- cookie;
- password;
- private key;
- API key;
- database URL;
- connection string.

This prohibition applies to terminal output, logs, artifacts, clipboard content, error messages, stack traces, temporary files, screenshots, and review packages.

## Allowed Structural Metadata

For each match, the later review may record only:

- stable finding ID;
- tracked file path;
- line number;
- detector rule identifier;
- syntactic context category;
- literal type;
- literal length bucket, not exact length;
- character-class category;
- test-only or runtime-reachable classification;
- import or execution reachability category;
- fixture or example context;
- whether the surrounding code asserts rejection, redaction, or safe handling;
- final classification;
- confidence;
- remediation requirement.

## Length Buckets

Exact literal length must not be printed.

Allowed buckets:

- `SHORT_LT_16`
- `MEDIUM_16_TO_31`
- `LONG_32_TO_63`
- `VERY_LONG_64_PLUS`
- `NOT_APPLICABLE`

## Character-Class Categories

Allowed categories:

- `ALPHANUMERIC`
- `ALPHANUMERIC_WITH_SYMBOLS`
- `URL_LIKE`
- `JWT_LIKE`
- `PEM_LIKE`
- `UUID_LIKE`
- `PLACEHOLDER_LIKE`
- `OTHER_STRUCTURAL_PATTERN`
- `NOT_APPLICABLE`

No category may include literal fragments.

## Syntactic Context Categories

Allowed categories:

- `TEST_FIXTURE_DECLARATION`
- `TEST_EXPECTATION`
- `TEST_INPUT_PAYLOAD`
- `REDACTION_TEST`
- `VALIDATION_TEST`
- `DOCUMENTATION_EXAMPLE`
- `RUNTIME_CONSTANT`
- `CONFIGURATION_DEFAULT`
- `UNRESOLVED_CONTEXT`

## Runtime Reachability Categories

Allowed categories:

- `TEST_ONLY_NOT_BUNDLED`
- `DEVELOPMENT_ONLY`
- `BUILD_TIME_ONLY`
- `SERVER_RUNTIME_REACHABLE`
- `CLIENT_BUNDLE_REACHABLE`
- `UNKNOWN_REACHABILITY`

Any client-bundle or server-runtime reachability with a secret-like literal is a critical concern.

## Classification Options

Each finding must receive exactly one:

### `REAL_SECRET_CONFIRMED`

Use only when evidence establishes that the literal is an actual credential, token, password, private key, or sensitive connection value.

Result effect: `FAILED`.

### `INERT_TEST_FIXTURE`

Use when:

- the file is test-only;
- the value is intentionally synthetic;
- it is not imported by runtime or build paths;
- the test validates detection, rejection, redaction, or handling;
- no real credential origin is indicated.

### `SAFE_SYNTHETIC_EXAMPLE`

Use when:

- the value is clearly generated or placeholder-like;
- it is not a valid operational credential;
- it is not runtime-reachable;
- its purpose is documentation or validation.

### `FALSE_POSITIVE_PATTERN_MATCH`

Use when:

- the detector matched non-secret syntax or ordinary text;
- the surrounding context does not represent a credential value;
- no sensitive literal exists.

### `UNRESOLVED`

Use when the evidence is insufficient or classification would require prohibited disclosure or live validation.

Result effect: `BLOCKED`.

## Review Method

The later Phase 25LX execution should:

1. Verify exact repository, branch, baseline, synchronization, and clean scope.
2. Verify Phase 25LS, Phase 25LU, and Phase 25LV artifact identities.
3. Reconstruct only the approved flagged-path list.
4. Use an embedded deterministic analyzer.
5. Read flagged files locally without printing raw source.
6. Detect matches in memory.
7. Convert every match immediately into allowed structural metadata.
8. Discard raw matched values from output structures.
9. Evaluate test-only and runtime reachability using tracked imports and package scripts.
10. Write exactly one Markdown result artifact.
11. Confirm no tracked source changed.
12. Copy only the sanitized Gemini review package.

## Reachability Evidence Rules

The later analyzer may use:

- tracked imports;
- package-script references;
- test-runner configuration;
- directory placement;
- file naming;
- module graph references;
- build entry points.

It must not execute application code.

A file is not automatically safe merely because its name contains `test`.

## Result Classification

Phase 25LX must select exactly one:

### `SEC_LR_007_FLAGGED_LITERAL_REVIEW_PASSED`

Allowed only when every finding is classified as:

- `INERT_TEST_FIXTURE`;
- `SAFE_SYNTHETIC_EXAMPLE`; or
- `FALSE_POSITIVE_PATTERN_MATCH`.

Passing this review does not automatically clear Phase 25LS or authorize launch. A separate reassessment gate is required.

### `SEC_LR_007_FLAGGED_LITERAL_REVIEW_FAILED`

Required when any finding is:

- `REAL_SECRET_CONFIRMED`; or
- runtime-reachable in a manner that creates a credible secret-exposure risk.

### `SEC_LR_007_FLAGGED_LITERAL_REVIEW_BLOCKED`

Required when:

- any finding is `UNRESOLVED`;
- the approved path list cannot be reconstructed safely;
- raw-value output cannot be prevented;
- runtime reachability cannot be classified;
- repository scope changes unexpectedly.

## Required Result Ledger

The Phase 25LX result should include:

| Field | Required value |
| --- | --- |
| Finding ID | Stable identifier |
| File path | Exact tracked path |
| Line number | Integer |
| Detector rule | Stable rule identifier |
| Context category | Approved category |
| Length bucket | Approved bucket |
| Character class | Approved category |
| Reachability | Approved category |
| Classification | Approved classification |
| Confidence | High, medium, or low |
| Launch effect | Blocking, conditional, or non-blocking |
| Remediation | Exact action or none |
| Raw value printed | Always `NO` |

## Stop Conditions

The later execution must stop if:

- a raw or partial value may reach output;
- a stack trace may include source text;
- a temporary file may contain unsanitized findings;
- an external secret-validation service would be required;
- network access would be required;
- application execution would be required;
- a flagged file is modified;
- any non-result repository file changes;
- the flagged scope expands unexpectedly;
- an upstream failed or blocked state is represented as cleared.

## Planned Phase 25LX Artifact

Exactly one Markdown artifact:

`docs/discovery-phase-25lx-revision-xxxix-sec-lr-007-non-value-printing-flagged-literal-static-source-review-result.md`

## Repository Scope

Exactly one new Markdown artifact is allowed for Phase 25LW:

`docs/discovery-phase-25lw-revision-xxxviii-sec-lr-007-non-value-printing-flagged-literal-static-source-review-planning-gate.md`

No existing file may be modified.

## Prohibited Actions

- No flagged-file inspection.
- No source-content output.
- No literal-value output.
- No partial-value output.
- No external validation.
- No network access.
- No build.
- No tests.
- No application import.
- No package installation.
- No browser automation.
- No Supabase access.
- No database query.
- No source modification.
- No remediation.
- No deployment.
- No public launch.
- No staging, commit, or push.
- No crawler activation.
- No operational reactivation.

## Expected Result State

`SEC_LR_007_NON_VALUE_PRINTING_STATIC_REVIEW_METHOD_ESTABLISHED`

## Operational Posture

- Discovery Engine progress estimate: `99%`
- SEC-LR-007: `FAIL — UNRESOLVED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Local build verification: `BLOCKED`
- Deployed surface and device evidence: `BLOCKED`
- Security/Supabase/legal/operations evidence: `FAILED`
- Automated Discovery Engine: `BLOCKED`
- Operational reactivation: `BLOCKED`
