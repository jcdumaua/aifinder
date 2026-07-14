# AiFinder Phase 26MG — Wrapper Producer-Marker Insertion Anchor

- Candidate invocation line: `318`
- Proposed begin marker: `WRAPPER_TRACE: CANDIDATE_INVOCATION_BEGIN`
- Proposed return marker: `WRAPPER_TRACE: CANDIDATE_INVOCATION_RETURNED STATUS=<integer>`

```text
0315:
0316:   # EXACTLY ONE candidate invocation. Never retry.
0317:   set +e
0318:   bash "$CANDIDATE_PATH" >"$raw_file" 2>&1
0319:   candidate_rc=$?
0320:   set -e
0321:
```
