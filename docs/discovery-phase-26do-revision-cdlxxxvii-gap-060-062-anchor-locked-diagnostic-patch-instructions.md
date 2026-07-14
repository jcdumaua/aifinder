# AiFinder Phase 26DO — GAP-060–GAP-062 Anchor-Locked Diagnostic Patch Instructions

## Status

DOCUMENTATION-ONLY PATCH INSTRUCTIONS.

## Candidate anchor

- Repository baseline: `05088496f68fc111af0409f165dcf03c5b2cea31`
- Candidate SHA-256: `b6015959e32c3fd09756a51417dc9b503323e4befe6cef611ce2fc529852da2e`
- Mode: `100644`
- Executable: `NO`

## Insertion A

Insert exactly between:

```bash
esac

raw_file="$(mktemp)"
```

Insert:

```bash
printf "DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED\n"
```

## Insertion B

Insert exactly between:

```bash
curl_rc=$?

token="[REDACTED]"
```

Insert:

```bash
printf "DIAGNOSTIC_TRACE: CURL_EXIT=%d HTTP_CODE=%s\n" "$curl_rc" "$http_code"
```

## Insertion C

Replace:

```python
except Exception:
    emit(
```

with:

```python
except Exception as e:
    sys.stderr.write(f"DIAGNOSTIC_TRACE: PARSER_EXCEPTION={type(e).__name__}\n")
    emit(
```

## Boundary

No other line or behavior may change.
