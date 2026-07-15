# Phase 26VZ — Wrapper Secret Scanner Defect and Repair Plan

## Defect observed

During the approved live inspection, the wrapper emitted shell errors from its secret-scanning command:

- `grep: parentheses not balanced`
- shell attempts to execute fragments of the intended regular expression.

## Impact classification

- Catalog SQL execution: `SUCCEEDED`
- Read-only transaction and rollback: `SUCCEEDED`
- Database mutation: `NONE`
- Application-row access: `NONE`
- Secret scanner: `FAILED_TO_RUN_CORRECTLY`
- Evidence in the observed output: catalog metadata only
- Wrapper reuse: `BLOCKED_PENDING_REPAIR`

## Probable cause

The extended regular expression was split or quoted incorrectly, causing part of the expression to be interpreted as shell syntax rather than as one `grep -E` pattern.

## Repair requirements

A future repair phase must:

1. inspect the exact committed wrapper lines;
2. replace the fragile inline expression with a safely quoted pattern or pattern file;
3. test the scanner against synthetic secret-like and benign fixtures only;
4. avoid database access during repair verification;
5. preserve wrapper mode `100644`;
6. obtain independent Gemini review before any reuse;
7. create a new immutable wrapper SHA-256 after correction.

## Immediate control

Do not execute `scripts/discovery-live-rls-metadata-execution-wrapper-candidate.sh` again in its current form.
