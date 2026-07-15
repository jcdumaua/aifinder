#!/usr/bin/env bash
# AIFINDER_AUTORUN_SCRIPT_V1
# AiFinder Phase 26YH one-use authorization-record generator candidate.
# INERT STATIC REVIEW CANDIDATE: intentionally refuses record issuance.
set -uo pipefail

main() {
  local phase="26yh"
  local task="one-use-authorization-record-generator"
  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local log="/tmp/aifinder-${phase}-${task}-${ts}.log"

  local repo="/Users/jamescarlodumaua/aifinder"
  local approved_commit="b67663f4502393912bb523b86e62ae04652f970c"
  local wrapper="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh"
  local wrapper_sha="ec039e1cf5ec2b40261f3f8f730e2eb2d888296ef006d05c23fd0ebe6e02d10f"
  local wrapper_blob="74a1603939b8efd63099aa4618ab8a88bbfa34cc"
  local manifest="scripts/_drafts/discovery-phase-26ye-reviewed-wrapper-identity-manifest.txt"
  local manifest_sha="b694cfc0cac6bee37cc47f0d4c4f35b2653016d5676375fe09f5d4aeb9183136"
  local sql_candidate="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql"
  local sql_sha="32ea49528123a7bbafe6d430fdc637a91da4a6c977ee5cc9e5f912770a907c55"

  local environment_class=""
  local ttl_seconds="300"

  usage() {
    cat <<'USAGE'
Usage:
  discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh     --environment-class <local|preview|staging|production>     [--ttl-seconds <1-300>]

This inert candidate performs validation only and refuses nonce or record creation.
USAGE
  }

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --environment-class)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --environment-class value"; return 64; }
        environment_class="$2"
        shift 2
        ;;
      --ttl-seconds)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --ttl-seconds value"; return 64; }
        ttl_seconds="$2"
        shift 2
        ;;
      --help|-h)
        usage
        return 0
        ;;
      *)
        echo "FAILED: unsupported argument"
        usage
        return 64
        ;;
    esac
  done

  (
    set -euo pipefail

    echo "=== AiFinder Phase 26YH One-Use Authorization Generator Candidate ==="

    case "${environment_class}" in
      local|preview|staging|production) ;;
      *)
        echo "FAILED: environment class is missing or invalid"
        exit 65
        ;;
    esac

    [[ "${ttl_seconds}" =~ ^[0-9]+$ ]] || {
      echo "FAILED: TTL must be an integer"
      exit 66
    }
    [[ "${ttl_seconds}" -ge 1 && "${ttl_seconds}" -le 300 ]] || {
      echo "FAILED: TTL must be between 1 and 300 seconds"
      exit 67
    }

    [[ -d "${repo}/.git" ]] || {
      echo "FAILED: repository is missing"
      exit 68
    }
    cd "${repo}"

    [[ "$(git rev-parse --show-toplevel)" == "${repo}" ]] || {
      echo "FAILED: repository scope mismatch"
      exit 69
    }
    [[ "$(git branch --show-current)" == "main" ]] || {
      echo "FAILED: branch is not main"
      exit 70
    }
    git merge-base --is-ancestor "${approved_commit}" HEAD || {
      echo "FAILED: approved baseline is not an ancestor of HEAD"
      exit 71
    }
    [[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || {
      echo "FAILED: local HEAD is not synchronized with origin/main"
      exit 72
    }
    [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
      echo "FAILED: working tree is not clean"
      exit 73
    }

    [[ "$(shasum -a 256 "${wrapper}" | awk '{print $1}')" == "${wrapper_sha}" ]] || {
      echo "FAILED: wrapper SHA-256 mismatch"
      exit 74
    }
    [[ "$(git hash-object "${wrapper}")" == "${wrapper_blob}" ]] || {
      echo "FAILED: wrapper Git blob mismatch"
      exit 75
    }
    [[ "$(shasum -a 256 "${manifest}" | awk '{print $1}')" == "${manifest_sha}" ]] || {
      echo "FAILED: manifest SHA-256 mismatch"
      exit 76
    }
    [[ "$(shasum -a 256 "${sql_candidate}" | awk '{print $1}')" == "${sql_sha}" ]] || {
      echo "FAILED: SQL candidate SHA-256 mismatch"
      exit 77
    }
    [[ "$(stat -f '%Lp' "${wrapper}")" == "644" ]] || {
      echo "FAILED: wrapper mode mismatch"
      exit 78
    }
    [[ "$(stat -f '%Lp' "${manifest}")" == "644" ]] || {
      echo "FAILED: manifest mode mismatch"
      exit 79
    }
    [[ "$(stat -f '%Lp' "${sql_candidate}")" == "644" ]] || {
      echo "FAILED: SQL candidate mode mismatch"
      exit 80
    }

    grep -Fq 'exit 93' "${wrapper}" || {
      echo "FAILED: wrapper exit 93 guard is missing"
      exit 81
    }
    grep -Fq 'LIVE_EXECUTION_AUTHORIZED=NO' "${manifest}" || {
      echo "FAILED: manifest unexpectedly authorizes live execution"
      exit 82
    }

    local conflicting_record=""
    conflicting_record="$(find /tmp -maxdepth 1 -type f -name 'aifinder-phase-26yc-authorization-*.txt' -perm -600 -user "$(id -un)" -print -quit 2>/dev/null || true)"
    [[ -z "${conflicting_record}" ]] || {
      echo "FAILED: an existing authorization record requires explicit inspection"
      exit 83
    }

    command -v python3 >/dev/null 2>&1 || {
      echo "FAILED: Python 3 is unavailable for secure exclusive creation"
      exit 84
    }

    # PHASE 26YI REVIEW BOUNDARY — intentionally unreachable until separately authorized.
    local issuance_output=""
    issuance_output="$(python3 -       "${environment_class}"       "${ttl_seconds}"       "${approved_commit}"       "${sql_sha}"       "${wrapper_sha}"       "${manifest_sha}" <<'PYGEN'
import os
import secrets
import stat
import sys
import time
from pathlib import Path

environment_class = sys.argv[1]
ttl_seconds = int(sys.argv[2])
approved_commit = sys.argv[3]
sql_sha = sys.argv[4]
wrapper_sha = sys.argv[5]
manifest_sha = sys.argv[6]

issued = int(time.time())
expires = issued + ttl_seconds
nonce = secrets.token_hex(32)
random_id = secrets.token_hex(8)
path = Path(f"/tmp/aifinder-phase-26yc-authorization-{issued}-{random_id}.txt")

flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
if hasattr(os, "O_NOFOLLOW"):
    flags |= os.O_NOFOLLOW

fd = os.open(str(path), flags, 0o600)
try:
    st = os.fstat(fd)
    if not stat.S_ISREG(st.st_mode):
        raise RuntimeError("authorization target is not a regular file")
    if stat.S_IMODE(st.st_mode) != 0o600:
        raise RuntimeError("authorization target mode is not 600")
    if st.st_uid != os.getuid():
        raise RuntimeError("authorization target owner mismatch")

    body = (
        "AUTHORIZATION_VERSION=1\n"
        f"AUTHORIZATION_NONCE={nonce}\n"
        f"ENVIRONMENT_CLASS={environment_class}\n"
        f"APPROVED_COMMIT={approved_commit}\n"
        f"SQL_SHA256={sql_sha}\n"
        f"WRAPPER_SHA256={wrapper_sha}\n"
        f"MANIFEST_SHA256={manifest_sha}\n"
        "EXPECTED_REPLICA_STATE=PRIMARY\n"
        "REQUIRE_READ_ONLY_SESSION=YES\n"
        f"ISSUED_EPOCH={issued}\n"
        f"EXPIRES_EPOCH={expires}\n"
        "CONSUMED=NO\n"
        "EXECUTION_SCOPE=READ_ONLY_CATALOG_PREFLIGHT_ONLY\n"
        "MIGRATION_EXECUTION_AUTHORIZED=NO\n"
    ).encode("utf-8")

    view = memoryview(body)
    while view:
        written = os.write(fd, view)
        view = view[written:]
    os.fsync(fd)
finally:
    os.close(fd)

print(f"RECORD_PATH={path}")
print(f"EXPIRES_EPOCH={expires}")
print("SCOPE=READ_ONLY_CATALOG_PREFLIGHT_ONLY")
PYGEN
    )"

    local record_path expires_epoch scope
    record_path="$(printf '%s\n' "${issuance_output}" | awk -F= '$1=="RECORD_PATH"{print substr($0,index($0,"=")+1)}')"
    expires_epoch="$(printf '%s\n' "${issuance_output}" | awk -F= '$1=="EXPIRES_EPOCH"{print substr($0,index($0,"=")+1)}')"
    scope="$(printf '%s\n' "${issuance_output}" | awk -F= '$1=="SCOPE"{print substr($0,index($0,"=")+1)}')"

    [[ "${record_path}" == /tmp/aifinder-phase-26yc-authorization-*.txt ]] || {
      echo "FAILED: created record path is outside approved scope"
      exit 91
    }
    [[ -f "${record_path}" ]] || {
      echo "FAILED: authorization record was not created"
      exit 92
    }
    [[ "$(stat -f '%Lp' "${record_path}")" == "600" ]] || {
      echo "FAILED: authorization record mode mismatch"
      exit 93
    }
    [[ "${expires_epoch}" =~ ^[0-9]+$ ]] || {
      echo "FAILED: issuance expiration output malformed"
      exit 94
    }
    [[ "${scope}" == "READ_ONLY_CATALOG_PREFLIGHT_ONLY" ]] || {
      echo "FAILED: issuance scope mismatch"
      exit 95
    }

    echo "PASSED: one-use authorization record created"
    echo "Record path: ${record_path}"
    echo "Expiration: within approved TTL"
    echo "Scope: ${scope}"
  ) 2>&1 | tee "${log}"

  local rc=${PIPESTATUS[0]}

  if [[ ${rc} -eq 0 ]]; then
    echo "PASSED: Phase 26YH authorization record generated"
    echo
    echo "System layer progress report:"
    echo "- Discovery Engine progress: 99%"
    echo "- Authorization record: GENERATED_ONE_USE"
    echo "- Credential access: NOT_PERFORMED"
    echo "- Database connection: NOT_PERFORMED"
    echo "- Migration execution: PROHIBITED"
  else
    pbcopy < "${log}" 2>/dev/null || true
    echo "FAILED: Phase 26YH generator candidate exited with code ${rc}"
    echo "Raw failure log copied to clipboard: ${log}"
  fi

  return "${rc}"
}

main "$@"
exit $?
