# AiFinder Phase 26CH — GAP-060–GAP-062 Timeout Human Decision Contract

## Status

DOCUMENTATION-ONLY HUMAN-DECISION CONTRACT.

## Required decision form

The authorized human must provide exactly one integer from `5` through `30`.

The decision must not include:

- token values;
- project or team selector values;
- environment contents;
- live-request authorization;
- candidate execution authorization;
- deployment or mutation approval.

## Validation rules

A future timeout insertion gate must fail closed unless the supplied decision:

1. contains one base-10 integer only;
2. is within `5–30`;
3. is explicitly identified as the fixed timeout in seconds;
4. is not inferred from prose, environment state, network measurements, or defaults;
5. is separately approved before candidate modification.

## Separation of authority

Selecting the timeout does not authorize:

- applying the timeout patch;
- collecting operator confirmations;
- loading token or selector references;
- executing the candidate;
- sending the one permitted request;
- operational reactivation.

Each remains a later, separately reviewed boundary.
