# Phase 26RX — GAP-001 Evidence Source and Non-Inference Contract

## Permitted source classes

A future recovery inspection may use only explicitly approved, read-only sources from these classes:

1. committed governance records that directly name `GAP-001`;
2. original decision ledgers or inventories with row-level GAP-001 identity;
3. signed or otherwise attributable human-owner determinations;
4. approved historical review packages containing exact GAP-001 metadata;
5. a newly created human-governed authoritative record, reviewed before application.

## Disallowed inference

Metadata must not be derived from:

- neighboring blockers;
- shared chronology;
- adjacent Markdown headings;
- the next listed taxonomy bucket;
- cohort similarity;
- matching risk language;
- common decision questions;
- batch membership of GAP-002–008;
- filename patterns;
- column position when column identity is uncertain;
- table headers interpreted as values;
- unstated project assumptions.

## Evidence quality states

Each recovered field must be classified as exactly one of:

- `EXPLICIT_AUTHORITATIVE_VALUE`
- `EXPLICIT_CONFLICTING_VALUES`
- `MISSING`
- `CORRUPTED_SOURCE_VALUE`
- `NEIGHBORING_COHORT_ONLY`
- `PROPOSED_NEW_HUMAN_RECORD_VALUE`

Only `EXPLICIT_AUTHORITATIVE_VALUE` may be accepted directly.

`PROPOSED_NEW_HUMAN_RECORD_VALUE` requires a separate exact human approval and Gemini review before becoming authoritative.

## Conflict handling

When explicit sources disagree:

1. preserve every value and source;
2. apply no automatic precedence unless independently approved for GAP-001;
3. request an exact human resolution;
4. keep quarantine active;
5. make no ledger-clearance change.

## Safety state

- External evidence acquisition: `NOT_AUTHORIZED`
- Metadata inference: `PROHIBITED`
- GAP-001 quarantine: `ACTIVE`
- Operational reactivation: `BLOCKED`
