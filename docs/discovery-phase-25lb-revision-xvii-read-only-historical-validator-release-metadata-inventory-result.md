# Phase 25LB — Revision XVII Read-Only Historical Validator Release Metadata Inventory Result

## Result

`BOUNDARY_ESTABLISHED_NO_PRELIMINARY_HISTORICAL_CANDIDATE`

## Identity

- Repository baseline: `0efe10d0950b37328b438b0284fe9b1bec6b2e7e`
- Phase 25LA artifact SHA-256: `28b1f9880127905b10cfec27ec10dde34aecc297075cec95088199d97d11be2e`
- Candidate count: `3`
- Metadata endpoints: `EXACT_VERSION_SPECIFIC_PYPI_ONLY`
- Package payload download: `NOT PERFORMED`
- Artifact retention: `NOT PERFORMED`
- Package inspection: `NOT PERFORMED`
- Candidate selection: `NOT PERFORMED`
- Operational reactivation: `BLOCKED`

## Boundary determination

- Upper boundary witness: `jsonschema 4.18.0`
- Immediately pre-boundary release: `jsonschema 4.17.3`
- Upper release exact `rpds-py` requirements: `['rpds-py>=0.7.1']`
- Pre-boundary exact `rpds-py` requirements: `[]`
- Preliminary dependency boundary established: `true`

## Candidate records

### Candidate 1: jsonschema 4.18.0

- Inventory role: `upper_boundary_witness`
- Canonical version-specific endpoint: `https://pypi.org/pypi/jsonschema/4.18.0/json`
- Metadata response SHA-256: `e7430a0fe2ae9021a45ab02164143e03453502c0f74078f44382425fe6349064`
- Metadata response bytes: `12501`
- Requires Python: `>=3.8`
- Python 3.9 classifier present: `true`
- Draft 2020-12 support claim: `FULL`
- Exact `rpds-py` requirement expressions: `['rpds-py>=0.7.1']`
- Exact `pyrsistent` requirement expressions: `[]`
- License field: `MIT`
- License expression: `None`
- License files: `None`
- Unconditional runtime dependency count: `4`
- Conditional runtime dependency count: `2`
- Optional-extra dependency count: `16`
- Unusual-marker dependency count: `0`
- Unconditional runtime dependencies: `['attrs>=22.2.0', 'jsonschema-specifications>=2023.03.6', 'referencing>=0.28.4', 'rpds-py>=0.7.1']`
- Conditional runtime dependencies: `["importlib-resources>=1.4.0; python_version < '3.9'", "pkgutil-resolve-name>=1.3.10; python_version < '3.9'"]`
- Optional-extra dependencies: `["fqdn; extra == 'format'", "idna; extra == 'format'", "isoduration; extra == 'format'", "jsonpointer>1.13; extra == 'format'", "rfc3339-validator; extra == 'format'", "rfc3987; extra == 'format'", "uri-template; extra == 'format'", "webcolors>=1.11; extra == 'format'", "fqdn; extra == 'format-nongpl'", "idna; extra == 'format-nongpl'", "isoduration; extra == 'format-nongpl'", "jsonpointer>1.13; extra == 'format-nongpl'", "rfc3339-validator; extra == 'format-nongpl'", "rfc3986-validator>0.1.0; extra == 'format-nongpl'", "uri-template; extra == 'format-nongpl'", "webcolors>=1.11; extra == 'format-nongpl'"]`
- Unusual-marker dependencies: `[]`
- Preliminary classification: `BOUNDARY_WITNESS_RPDS_UNCONDITIONAL`

  - Published artifact: `jsonschema-4.18.0-py3-none-any.whl`
    - Type: `bdist_wheel`
    - Published SHA-256: `b508dd6142bd03f4c3670534c80af68cd7bbff9ea830b9cf2625d4a3c49ddf60`
    - Published bytes: `81450`
    - Upload time: `2023-07-06T09:28:02.418105Z`
  - Published artifact: `jsonschema-4.18.0.tar.gz`
    - Type: `sdist`
    - Published SHA-256: `8caf5b57a990a98e9b39832ef3cb35c176fe331414252b6e1b26fd5866f891a4`
    - Published bytes: `315551`
    - Upload time: `2023-07-06T09:28:03.896236Z`

