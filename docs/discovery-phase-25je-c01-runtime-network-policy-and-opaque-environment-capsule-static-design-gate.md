# Phase 25JE — C01 Runtime Network Policy and Opaque Environment Capsule Static Design Gate

## Phase identity

- Phase: `25JE`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static network and environment design
- Approved predecessor phase: `25JD`
- Approved predecessor commit: `c6b0e3e771afdb3157dab6c2041e1cc361036ead`
- Phase 25JD artifact SHA-256: `94a6c9f657720e993c454f045d2b1f177717fd36c5b51d97b7238c0390e3b6f8`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- C01 route source: `app/api/homepage-control/published/route.ts`
- C01 local closure digest: `83a61de2f228d71d22481f77a54abd33a04b8ea7c1dd581ae521ae64dc1f8f7c`
- C01 environment-identifier inventory digest: `5857d539fb63ecfad9e6b3a9133ff314cb8459edc80c97818822208cfa680682`
- Environment-value access in this phase: `NONE`
- Network activity in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JE defines the minimum C01 runtime network policy and opaque environment-capsule design required by the isolated production-mode validation architecture.

This phase reads only tracked source and governance files. It inventories environment identifier names from the C01 local dependency closure without opening `.env` files, reading environment values, checking value presence, measuring value lengths, hashing values, resolving destinations, testing network access, invoking `sandbox-exec`, building or starting the application, invoking C01 or C02, accessing a database, installing packages, modifying source code, implementing a harness, committing, or pushing.

## Static predecessor and source verification

| Static invariant | State | Evidence |
|---|---|---|
| `baseline-head` | `PASS` | HEAD matches the approved Phase 25JD commit. |
| `baseline-origin` | `PASS` | origin/main matches the approved Phase 25JD commit. |
| `phase25jd-artifact-present` | `PASS` | Phase 25JD artifact is present. |
| `phase25jd-artifact-sha` | `PASS` | Phase 25JD artifact SHA-256 matches the approved record. |
| `phase25jd-current-commit-identity` | `PASS` | Phase 25JD artifact is unchanged at the current baseline. |
| `phase25jd-required-markers` | `PASS` | Phase 25JD implementation, environment, network, and safety markers are preserved. |
| `tracked-file-inventory` | `PASS` | Tracked file inventory is readable. |
| `c01-route-unique` | `PASS` | Exactly one tracked C01 route source is identified. |
| `c01-closure-nonempty` | `PASS` | The tracked C01 local dependency closure is non-empty. |
| `c01-local-import-resolution` | `PASS` | All relative and approved alias imports in the C01 closure resolve to tracked source files. |
| `c01-env-identifier-inventory` | `PASS` | At least one source-derived environment identifier is present in the C01 closure. |
| `c01-url-identifier-candidate` | `PASS` | At least one source-derived URL identifier is available for private destination derivation. |
| `tool-sandbox-exec` | `PASS` | sandbox-exec is available on the host. |
| `tool-dscacheutil` | `PASS` | dscacheutil is available on the host. |
| `tool-scutil` | `PASS` | scutil is available on the host. |
| `tool-lsof` | `PASS` | lsof is available on the host. |
| `tool-python3` | `PASS` | python3 is available on the host. |

## C01 tracked local dependency closure

