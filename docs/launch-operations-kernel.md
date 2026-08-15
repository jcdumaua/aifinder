# Launch Operations Kernel

Status: approved local implementation plan for Phase 34JA-34JZ. The kernel is not a live route.

## Purpose

Replace future use of the Delta-heavy qualification runtime with a compact, deterministic, local-first operations kernel. The retained Phase 34IA-34IZ state remains immutable and unresolved until a separately reviewed legacy-reconciliation phase.

## Design

The candidate has five boundaries:

1. `kernel.mjs` owns the eight-state lifecycle, authorization checks, bounded budgets, compact evidence, and the single recovery controller.
2. `manifest.mjs` owns deterministic candidate discovery, canonical identity generation, derived surface identities, source-policy validation, and static readiness.
3. `legacy-classifier.mjs` may only read the exact retained local artifacts and emits a sanitized categorical classification.
4. `cli.mjs` exposes only local verification, identity reporting, static readiness, and read-only legacy classification.
5. `legacy-freeze.json` records the immutable legacy identities, the non-current routing decision, and the approval boundaries.

The canonical manifest excludes only its own bytes to avoid a circular self-hash. Its `candidate_roots` define the complete inventory; the verifier discovers every regular file under those roots, applies deterministic classification, and rejects missing, extra, reordered, symlinked, non-0644, or byte-mismatched members.

## Lifecycle

Current lifecycle states are `READY`, `QUALIFYING`, `QUALIFIED`, `OFFICIAL_RUNTIME_AUTHORIZED`, `OFFICIAL_RUNTIME_RUNNING`, `COMPLETE`, `FAILED_RECOVERABLE`, and `FAILED_CLOSED`. Historical Delta states are evidence only and cannot be used as current kernel states.

Official runtime requires a separate exact `OFFICIAL_RUNTIME` authorization. No lifecycle transition grants Production or public authority. `FAILED_CLOSED` and `COMPLETE` are terminal.

## Recovery

The single recovery controller loads an authoritative local state, validates the candidate and recovery authorization, validates a one-to-one effect ledger, inspects exact owned resources, and reconciles only resources whose ownership is unambiguous. Storage cleanup delegates to an exact-version CAS adapter. Any mismatch, ambiguity, budget exhaustion, or failed cleanup verification produces `FAILED_CLOSED` without guessing ownership.

## Evidence and secrets

Evidence contains only schema/version, candidate identity, lifecycle, authorization class, budgets, exact owned resources, effect ledger, cleanup/recovery status, outcome, and immutable audit digests. Secret-shaped field names and secret-bearing values are rejected recursively. Raw retained files are never emitted.

## Legacy freeze and approval boundaries

The Phase 34IA-34IZ orchestrator is preserved for forensics but is non-current. The new kernel imports no legacy runtime entrypoint and has no live mode. Fresh Gemini review remains mandatory for material architecture changes, live candidate bytes, DB or Storage mutation authority, legacy reconciliation, Official runtime, and Production/public authority. Derived digests within this approved local batch do not create a new authority class.

The legacy orchestrator's local self-test may admit these untracked candidate paths only after calling the kernel's canonical verifier. That compatibility path is self-test-only; legacy live preflight continues to reject the new untracked surface, so this phase cannot route the kernel or revive legacy execution.

## Implementation and verification plan

1. Prove lifecycle, recovery, evidence, manifest, source-policy, classifier, freeze, CAS, and readiness behavior with failing tests.
2. Implement only the minimum local modules needed to make those tests pass.
3. Generate and verify the canonical manifest after candidate bytes stabilize.
4. Run every handoff-required legacy and kernel-local gate, syntax check, strict JSON parse, and diff check.
5. Re-prove protected drafts and retained legacy artifacts, then package the exact reviewed bytes without staging, committing, pushing, networking, or live execution.