### Candidate 2: jsonschema 4.17.3

- Inventory role: `immediately_pre_boundary`
- Canonical version-specific endpoint: `https://pypi.org/pypi/jsonschema/4.17.3/json`
- Metadata response SHA-256: `c59b6f2e637f4d720b4a37fb9ad6b90538e04dc72fc80ad9ce02ef2d6285f95a`
- Metadata response bytes: `9695`
- Requires Python: `>=3.7`
- Python 3.9 classifier present: `true`
- Draft 2020-12 support claim: `PARTIAL`
- Exact `rpds-py` requirement expressions: `[]`
- Exact `pyrsistent` requirement expressions: `['pyrsistent!=0.17.0,!=0.17.1,!=0.17.2,>=0.14.0']`
- License field: `MIT`
- License expression: `None`
- License files: `None`
- Unconditional runtime dependency count: `2`
- Conditional runtime dependency count: `4`
- Optional-extra dependency count: `16`
- Unusual-marker dependency count: `0`
- Unconditional runtime dependencies: `['attrs>=17.4.0', 'pyrsistent!=0.17.0,!=0.17.1,!=0.17.2,>=0.14.0']`
- Conditional runtime dependencies: `["importlib-metadata; python_version < '3.8'", "importlib-resources>=1.4.0; python_version < '3.9'", "pkgutil-resolve-name>=1.3.10; python_version < '3.9'", "typing-extensions; python_version < '3.8'"]`
- Optional-extra dependencies: `["fqdn; extra == 'format'", "idna; extra == 'format'", "isoduration; extra == 'format'", "jsonpointer>1.13; extra == 'format'", "rfc3339-validator; extra == 'format'", "rfc3987; extra == 'format'", "uri-template; extra == 'format'", "webcolors>=1.11; extra == 'format'", "fqdn; extra == 'format-nongpl'", "idna; extra == 'format-nongpl'", "isoduration; extra == 'format-nongpl'", "jsonpointer>1.13; extra == 'format-nongpl'", "rfc3339-validator; extra == 'format-nongpl'", "rfc3986-validator>0.1.0; extra == 'format-nongpl'", "uri-template; extra == 'format-nongpl'", "webcolors>=1.11; extra == 'format-nongpl'"]`
- Unusual-marker dependencies: `[]`
- Preliminary classification: `BLOCKED_DRAFT_2020_12_EVIDENCE`

  - Published artifact: `jsonschema-4.17.3-py3-none-any.whl`
    - Type: `bdist_wheel`
    - Published SHA-256: `a870ad254da1a8ca84b6a2905cac29d265f805acc57af304784962a2aa6508f6`
    - Published bytes: `90379`
    - Upload time: `2022-11-29T20:37:45.842836Z`
  - Published artifact: `jsonschema-4.17.3.tar.gz`
    - Type: `sdist`
    - Published SHA-256: `0f864437ab8b6076ba6707453ef8f98a6a0d512a80e93f8abdb676f737ecb60d`
    - Published bytes: `297785`
    - Upload time: `2022-11-29T20:37:47.453779Z`

### Candidate 3: jsonschema 4.16.0