| C01 closure file | SHA-256 | Environment identifiers | Network indicators |
|---|---|---|---|
| `app/api/homepage-control/published/route.ts` | `c7242b326a71eb54f14d72dc060f7d13709bafcb7cac753329cb42551dc05289` | None | None |
| `lib/homepage-control-public.ts` | `e9e2e5acdca6ebd7dcd26cd3883119a41153945c1fa7556bde0ed2b591cb4a71` | None | None |
| `lib/homepage-control-types.ts` | `82f0171bbaf5a28fc5475355b7bb7ddcacfd4023b52d712b7dc2c83244215f91` | None | None |
| `app/data/tools.ts` | `4cbd06d987e2a20ffe2fa1b1aa2a368335233b58fae2077b1afa0c6e96c067b4` | None | `url-construction` |
| `lib/homepage-control-parser.ts` | `1d681e10139e978adaf8b30c932e9827be871b62ebb06e4f6a9ddacf71f53299` | None | None |
| `lib/homepage-control-schema.ts` | `6f4c1d9252a8a12011881616e4218aaf956dbf290679804978f51a272287df31` | None | None |
| `lib/homepage-control-validation.ts` | `337741f139ee2351abbaae9efea572deafc5b97bad721c539502fdfa49663c22` | None | None |
| `lib/public-tool-adapter.ts` | `a27e0c8e0459f3c280c955b76cd8de86b2ab61c0641acf375e6de5307497f565` | None | None |
| `lib/supabase-admin.ts` | `f48a3c80c6f66f32affa6b84460cfa539c4c5bc84719bea1fc5013fe17760637` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `supabase-client` |
| `components/public/tool-card.tsx` | `6e9add11d92b49f2d6dc7cbac5314cdd840b182eca592295eff2bbf655cb33fe` | None | None |
| `lib/tool-categories.ts` | `5d7ae105a6539b070cdc214316ec37f2f2970c0a377ceef761e159d3cb619046` | None | None |
| `components/ui/badge.tsx` | `46a0de5224f6a5d5d63d45246534288518dce888f031064bff925bbc7fe6ad97` | None | None |
| `components/ui/button.tsx` | `cc36af0f8b5019c33cc039fbf03bb952a513072b15b55b53c592b78af3e5f4c4` | None | None |
| `components/ui/card.tsx` | `0cc9420f39823ff1f999007ec24ee54190a719ecefdbab247b848e4ea8febb44` | None | None |
| `lib/utils.ts` | `7c8c3dfc0cdd370d44932828eb067ef771c8fe7996693221d5d4b90af6d54f2d` | None | None |

## Source-derived environment identifier inventory

### URL candidates

- `NEXT_PUBLIC_SUPABASE_URL`

### Public/client-visible identifiers

- `NEXT_PUBLIC_SUPABASE_URL`

### Credential-like identifiers

- `SUPABASE_SERVICE_ROLE_KEY`

### Other identifiers

None identified.

This inventory contains identifier names only. It does not establish that a value exists, that a value is valid, or that an identifier is required at build or runtime.

## Host network-policy tool inventory

| Tool | Resolved path | SHA-256 | Bytes |
|---|---|---|---:|
| `sandbox-exec` | `/usr/bin/sandbox-exec` | `f3162ae11789a5b296bb3850d493c33ddd52053a03f984b2c4bc34004f4fee99` | 102560 |
| `dscacheutil` | `/usr/bin/dscacheutil` | `db78070410683eeb53321f7f80346acc244f312b064a7683b2a1818b4b79ca04` | 137664 |
| `scutil` | `/usr/sbin/scutil` | `5ef054cd050afbc7fd971445add31a6e5cc6fef8ca24f86e2e440b2770c3bdbb` | 579632 |
| `lsof` | `/usr/sbin/lsof` | `5861dad96c4053a6b4b263d20e23b3a8215476a38a55ec1a8e05f4638e9b890c` | 307600 |
| `python3` | `/usr/bin/python3` | `a961f78075d8e7621ef4f5d764c64ef8a41bf66c0a98ab5cb6ca39b85ce31c93` | 118880 |

Tool presence is static planning evidence only. No tool was invoked for cloning, sandboxing, DNS resolution, network testing, or process inspection.

## Environment-capsule decision

Selected design:

`IN_MEMORY_EXACT_NAME_ALLOWLIST_CAPSULE`

Implementation status:

`DESIGNED_NOT_IMPLEMENTED`

### Capsule construction

A future authorized Python supervisor may construct child-process environments directly from `os.environ` only after a dedicated preflight and fresh human authorization permit private value handling.

Rules:

1. the shell must never expand or interpolate protected values;
2. the supervisor may look up only exact approved identifier names;
3. the supervisor must construct a new child environment dictionary instead of forwarding the parent environment;
4. protected values remain memory-only;
5. protected values must not be printed, logged, copied to the clipboard, written to a file, hashed, compared, measured, or retained in an artifact;
6. the result artifact may record only identifier names already present in tracked source and aggregate states such as `present`, `missing`, or `invalid`, without value-derived detail;
7. missing, empty, malformed, duplicated, or unapproved identifiers cause fail-closed termination;
8. shell tracing and commands that print environments are prohibited;
9. crash handlers must not serialize the child environment;
10. all child processes must receive only the stage-specific capsule.

### Non-secret control environment

A future build or runtime child may receive only separately approved non-secret controls such as:

