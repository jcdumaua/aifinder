# Phase 26TX — Static RLS Table and Policy Coverage Map

## Bound baseline

`c5ba2e534f81b64743f4d66e66daab5b57f1979b`

## Coverage method

Each table discovered in committed SQL should be classified against:

- RLS enabled statement;
- RLS forced statement where required;
- SELECT policy;
- INSERT policy;
- UPDATE policy;
- DELETE policy;
- target roles;
- permissive or restrictive behavior;
- service-role bypass assumptions;
- migration ordering.

## Coverage states

- `STATIC_RLS_AND_POLICY_EVIDENCE_PRESENT`
- `RLS_ENABLED_POLICY_COVERAGE_INCOMPLETE`
- `TABLE_DEFINED_NO_RLS_EVIDENCE_FOUND`
- `POLICY_PRESENT_TABLE_OR_ROLE_MAPPING_UNCLEAR`
- `SERVICE_ROLE_ONLY_INTERNAL_TABLE`
- `NOT_LAUNCH_RELEVANT_WITH_REVIEWED_RATIONALE`
- `REQUIRES_DEPLOYED_METADATA_VERIFICATION`

## Fail-closed rules

A launch-relevant table remains blocked when:

- no RLS enablement is found;
- policy command coverage is incomplete;
- target roles are ambiguous;
- public access is broader than intended;
- migration order may temporarily expose the table;
- service-role bypass is relied on without server-only containment;
- source and deployed state have not been reconciled.

## Static conclusion

The static inventory is sufficient to prepare a precise table-by-table review, but not to claim production RLS readiness.

## Current state

- Static RLS source inventory: `COMPLETE`
- Table-by-table final disposition: `PENDING_GEMINI_REVIEW`
- Deployed RLS metadata verification: `NOT_AUTHORIZED`
- Row data access: `PROHIBITED`
- Security readiness: `NOT_ESTABLISHED`
