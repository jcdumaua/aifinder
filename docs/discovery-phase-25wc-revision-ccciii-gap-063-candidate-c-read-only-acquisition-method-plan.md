# AiFinder Phase 25WC — Revision CCCIII — GAP-063 Candidate C Read-Only Acquisition Method Plan

## Purpose

Define the structure of a future read-only Candidate C acquisition method without selecting a live platform surface, endpoint, credential, or command.

## Planned method stages

A future separately approved acquisition method must use these stages:

1. **Identity verification**
   - Confirm the approved AiFinder deployment boundary without preserving a project reference.
   - Confirm the operator is using the approved read-only access context.

2. **Surface isolation**
   - Navigate only to the minimum approved platform surface.
   - Avoid unrelated settings, logs, environment views, secret stores, and account details.

3. **Read-only observation**
   - Observe only the control-state field needed for `SEC-LR-011`.
   - Do not toggle, save, deploy, rotate, regenerate, test, or invoke anything.

4. **Evidence capture**
   - Capture only the minimum approved representation.
   - Preserve timestamp and provenance.
   - Avoid raw API responses and full-page exports when a narrower representation is available.

5. **Immediate redaction**
   - Remove project references, account identifiers, internal URLs, personal information, and unrelated configuration.
   - Reject the evidence if required redaction would make the control state unintelligible.

6. **Mutation verification**
   - Confirm mutation count is zero.
   - Confirm no settings, policies, deployments, or data changed.

7. **Independent redaction review**
   - Require a second reviewer before the package is accepted.

## Prohibited method details

This phase does not select or authorize:

- A platform URL.
- A project reference.
- Login credentials.
- An API endpoint.
- A command.
- A browser-automation flow.
- A database query.
- A route.
- A production mutation.
- An export or screenshot action.

## Result

The method structure is planned. Evidence acquisition remains `NOT_AUTHORIZED`.