- `PATH` with exact reviewed tool directories;
- disposable `HOME`;
- disposable cache paths;
- `CI=1`;
- `NEXT_TELEMETRY_DISABLED=1`;
- `NODE_ENV=production`;
- exact loopback host and approved port;
- locale controls required for deterministic output.

Proxy variables, cloud metadata variables, shell startup variables, debugging variables, and unrelated inherited variables are prohibited unless separately approved.

## Stage-specific identifier policy

### Build capsule

Proposed source-derived allowlist:

- identifiers beginning with `NEXT_PUBLIC_` that are proven by a later static preflight to be required by the production build;
- no credential-like non-public identifier;
- no runtime-only secret;
- no proxy variable.

Build capsule state:

`BUILD_IDENTIFIER_ALLOWLIST_REQUIRES_STATIC_USAGE_CLASSIFICATION`

The future build remains network-denied. A missing build identifier must fail closed rather than cause fallback to the full parent environment.

### Startup capsule

The production server may receive only identifiers proven necessary to initialize the approved C01 route and its dependency closure.

Startup must occur under a zero-external-egress policy. If an identifier causes the application to require external network activity before readiness, startup fails closed.

Startup capsule state:

`STARTUP_IDENTIFIER_ALLOWLIST_REQUIRES_STATIC_USAGE_CLASSIFICATION`

### C01 request capsule

The request-stage process retains the exact approved runtime capsule. No identifier may be added after startup.

C01 request capsule state:

`RUNTIME_IDENTIFIER_ALLOWLIST_REQUIRES_PREFLIGHT_APPROVAL`

## Private destination derivation

A future authorized supervisor may privately derive the C01 destination only from one explicitly selected source-derived URL identifier.

No URL identifier is selected for value access by Phase 25JE.

Future derivation rules:

1. exactly one approved URL identifier;
2. value read privately in memory only;
3. UTF-8 text with no control characters;
4. scheme exactly `https`;
5. no username or password component;
6. hostname required and normalized to lowercase IDNA ASCII;
7. hostname must not be an IP literal;
8. port absent or exactly `443`;
9. path empty or `/`;
10. query and fragment absent;
11. default accepted domain form is a project subdomain under `.supabase.co`;
12. any custom domain requires a separate static approval before value access;
13. normalized hostname, URL, IP addresses, and resolver answers must not be printed or retained;
14. retained metadata is limited to policy result, address-family counts, destination-set hash, and expiration state;
15. a malformed or nonconforming value causes `DESTINATION_POLICY_REJECTED`.

Destination derivation state:

`PRIVATE_VALUE_DERIVATION_NOT_AUTHORIZED`

## Runtime network stages

### Stage A — Production build

Policy:

`DENY_ALL_NETWORK`

Enforcement candidate:

`SANDBOX_EXEC_DENY_NETWORK_PROFILE`

No unsandboxed fallback is permitted.

### Stage B — Server startup and readiness

Policy:

`LOOPBACK_ONLY_ZERO_HTTP_REQUESTS`

Allowed activity:

- process-local IPC required by the reviewed runtime;
- listener binding to exact `127.0.0.1:<approved-port>`;
- validation supervisor connection to the local listener only after the approved readiness barrier, if a future preflight requires a listener-level check without HTTP.

Prohibited activity:

- external TCP or UDP;
- application HTTP probes;
- DNS-dependent external initialization;
- telemetry;
- package or update checks;
- metadata-service access.

Any attempted external startup egress causes fail-closed termination.

### Stage C — Single C01 request

Policy candidate:

`LOOPBACK_PLUS_ONE_PRIVATE_DERIVED_SUPABASE_DESTINATION`

The validation client connects only to the loopback application route. The application process may connect only to the privately derived approved Supabase destination set on TCP port `443`.

No direct validation-client database or Supabase request is allowed.

## Dynamic egress profile design

Selected enforcement candidate:

`GENERATED_SANDBOX_EXEC_ADDRESS_ALLOWLIST`

Future authorized sequence:

1. privately validate the selected URL value;
2. privately resolve A and AAAA records through the operating system resolver;
3. reject empty, loopback, link-local, multicast, private, documentation, or otherwise non-public address results;
4. freeze the unique address set for the one execution attempt;
5. generate a temporary runtime sandbox profile allowing:
   - loopback traffic;
   - exact frozen destination addresses on TCP port `443`;
   - only resolver-related operating-system behavior proven necessary by the capability preflight;
