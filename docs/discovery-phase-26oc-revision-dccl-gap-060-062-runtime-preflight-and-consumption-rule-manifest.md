# AiFinder Phase 26OC — GAP-060–062 Runtime Preflight and Consumption Rule Manifest

## Ordered preflight

A future authorized gate must perform these checks in order:

1. Verify repository path, origin, branch, and clean synchronized baseline.
2. Verify candidate and wrapper SHA-256 identities.
3. Verify both files remain mode `100644` and non-executable.
4. Verify `bash -n` for both files.
5. Verify the exact human authorization marker is present and bound to current identities.
6. Mark the authorization as consumed before any environment-presence check.
7. Check only presence or absence of:
   - `AIFINDER_VERCEL_READ_ONLY_TOKEN`
   - `AIFINDER_VERCEL_PROJECT_SELECTOR`
   - `AIFINDER_VERCEL_TEAM_SELECTOR`
8. Require token and project selector to be present.
9. Require team selector to be absent.
10. Invoke the wrapper exactly once.
11. Capture only allowlisted body-free output and exit status.
12. Stop permanently after the first attempt.

## Secure authorization-consumption log

Before environment preflight, the authorized gate must create:

```text
/private/tmp/aifinder-single-use-consumed-${timestamp}.txt
```

Required behavior:

- generate `${timestamp}` with `date -u`;
- write `consumed_at_utc` in ISO-8601 UTC format `%Y-%m-%dT%H:%M:%SZ`;
- apply permission mode `0600` immediately after creation;
- create and secure the log before checking environment-variable presence;
- never write the authorization token, environment values, selectors, credentials, or response content into the log.

## Consumption rule

The authorization is consumed:

- before environment-presence inspection;
- before candidate or wrapper invocation;
- regardless of preflight success or failure;
- regardless of network success or failure;
- regardless of sanitizer disposition.

No retry or reuse is allowed.
