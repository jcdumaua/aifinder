# AiFinder Phase 26MI — Authorization-Consumption Placement Record

- Authorization-consumption line: `307`
- Candidate-invocation line: `318`

```text
0304:   chmod 0600 "$raw_file"
0305:
0306:   {
0307:     printf 'authorization=CONSUMED
0308: '
0309:     printf 'candidate_sha256=%s
0310: ' "$EXPECTED_CANDIDATE_SHA256"
```

The implementation gate must preserve consumption before the begin marker and invocation.