6. deny all other network access;
7. start the production server inside the profile;
8. verify the profile remains attached to the complete process group;
9. record only address-family counts and a canonical destination-set SHA-256;
10. delete the profile and all destination metadata after completion.

Capability status:

`UNPROVEN_REQUIRES_HOST_CAPABILITY_PREFLIGHT`

The implementation must not assume that `sandbox-exec` can enforce every rule. If exact loopback and destination restrictions cannot be proven without privilege escalation, the redesigned host architecture remains blocked. No weaker fallback is allowed.

## DNS and address-change policy

Future policy:

- initial resolution occurs once immediately before profile generation;
- duplicate results are removed;
- TTL metadata may be used privately but not retained as raw resolver output;
- the frozen set is immutable for the attempt;
- the application may not broaden the set;
- post-run private resolution may compare only a canonical set hash;
- a changed set does not trigger a retry;
- a changed set produces `DESTINATION_SET_CHANGED`;
- DNS failure produces `DESTINATION_RESOLUTION_FAILED`;
- unexpected family, address class, port, or host form produces fail-closed termination.

No DNS lookup is performed by Phase 25JE.

## Proxy and indirect-egress policy

The future child environment must remove or reject:

- `HTTP_PROXY`;
- `HTTPS_PROXY`;
- `ALL_PROXY`;
- lowercase equivalents;
- unapproved `NO_PROXY` values;
- Node preload or custom CA variables;
- package-manager proxy variables;
- cloud metadata endpoint overrides.

The approved loopback host may be represented only by an exact internally constructed `NO_PROXY` value if a future preflight proves it necessary.

Any inherited proxy or preload control outside the exact allowlist causes:

`UNAPPROVED_EGRESS_CONTROL_PRESENT`

## TLS policy

The application must retain normal Node.js hostname and certificate validation.

Prohibited:

- disabling certificate verification;
- custom trust material not approved by static identity;
- hostname-to-IP URL substitution;
- plaintext HTTP;
- redirects to another authority;
- validation-only TLS bypasses.

A TLS or authority mismatch fails closed.

## Connection evidence

Allowed metadata only:

- network policy identifier;
- selected URL-identifier name;
- destination policy pass or fail;
- IPv4 and IPv6 result counts;
- canonical destination-set hash;
- allowed destination count;
- denied-connection count if safely available;
- C01 request issued state;
- response status, byte count, content type, duration, and body hash;
- cleanup and profile-deletion states.

Prohibited:

- URL values;
- hostnames;
- IP addresses;
- resolver output;
- certificate contents;
- request or response headers;
- response bodies;
- database rows;
- credential values;
- environment values or value-derived hashes.

## Required future static classification

Before implementation, a later static phase must classify every source-derived identifier as one of:

- `BUILD_REQUIRED_PUBLIC`;
- `RUNTIME_REQUIRED_PUBLIC`;
- `RUNTIME_REQUIRED_PROTECTED`;
- `CONTROL_NONSECRET`;
- `NOT_REQUIRED`;
- `AMBIGUOUS_BLOCKED`.

Any ambiguous identifier remains excluded and blocks the stage that requires it.

## Named fail-closed codes

The future policy must include at least:

- `ENV_IDENTIFIER_ALLOWLIST_MISMATCH`
- `ENV_IDENTIFIER_MISSING`
- `ENV_IDENTIFIER_EMPTY`
- `ENV_IDENTIFIER_VALUE_ACCESS_NOT_AUTHORIZED`
- `UNAPPROVED_PARENT_ENVIRONMENT_PRESENT`
- `UNAPPROVED_EGRESS_CONTROL_PRESENT`
- `DESTINATION_IDENTIFIER_NOT_SELECTED`
- `MULTIPLE_DESTINATION_IDENTIFIERS`
- `DESTINATION_POLICY_REJECTED`
- `CUSTOM_DOMAIN_NOT_APPROVED`
- `DESTINATION_RESOLUTION_FAILED`
- `DESTINATION_ADDRESS_CLASS_REJECTED`
- `DESTINATION_SET_EMPTY`
- `DESTINATION_SET_CHANGED`
- `NETWORK_PROFILE_GENERATION_FAILED`
- `NETWORK_PROFILE_ENFORCEMENT_UNPROVEN`
- `UNEXPECTED_STARTUP_EGRESS`
- `UNEXPECTED_RUNTIME_EGRESS`
- `TLS_POLICY_FAILURE`
- `NETWORK_POLICY_CLEANUP_FAILED`
- `UNEXPECTED_INTERNAL_FAILURE`

