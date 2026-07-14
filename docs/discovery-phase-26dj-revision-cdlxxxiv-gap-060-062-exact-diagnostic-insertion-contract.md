# AiFinder Phase 26DJ — GAP-060–GAP-062 Exact Diagnostic Insertion Contract

## Status

DOCUMENTATION-ONLY INSERTION CONTRACT.

## Insertion A

Place immediately after all static preflight assertions pass and before temporary request files are initialized:

```bash
printf "DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED\n"
```

## Insertion B

Place immediately after `curl_rc` and `http_code` are assigned and before any transport or HTTP-status branch:

```bash
printf "DIAGNOSTIC_TRACE: CURL_EXIT=%d HTTP_CODE=%s\n" "$curl_rc" "$http_code"
```

## Insertion C

Inside the Python parser `except Exception as e:` block, before returning parser failure:

```python
sys.stderr.write(f"DIAGNOSTIC_TRACE: PARSER_EXCEPTION={type(e).__name__}\n")
```

If the current parser uses `except Exception:` without a bound variable, the future patch may change only that clause to `except Exception as e:` as required by this trace.

## Non-expansion rule

No other control flow, request behavior, parsing logic, output field, timeout, retry, redirect, or authorization behavior may change.
