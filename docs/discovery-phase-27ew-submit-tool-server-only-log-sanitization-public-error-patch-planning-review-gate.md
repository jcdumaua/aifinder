# AiFinder Phase 27EW — Submit Tool Server-Only, Log-Sanitization, and Public-Error Patch Planning Review Gate

## Status
`PENDING_GEMINI_REVIEW`

## Baseline
```text
Commit: bb2e27ec4f26c734c6a7f1c66f63f4ec0ee26ad9
Authorized workstream: AUTHORIZE_SUBMIT_TOOL_SERVER_ONLY_LOG_SANITIZATION_AND_PUBLIC_ERROR_PATCH_PLANNING
Source inspection: AUTHORIZED_AND_COMPLETED
Source modification: NOT_AUTHORIZED
Test modification: NOT_AUTHORIZED
Test execution: NOT_AUTHORIZED
Runtime posture: DORMANT
```

## Preserved Identities
```text
app/api/submit-tool/route.ts|99f74337fadaf7ba432a2e6daa9e3b3fa07cd5fa43ba07093024ccb929f77930|mode=100644
lib/tool-validation.ts|8eeb0d48673ca7e2f468a636e9d4a87958e5a99388c420fbdb7023284b5c0fba|mode=100644
testing/submit-tool-secret-safe-boundary-static-assertions.mjs|3e90f42d30dc4187302e100ea63fabcb7f526744ecbb641db70a8a8e43c3d5ec|mode=100644
```

## Error Classification Design

Expected and unexpected errors must be distinguished by **explicit type**, never by arbitrary message matching.

### Expected validation errors

Introduce a route-local typed error class:

```text
SubmitToolValidationError
- code: bounded route-owned enum
- publicMessage: fixed or validation-derived bounded user-safe message
- status: 400 | 415 | 413
```

Only request and field-validation failures that are deliberately wrapped as `SubmitToolValidationError` may expose a user-facing message.

Allowed expected categories:

```text
invalid_content_type
request_too_large
invalid_request_body
invalid_name
invalid_category
invalid_description
invalid_submitter_name
invalid_submitter_email
invalid_pricing
invalid_website
invalid_logo_url
unsafe_content
duplicate_submission
rate_limited
```

The route should convert errors thrown by the existing validation dependency into `SubmitToolValidationError` at the narrow validation boundary. The dependency itself remains unchanged.

### Unexpected system errors

Every error not explicitly classified as `SubmitToolValidationError` is unexpected.

Unexpected categories include:

- Supabase query or mutation failures;
- configuration failures;
- client-construction failures;
- unforeseen parsing or programming errors;
- any unknown thrown value.

Unexpected errors must:

- never expose `error.message`, stack, cause, query details, environment values, or Supabase metadata;
- emit only a fixed categorical log event;
- return one fixed generic public message.

```text
PUBLIC_MESSAGE="Submission failed. Please try again later."
LOG_EVENT="submit_tool_unexpected_failure"
```

## Minimal Patch Design

The patch must be restricted to `app/api/submit-tool/route.ts`.

1. Add:
   ```ts
   import "server-only";
   ```

2. Add a route-local typed validation error class and bounded code enum.

3. Wrap only expected input-validation failures at the validation boundary.

4. Replace these dynamic database log patterns:

   ```text
   toolsError.message
   submissionsError.message
   error.message
   ```

   with fixed categorical events:

   ```text
   submit_tool_duplicate_tools_check_failed
   submit_tool_duplicate_submissions_check_failed
   submit_tool_insert_failed
   submit_tool_unexpected_failure
   ```

5. Change the outer catch:

   - `SubmitToolValidationError` → bounded `publicMessage` and bounded status;
   - every other error → fixed generic 500 response.

6. Preserve unchanged:

   - Supabase service-role containment;
   - `persistSession: false`;
   - rate limiting;
   - request-size limits;
   - JSON content-type enforcement;
   - honeypot behavior;
   - duplicate-domain checks;
   - mutation target `submitted_tools`;
   - no-store and nosniff headers;
   - validation dependency behavior;
   - successful public responses.

## Explicit Non-Goals

- no changes to `lib/tool-validation.ts`;
- no database schema or migration change;
- no rate-limit redesign;
- no CSRF requirement added to this public submission endpoint in this phase;
- no authentication requirement;
- no runtime test;
- no logging of submitted data, IP values, environment values, or database details;
- no refactor outside the selected route.

## Expected Focused-Test Transition

```text
BEFORE:
- missing server-only boundary
- dynamic database-message logging present
- dynamic unexpected error response present

AFTER:
- server-only present
- fixed categorical logging only
- typed expected validation errors only
- fixed generic unexpected public response
- all 39 static assertions pass
```

## Patch Review Constraints

The future source patch must be rejected unless:

- only `app/api/submit-tool/route.ts` changes;
- `lib/tool-validation.ts` and `testing/submit-tool-secret-safe-boundary-static-assertions.mjs` remain byte-identical;
- all database `.message` logging is removed;
- no raw error object or dynamic unexpected error text reaches the public response;
- all existing safeguards remain structurally present.

## Recommended Successor
```text
AUTHORIZE_SUBMIT_TOOL_ROUTE_PATCH_AND_FOCUSED_RETEST
```

## System Layer Progress Report
- Governance / phase control: `SUBMIT_TOOL_PATCH_PLAN_PENDING_REVIEW`
- Static verification: `FAILING_BASELINE_COMMITTED`
- Documentation continuity: `PRESERVED`
- Runtime validation harness discipline: `DORMANT`
- Security hardening: `PATCH_DESIGN_COMPLETE`
- Service-role isolation: `PRESERVE`
- Public route safety: `ACTIVE_REMEDIATION`
- Secret-safe logging: `FIXED_CATEGORICAL_DESIGN`
- Public error surface: `TYPED_EXPECTED_GENERIC_UNEXPECTED_DESIGN`
- Validation safeguards: `PRESERVE_UNCHANGED`
- Database mutation: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`
- Public launch readiness: `NOT_READY_FOR_PUBLIC_LAUNCH`
- Overall Discovery Engine progress: `99%`

## Gemini Review Request
Select exactly one:
- `APPROVE_PHASE_27EW_SUBMIT_TOOL_PATCH_PLAN`
- `REQUEST_CHANGES_PHASE_27EW_ERROR_CLASSIFICATION_OR_PATCH_SCOPE`
- `BLOCK_PHASE_27EW_PENDING_VALIDATION_CONTRACT_RECONCILIATION`

If approving, select:
- `AUTHORIZE_SUBMIT_TOOL_ROUTE_PATCH_AND_FOCUSED_RETEST`
- `AUTHORIZE_SUBMIT_TOOL_ROUTE_PATCH_ONLY`
- `SELECT_SUBMIT_TOOL_PATCH_DRAFT_REVIEW_FIRST`
- `REQUEST_DIFFERENT_SUCCESSOR`

State explicitly whether `app/api/submit-tool/route.ts` may be modified and whether focused execution of only `testing/submit-tool-secret-safe-boundary-static-assertions.mjs` is authorized. Unless explicitly stated, both remain prohibited.
