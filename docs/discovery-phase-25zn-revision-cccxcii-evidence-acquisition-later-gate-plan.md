# AiFinder Phase 25ZN — Revision CCCXCII — Evidence-Acquisition Later-Gate Plan

## Scope

- Decision package: `BATCH-02`
- Covered blockers: `9`
- Risk: `HIGH_SECURITY_OR_PRODUCTION`

## Gate objective

Define the smallest bounded evidence-acquisition operation needed to evaluate the nine blockers while preserving security, privacy, and zero-mutation boundaries.

## Required acquisition contract

- Exact evidence question.
- Exact source category.
- Read-only method.
- Maximum item count.
- Maximum data size.
- Sensitive-data exclusion.
- Metadata-only output where possible.
- No credential or secret printing.
- No database mutation.
- No publication.
- Stop-on-ambiguity behavior.
- Independent review before acquisition.

## Dependency

Evidence acquisition may proceed only after any required security/platform preconditions are reviewed and satisfied.

## Prohibited in this phase

- Screenshots, exports, downloads, API calls, browser automation, platform access, or live evidence collection.
- Secret-store or environment inspection.
- Database access or mutation.

## Disposition

`READY_FOR_BOUNDED_EVIDENCE_GATE_SPECIFICATION`

Operational blockers cleared: `0`.
