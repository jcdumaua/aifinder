# AiFinder Phase 26OB — GAP-060–062 Single-Use Human Authorization Marker Specification

## Exact authorization marker token

The wrapper requires the exact literal token:

```text
AUTHORIZED_EXACTLY_ONE_INVOCATION
```

No alternate spelling, abbreviation, whitespace-normalized variant, placeholder, or semantic equivalent is valid.

## Required marker properties

A valid future human authorization marker must:

- be explicit and unambiguous;
- name GAP-060–062;
- bind repository baseline `abe7cab5ce519f0f96e74926539556d6a929ff95`;
- bind candidate SHA-256 `188912db8e2c566eddcd31ab7c9dc6012955447edc37077a1603599657bfc09b`;
- bind wrapper SHA-256 `412f1945ba77d54e7b23533c0c139c681ba4e5026a15a25f41a072af2f807d89`;
- authorize exactly one wrapper invocation;
- authorize only a read-only metadata request;
- set timeout to `15` seconds;
- set retries to `0`;
- prohibit redirects;
- prohibit team context;
- prohibit response-body output;
- prohibit token, selector, header, cookie, credential, and environment-value output;
- prohibit database access or mutation;
- prohibit server startup and route invocation;
- prohibit deployment, publishing, and operational reactivation;
- state that authorization is consumed regardless of success or failure;
- prohibit automatic retry.

## Example authorization structure

```text
I explicitly authorize exactly one GAP-060–062 single-use read-only metadata wrapper invocation at repository baseline abe7cab5ce519f0f96e74926539556d6a929ff95, candidate SHA-256 188912db8e2c566eddcd31ab7c9dc6012955447edc37077a1603599657bfc09b, and wrapper SHA-256 412f1945ba77d54e7b23533c0c139c681ba4e5026a15a25f41a072af2f807d89, with timeout 15 seconds, zero retries, redirects disabled, no team context, body-free sanitized output only, no secret or environment-value output, no database or deployment action, and no operational reactivation. This authorization is consumed whether the attempt succeeds or fails.
```

This document defines the marker but does not grant it.
