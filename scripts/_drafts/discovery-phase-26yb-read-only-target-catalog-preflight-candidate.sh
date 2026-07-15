#!/usr/bin/env bash
# AIFINDER_AUTORUN_SCRIPT_V1
# AiFinder Phase 26YD live read-only target catalog preflight wrapper candidate.
# ACTIVATION DRAFT ONLY: not authorized for execution.
set -uo pipefail

main() {
  local phase="26yc"
  local task="live-read-only-target-catalog-preflight"
  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local log="/tmp/aifinder-${phase}-${task}-${ts}.log"
  local review="/tmp/aifinder-phase-26yc-live-preflight-review-${ts}.md"

  local repo="/Users/jamescarlodumaua/aifinder"
  local approved_commit="b6c0c552844b2537b688f89fdd25892e25a4f4b0"
  local sql_candidate="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql"
  local sql_sha="b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b"
  local wrapper_expected_sha="__PHASE_26YD_REVIEWED_WRAPPER_SHA256__"

  local service_fd=""
  local authorization_file=""
  local authorization_nonce=""
  local environment_class=""

  usage() {
    cat <<'USAGE'
Usage:
  discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh     --service-fd <open-fd-number>     --authorization-file <non-secret-record-path>     --authorization-nonce <one-use-nonce>     --environment-class <local|preview|staging|production>

The service descriptor must already be open and readable by this process.
Its contents are never printed, copied, persisted, or accepted as a command argument.
USAGE
  }

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --service-fd)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --service-fd value"; return 64; }
        service_fd="$2"
        shift 2
        ;;
      --authorization-file)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --authorization-file value"; return 64; }
        authorization_file="$2"
        shift 2
        ;;
      --authorization-nonce)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --authorization-nonce value"; return 64; }
        authorization_nonce="$2"
        shift 2
        ;;
      --environment-class)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --environment-class value"; return 64; }
        environment_class="$2"
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

    echo "=== AiFinder Phase 26YC Live Read-Only Target Catalog Preflight ==="

    [[ -n "${service_fd}" ]] || {
      echo "FAILED: service descriptor was not supplied"
      exit 65
    }
    [[ "${service_fd}" =~ ^[0-9]+$ ]] || {
      echo "FAILED: service descriptor must be numeric"
      exit 66
    }
    [[ "${service_fd}" -ge 3 ]] || {
      echo "FAILED: service descriptor must not use stdin, stdout, or stderr"
      exit 67
    }
    [[ -r "/dev/fd/${service_fd}" ]] || {
      echo "FAILED: supplied service descriptor is not readable"
      exit 68
    }

    [[ -n "${authorization_file}" && -f "${authorization_file}" ]] || {
      echo "FAILED: non-secret authorization record is missing"
      exit 69
    }
    [[ "${authorization_file}" == /tmp/aifinder-phase-26yc-authorization-*.txt ]] || {
      echo "FAILED: authorization record path is outside the approved temporary scope"
      exit 70
    }
    [[ "$(stat -f '%Lp' "${authorization_file}")" == "600" ]] || {
      echo "FAILED: authorization record mode is not 600"
      exit 71
    }
    [[ -n "${authorization_nonce}" ]] || {
      echo "FAILED: authorization nonce is missing"
      exit 72
    }

    case "${environment_class}" in
      local|preview|staging|production) ;;
      *)
        echo "FAILED: environment class is not approved"
        exit 73
        ;;
    esac

    [[ -d "${repo}/.git" ]] || {
      echo "FAILED: expected repository is missing"
      exit 74
    }
    cd "${repo}"

    [[ "$(git rev-parse --show-toplevel)" == "${repo}" ]] || {
      echo "FAILED: repository scope mismatch"
      exit 75
    }
    [[ "$(git branch --show-current)" == "main" ]] || {
      echo "FAILED: branch is not main"
      exit 76
    }
    [[ "$(git rev-parse HEAD)" == "${approved_commit}" ]] || {
      echo "FAILED: repository baseline mismatch"
      exit 77
    }
    [[ "$(git rev-parse origin/main)" == "${approved_commit}" ]] || {
      echo "FAILED: origin baseline mismatch"
      exit 78
    }
    [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
      echo "FAILED: working tree is not clean"
      exit 79
    }

    [[ -f "${sql_candidate}" ]] || {
      echo "FAILED: SQL candidate is missing"
      exit 80
    }
    [[ "$(shasum -a 256 "${sql_candidate}" | awk '{print $1}')" == "${sql_sha}" ]] || {
      echo "FAILED: SQL candidate SHA-256 mismatch"
      exit 81
    }
    [[ "$(stat -f '%Lp' "${sql_candidate}")" == "644" ]] || {
      echo "FAILED: SQL candidate mode mismatch"
      exit 82
    }

    local wrapper_actual_sha
    wrapper_actual_sha="$(shasum -a 256 "$0" | awk '{print $1}')"
    [[ "${wrapper_expected_sha}" != "__PHASE_26YD_REVIEWED_WRAPPER_SHA256__" ]] || {
      echo "FAILED: reviewed wrapper SHA-256 has not been bound"
      exit 83
    }
    [[ "${wrapper_actual_sha}" == "${wrapper_expected_sha}" ]] || {
      echo "FAILED: wrapper SHA-256 mismatch"
      exit 84
    }

    local record_nonce record_environment record_commit record_sql_sha record_expiry record_consumed
    record_nonce="$(awk -F= '$1=="AUTHORIZATION_NONCE"{print substr($0,index($0,"=")+1)}' "${authorization_file}")"
    record_environment="$(awk -F= '$1=="ENVIRONMENT_CLASS"{print substr($0,index($0,"=")+1)}' "${authorization_file}")"
    record_commit="$(awk -F= '$1=="APPROVED_COMMIT"{print substr($0,index($0,"=")+1)}' "${authorization_file}")"
    record_sql_sha="$(awk -F= '$1=="SQL_SHA256"{print substr($0,index($0,"=")+1)}' "${authorization_file}")"
    record_expiry="$(awk -F= '$1=="EXPIRES_EPOCH"{print substr($0,index($0,"=")+1)}' "${authorization_file}")"
    record_consumed="$(awk -F= '$1=="CONSUMED"{print substr($0,index($0,"=")+1)}' "${authorization_file}")"

    [[ "${record_nonce}" == "${authorization_nonce}" ]] || {
      echo "FAILED: authorization nonce mismatch"
      exit 85
    }
    [[ "${record_environment}" == "${environment_class}" ]] || {
      echo "FAILED: environment classification mismatch"
      exit 86
    }
    [[ "${record_commit}" == "${approved_commit}" ]] || {
      echo "FAILED: authorization commit mismatch"
      exit 87
    }
    [[ "${record_sql_sha}" == "${sql_sha}" ]] || {
      echo "FAILED: authorization SQL hash mismatch"
      exit 88
    }
    [[ "${record_expiry}" =~ ^[0-9]+$ ]] || {
      echo "FAILED: authorization expiry is malformed"
      exit 89
    }
    [[ "$(date +%s)" -le "${record_expiry}" ]] || {
      echo "FAILED: authorization has expired"
      exit 90
    }
    [[ "${record_consumed}" == "NO" ]] || {
      echo "FAILED: authorization was already consumed"
      exit 91
    }

    command -v psql >/dev/null 2>&1 || {
      echo "FAILED: PostgreSQL client is unavailable"
      exit 92
    }

    echo "FAILED: live invocation remains disabled pending a reviewed wrapper hash,"
    echo "a separately issued one-use authorization record, and explicit execution authorization."
    echo "No PostgreSQL connection or query was attempted."
    exit 93

    # PHASE 26YD REVIEW BOUNDARY:
    # A later explicitly authorized execution phase may replace only the exit-93
    # block above with the reviewed psql invocation below.
    #
    # PGSERVICEFILE="/dev/fd/${service_fd}" PGSERVICE="aifinder_preflight"     #   psql --no-psqlrc --set=ON_ERROR_STOP=1 --file="${sql_candidate}"
    #
    # The service descriptor must be supplied by the caller as a pre-opened FD.
    # No credential value is accepted through argv, stdout, logs, or repository files.

    {
      echo "# AiFinder Phase 26YC Live Preflight Review"
      echo
      echo "- Result: execution completed"
      echo "- Environment class: ${environment_class}"
      echo "- Credential values printed: no"
      echo "- Database or role identifiers included: no"
    } > "${review}"

    pbcopy < "${review}"
    echo "PASSED: Phase 26YC live read-only target catalog preflight"
    echo "Review package copied to clipboard: ${review}"
    echo
    echo "System layer progress report:"
    echo "- Discovery Engine progress: 99%"
    echo "- Live catalog preflight: COMPLETED_READ_ONLY"
    echo "- Migration execution: NOT_AUTHORIZED"
    echo "- Operational reactivation: BLOCKED"
    echo "- Public launch readiness: NOT_READY_FOR_PUBLIC_LAUNCH"
  ) 2>&1 | tee "${log}"

  local rc=${PIPESTATUS[0]}

  if [[ ${rc} -eq 0 ]]; then
    echo "PASSED: Phase 26YC read-only catalog preflight"
  else
    pbcopy < "${log}" 2>/dev/null || true
    echo "FAILED: Phase 26YC preflight exited with code ${rc}"
    echo "Raw failure log copied to clipboard: ${log}"
  fi

  service_fd=""
  authorization_nonce=""

  return "${rc}"
}

main "$@"
exit $?
