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
  local approved_commit="4db4073095201be78396b5a65adca4bbfdda6b92"
  local wrapper="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh"
  local wrapper_sha="b2c8b881603d1fab6d6bac7c959f244fbc8a147a7afb81497b6b45bec9dce15f"
  local wrapper_blob="dc4eca28ca4f68ccb19b5ba459c7404477493141"
  local manifest="scripts/_drafts/discovery-phase-26ye-reviewed-wrapper-identity-manifest.txt"
  local manifest_sha="32b61f42eb25dd68387e258bf1ff40d5a27cc3e9dd296fc6be554da6a4180c12"
  local sql_candidate="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql"
  local sql_sha="b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b"

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
    [[ "$(git rev-parse HEAD)" == "${approved_commit}" ]] || {
      echo "FAILED: repository baseline mismatch"
      exit 71
    }
    [[ "$(git rev-parse origin/main)" == "${approved_commit}" ]] || {
      echo "FAILED: origin baseline mismatch"
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

    echo "FAILED: inert generator guard is active."
    echo "No nonce was generated and no authorization record was created."
    echo "A later Gemini-reviewed phase must replace only this guard with"
    echo "the approved secure-randomness and exclusive-creation implementation."
    exit 90

    # PHASE 26YH REVIEW BOUNDARY — intentionally unreachable:
    #
    # python3 must generate a secure nonce using the standard cryptographic secrets API,
    # open the target using os.open(path, O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW, 0o600),
    # verify the created file is regular, mode 600, and owned by the current user,
    # write the exact reviewed non-secret schema, fsync, close, and return only
    # the record path plus redacted issuance metadata.
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
