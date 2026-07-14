# AiFinder Phase 26MH — Sanitizer Producer-Marker Admission Anchor

- Sanitizer fixed-marker line: `86`
- Proposed admitted producer markers:
  - `WRAPPER_TRACE: CANDIDATE_INVOCATION_BEGIN`
  - `WRAPPER_TRACE: CANDIDATE_INVOCATION_RETURNED STATUS=<integer>`

Admission must be exact, single-use, body-free, and duplicate-rejecting.

```text
0083: out_path = Path(os.environ["SANITIZED_FILE"])
0084: lines = raw_path.read_text(errors="replace").splitlines()
0085:
0086: fixed_marker = "STOPPED_FAIL_CLOSED"
0087: patterns = {
0088:     "preflight": re.compile(r"^DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED$"),
0089:     "curl": re.compile(r"^DIAGNOSTIC_TRACE: CURL_EXIT=[0-9]+ HTTP_CODE=(?:[0-9]{3}|000|unavailable|UNKNOWN)$"),
```
