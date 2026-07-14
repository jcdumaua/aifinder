# AiFinder Phase 26NB — BASELINE_MISMATCH Occurrence Context Inventory

## Result

`ANALYSIS COMPLETE`

## Repository and identity anchors

- Repository baseline: `79e36863ec438c43686fb208c680b4dd6ca9d57e`
- Candidate: `scripts/discovery-gap-060-062-read-only-metadata-check-candidate.sh`
- Candidate SHA-256: `e27462d33a8a89b9b79f94c8d584fe8883518b91e51fb9531d3652d047775bfb`
- Wrapper: `scripts/discovery-gap-060-062-read-only-metadata-check-single-use-wrapper.sh`
- Wrapper SHA-256: `475036a9e9147158344200addd7ecf55bf2b87cac161cc49bfb93d37c482ed5c`

## Classification matrix

| Occurrence | Line | Structural role | Classification |
|---|---:|---|---|
| 1 | 30 | Case label for `BASELINE_MISMATCH` | Passive |
| 2 | 31 | Case label for `REMOTE_BASELINE_MISMATCH` | Passive |
| 3 | 80 | Local baseline failure call site | Active executable producer |
| 4 | 82 | Remote baseline failure call site | Active executable producer |

## Exact local producer

The executable emission site for the local `BASELINE_MISMATCH` token is line 80.

Its exact enclosing two-line block is:

```text
0079:   [[ "$(git rev-parse HEAD)" == "$APPROVED_BASELINE" ]] \
0080:      || fail "BASELINE_MISMATCH" || return 1
```

This block compares the current local `HEAD` with `$APPROVED_BASELINE`. A mismatch invokes the symbolic `fail()` helper and returns fail-closed.

## Distinct remote producer

Line 82 emits the distinct symbol `REMOTE_BASELINE_MISMATCH`.

It is not part of the local lines 79–80 block and must remain independently preserved during local-baseline reconciliation planning.

## Allowlist versus producer boundary

Lines 30–31 are passive case labels used by validation or routing logic.

Lines 80 and 82 are active runtime failure call sites.

The passive and active occurrences must not be conflated when selecting exact replacement bytes.

## Historical and authorization boundaries

- Phase 26LC historical evidence remains unchanged.
- This inventory does not authorize candidate or wrapper modification.
- This inventory does not authorize candidate or wrapper execution.
- Consumed live authorization remains consumed.
- Live operations authorized: `0`
- Operational reactivation: `BLOCKED`

## Independent review

Gemini Senior Reviewer determination: `ANALYSIS COMPLETE`.

Gemini verified:

- lines 30–31 are passive allowlist or mapping logic;
- line 80 is the active local `BASELINE_MISMATCH` producer;
- line 82 is the active `REMOTE_BASELINE_MISMATCH` producer;
- the exact local producer block is lines 79–80;
- no source modification, execution, or live interaction occurred.

## Safe successor

Use the exact lines 79–80 boundary for a separately reviewed byte-locked local-baseline reconciliation plan.

The remote baseline producer at line 82 must remain unchanged.

No source implementation or live execution is authorized by this record.