No automatic retry is allowed.

## Authorization ledger

The Phase 25IW authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473` remains `CONSUMED_AND_NOT_REUSABLE`.

The Phase 25IZ authorization SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080` remains `CONSUMED_AND_NOT_REUSABLE`.

Phase 25JE creates no authorization for environment-value access, destination derivation, DNS resolution, network testing, build, startup, or route execution.

## Design decision

Environment capsule:

`IN_MEMORY_EXACT_NAME_ALLOWLIST_CAPSULE`

Environment values read now:

`NO`

Destination derivation:

`DESIGNED_BUT_NOT_AUTHORIZED`

Build network:

`DENY_ALL_NETWORK`

Startup network:

`LOOPBACK_ONLY_ZERO_HTTP_REQUESTS`

C01 runtime policy:

`LOOPBACK_PLUS_ONE_PRIVATE_DERIVED_SUPABASE_DESTINATION`

Enforcement mechanism:

`GENERATED_SANDBOX_EXEC_ADDRESS_ALLOWLIST_UNPROVEN`

Harness implementation:

`NOT_AUTHORIZED`

Network capability testing:

`NOT_AUTHORIZED`

Environment-value access:

`NOT_AUTHORIZED`

Application build:

`NOT_AUTHORIZED`

Production startup:

`NOT_AUTHORIZED`

C01 request:

`NOT_AUTHORIZED`

C02:

`NOT_AUTHORIZED`

Successful runtime validation:

`NOT_ACHIEVED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Safe successor

The safe successor is:

**Phase 25JF — Host Capability, APFS Clone Independence, and Sandbox Network-Enforcement Static Preflight Plan Gate**

Phase 25JF may define the exact future tests for:

- APFS `cp -cR` clone independence;
- source and destination mutation isolation;
- `sandbox-exec` build network denial;
- loopback-only startup policy;
- exact-address runtime allowlisting;
- DNS and resolver behavior;
- process-tree sandbox inheritance;
- metadata-only capability evidence;
- cleanup.

Phase 25JF must not:

- run the capability tests;
- inspect environment values;
- resolve the private destination;
- access a live database or external service;
- build or start the application;
- invoke C01 or C02;
- install packages;
- implement the runtime harness;
- modify source code;
- authorize execution;
- begin Batch D;
- authorize operational reactivation or public launch.

Any future capability-test execution requires a separate reviewed phase and fresh exact human authorization.

## Gemini senior-review questions

Gemini should approve Phase 25JE only if all answers are affirmative:

1. Is Phase 25JE anchored to exact Phase 25JD commit `c6b0e3e771afdb3157dab6c2041e1cc361036ead`?
2. Is the approved Phase 25JD artifact identity preserved?
3. Is the C01 route and tracked local dependency closure inventoried without opening environment files?
4. Are only environment identifier names recorded, with no values, presence checks, lengths, or hashes?
5. Is the environment capsule limited to an exact in-memory allowlist constructed by the Python supervisor?
6. Is forwarding the full parent environment prohibited?
7. Are build, startup, and request capsules separated?
8. Is private destination derivation restricted to one approved URL identifier and HTTPS port 443?
9. Is the default destination restricted to a `.supabase.co` project subdomain unless a custom domain is separately approved?
10. Are build egress denied and startup egress loopback-only with zero HTTP requests?
11. Is C01 egress limited to the application process and one privately derived destination set?
12. Are direct validation-client database or Supabase requests prohibited?
13. Is the generated `sandbox-exec` address allowlist explicitly unproven pending capability testing?
14. Is weaker fallback prohibited?
15. Are DNS, proxy, TLS, address-change, metadata, and cleanup policies fail-closed?
16. Are URL values, hostnames, IP addresses, resolver output, headers, bodies, rows, and credentials prohibited from retained evidence?
17. Are all environment identifiers required to receive a future static usage classification?
18. Are named failure codes and zero retries required?
19. Are both prior authorizations preserved as consumed and non-reusable?
20. Is Phase 25JF limited to a static host-capability preflight plan?
21. Are capability testing, value access, build, startup, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
22. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JE Gemini review: pending
- Environment-value access: not authorized
- Network capability testing: not authorized
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
