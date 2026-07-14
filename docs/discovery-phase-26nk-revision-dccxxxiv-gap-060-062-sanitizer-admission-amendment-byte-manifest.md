# AiFinder Phase 26NK — Sanitizer Admission Amendment Byte Manifest

## Amendment status

This successor amendment supersedes only the sanitizer portion of the committed Phase 26NE–26NI plan.

The historical Phase 26NE–26NI artifacts remain unchanged.

## Exact corrected operations

### Operation 1

- Source: `candidate`
- Type: `remove_exact_block`
- Anchor: `79-80`
- Current SHA-256: `80ef0cbff2ae1a4ccf7df3e5a0794862eaa34e6e07f6e7db27f9f161bc70d527`
- Current bytes: `b'  [[ "$(git rev-parse HEAD)" == "$APPROVED_BASELINE" ]] \\\n    || fail "BASELINE_MISMATCH" || return 1\n'`

### Operation 2

- Source: `wrapper`
- Type: `replace_line`
- Anchor: `23`
- Current SHA-256: `d847ecf7c05542359f26f6853af68d76353c1d2f939ce7005c2cd11ce0c6a49e`
- Proposed SHA-256: `b03a532b1d102b2ead4d0c79a5e5f105b886047b0a237821eca6d8e74e8d0ba6`
- Current bytes: `b'        "BASELINE_MISMATCH") return 0 ;;\n'`
- Proposed bytes: `b'        "WRAPPER_BASELINE_MISMATCH") return 0 ;;\n'`

### Operation 3

- Source: `wrapper`
- Type: `replace_line`
- Anchor: `24`
- Current SHA-256: `ccf997b9892b1fe85f91ddd9ab0b6fed5ccc67dcd5a399276a0fcedd7aaae92e`
- Proposed SHA-256: `887d057763a3136e674406b860d5d91d97ce4f2b458c53e8d44b9e24504c7e07`
- Current bytes: `b'        "REMOTE_BASELINE_MISMATCH") return 0 ;;\n'`
- Proposed bytes: `b'        "WRAPPER_REMOTE_BASELINE_MISMATCH") return 0 ;;\n'`

### Operation 4

- Source: `wrapper`
- Type: `insert_before`
- Anchor: `147`
- Proposed SHA-256: `1b1cd1469400ba3e85536c2820c4168440734731bc604356ac981fa9185480cb`
- Proposed bytes: `b'    # Admission of provenance markers\n    if line.startswith("DIAGNOSTIC_TRACE: WRAPPER_INVOCATION_PROVENANCE") or \\\n       line.startswith("DIAGNOSTIC_TRACE: WRAPPER_STATUS_PROVENANCE"):\n        safe.append(line)\n        continue\n\n'`

### Operation 5

- Source: `wrapper`
- Type: `insert_before`
- Anchor: `318`
- Proposed SHA-256: `1e4da8c281ad3581eee26baa28b05aa2cd9142769c070bcc0589494344cd0db6`
- Proposed bytes: `b"  printf '%s\\n' 'DIAGNOSTIC_TRACE: WRAPPER_INVOCATION_PROVENANCE'\n"`

### Operation 6

- Source: `wrapper`
- Type: `insert_after`
- Anchor: `319`
- Proposed SHA-256: `15cd2fcf96936f55955c2cc548c62952ac256b393368e0acdbc09f9c17be698e`
- Proposed bytes: `b'  printf \'DIAGNOSTIC_TRACE: WRAPPER_STATUS_PROVENANCE=%s\\n\' "$candidate_rc"\n'`


## Sanitizer correction

- Exact admission block SHA-256: `1b1cd1469400ba3e85536c2820c4168440734731bc604356ac981fa9185480cb`
- Insertion point: `IMMEDIATELY BEFORE ORIGINAL LINE 147`
- Original line 147 SHA-256: `974248485c24ddfae9fd1b192128d60885ca5a6157f388b1990f391a589a093a`
- Original line 147 disposition: `PRESERVE BYTE-FOR-BYTE`
- Superseded line-147 replacement: `REMOVED FROM ACTIVE PLAN`

No source implementation is authorized by this amendment.