- Inventory role: `earlier_control`
- Canonical version-specific endpoint: `https://pypi.org/pypi/jsonschema/4.16.0/json`
- Metadata response SHA-256: `705d50a428259d700180739ac1feac74e9cf64d86430325bb738381e26f516f9`
- Metadata response bytes: `9651`
- Requires Python: `>=3.7`
- Python 3.9 classifier present: `true`
- Draft 2020-12 support claim: `PARTIAL`
- Exact `rpds-py` requirement expressions: `[]`
- Exact `pyrsistent` requirement expressions: `['pyrsistent!=0.17.0,!=0.17.1,!=0.17.2,>=0.14.0']`
- License field: `MIT`
- License expression: `None`
- License files: `None`
- Unconditional runtime dependency count: `2`
- Conditional runtime dependency count: `4`
- Optional-extra dependency count: `16`
- Unusual-marker dependency count: `0`
- Unconditional runtime dependencies: `['attrs>=17.4.0', 'pyrsistent!=0.17.0,!=0.17.1,!=0.17.2,>=0.14.0']`
- Conditional runtime dependencies: `["importlib-metadata; python_version < '3.8'", "importlib-resources>=1.4.0; python_version < '3.9'", "pkgutil-resolve-name>=1.3.10; python_version < '3.9'", "typing-extensions; python_version < '3.8'"]`
- Optional-extra dependencies: `["fqdn; extra == 'format'", "idna; extra == 'format'", "isoduration; extra == 'format'", "jsonpointer>1.13; extra == 'format'", "rfc3339-validator; extra == 'format'", "rfc3987; extra == 'format'", "uri-template; extra == 'format'", "webcolors>=1.11; extra == 'format'", "fqdn; extra == 'format-nongpl'", "idna; extra == 'format-nongpl'", "isoduration; extra == 'format-nongpl'", "jsonpointer>1.13; extra == 'format-nongpl'", "rfc3339-validator; extra == 'format-nongpl'", "rfc3986-validator>0.1.0; extra == 'format-nongpl'", "uri-template; extra == 'format-nongpl'", "webcolors>=1.11; extra == 'format-nongpl'"]`
- Unusual-marker dependencies: `[]`
- Preliminary classification: `BLOCKED_DRAFT_2020_12_EVIDENCE`

  - Published artifact: `jsonschema-4.16.0-py3-none-any.whl`
    - Type: `bdist_wheel`
    - Published SHA-256: `9e74b8f9738d6a946d70705dc692b74b5429cd0960d58e79ffecfc43b2221eb9`
    - Published bytes: `83113`
    - Upload time: `2022-09-09T09:46:03.358711Z`
  - Published artifact: `jsonschema-4.16.0.tar.gz`
    - Type: `sdist`
    - Published SHA-256: `165059f076eff6971bae5b742fc029a7b4ef3f9bcf04c14e4776a7605de14b23`
    - Published bytes: `292399`
    - Upload time: `2022-09-09T09:46:05.121444Z`

## Disposition

- The `rpds-py` dependency transition is preliminarily established between versions `4.17.3` and `4.18.0`.
- Versions `4.17.3` and `4.16.0` advertise only partial Draft 2020-12 support in canonical metadata.
- No historical release qualifies as a preliminary candidate under the full Draft 2020-12 requirement.
- Historical candidate selection remains blocked.

## Preserved boundaries

- Exactly three version-specific canonical PyPI metadata endpoints were queried.
- Redirects outside `https://pypi.org` were rejected.
- No distribution archive or wheel was downloaded.
- No package payload was retained or extracted.
- No package manager was invoked.
- No package was installed.
- No validator or dependency code was imported or executed.
- No actual license file was downloaded or reviewed.
- No dependency was resolved or acquired.
- No schema inspection or migration occurred.
- No schema validation or Phase 25KT rerun occurred.
- No Python syntax validation occurred.
- No staging, commit, or push occurred.
- Operational reactivation remains blocked.

## System layer progress report

- Phase 25LB historical release metadata inventory: 100%
- Phase 25LB Gemini result review: pending
- Historical candidate selection: 0%
- Phase 25LC schema-draft migration feasibility planning: 0%
- Remediation path selection: 0%
- Package acquisition: 0%
- Schema migration: 0%
- Phase 25KT-equivalent rerun: 0%
- Python syntax validation: 0%
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
