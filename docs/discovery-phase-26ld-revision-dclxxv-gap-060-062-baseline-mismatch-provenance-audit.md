# AiFinder Phase 26LD — Baseline-Mismatch Provenance Audit

- Baseline: `42d684fd04fdbbfc9b1aabcd66141580c6fe351f`
- Candidate SHA-256: `e27462d33a8a89b9b79f94c8d584fe8883518b91e51fb9531d3652d047775bfb`
- Wrapper SHA-256: `475036a9e9147158344200addd7ecf55bf2b87cac161cc49bfb93d37c482ed5c`
- Provenance classification: `AMBIGUOUS_SHARED_SYMBOL`
- Wrapper can emit `BASELINE_MISMATCH` before candidate invocation: `TRUE`
- Candidate can emit `BASELINE_MISMATCH`: `TRUE`
- Candidate invocation proven by the sanitized pair alone: `FALSE`

Safe conclusion: The symbolic pair alone does not prove which producer emitted BASELINE_MISMATCH.
