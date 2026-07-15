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
  local wrapper="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh"
  local sql_sha="b8f8a7492d2a0de20d07e8de7b0fe76e934e7323263d136c3f5fabbf8faf056b"
  local identity_manifest="scripts/_drafts/discovery-phase-26ye-reviewed-wrapper-identity-manifest.txt"
  local manifest_version=""
  local manifest_baseline_commit=""
  local manifest_wrapper_path=""
  local manifest_wrapper_sha=""
  local manifest_wrapper_blob=""
  local manifest_wrapper_mode=""
  local manifest_sql_path=""
  local manifest_sql_sha=""
  local manifest_sql_mode=""
  local manifest_exit_93_required=""
  local manifest_live_execution_authorized=""

  local service_fd=""
  local authorization_fd=""
  local authorization_payload=""
  local environment_class=""

  usage() {
    cat <<'USAGE'
Usage:
  discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh     --service-fd <open-fd-number>     --authorization-fd <open-fd-number>     --environment-class <local|preview|staging|production>

Both descriptors must already be open and readable by this process.
Their contents are never printed, copied, persisted, or accepted as command arguments.
USAGE
  }

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --service-fd)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --service-fd value"; return 64; }
        service_fd="$2"
        shift 2
        ;;
      --authorization-fd)
        [[ $# -ge 2 ]] || { echo "FAILED: missing --authorization-fd value"; return 64; }
        authorization_fd="$2"
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

    [[ -n "${authorization_fd}" ]] || {
      echo "FAILED: authorization descriptor was not supplied"
      exit 69
    }
    [[ "${authorization_fd}" =~ ^[0-9]+$ ]] || {
      echo "FAILED: authorization descriptor must be numeric"
      exit 70
    }
    [[ "${authorization_fd}" -ge 3 ]] || {
      echo "FAILED: authorization descriptor must not use stdin, stdout, or stderr"
      exit 71
    }
    [[ -r "/dev/fd/${authorization_fd}" ]] || {
      echo "FAILED: supplied authorization descriptor is not readable"
      exit 72
    }
    [[ "$(stat -f '%Lp' "/dev/fd/${authorization_fd}")" == "600" ]] || {
      echo "FAILED: authorization record mode is not 600"
      exit 73
    }

    authorization_payload="$(cat <&"${authorization_fd}")"
    [[ -n "${authorization_payload}" ]] || {
      echo "FAILED: authorization record is empty"
      exit 74
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

    [[ -f "${identity_manifest}" ]] || {
      echo "FAILED: detached identity manifest is missing"
      exit 83
    }
    [[ "$(stat -f '%Lp' "${identity_manifest}")" == "644" ]] || {
      echo "FAILED: detached identity manifest mode mismatch"
      exit 84
    }
    git ls-files --error-unmatch "${identity_manifest}" >/dev/null 2>&1 || {
      echo "FAILED: detached identity manifest is not committed"
      exit 85
    }
    [[ -z "$(git diff -- "${identity_manifest}")" ]] || {
      echo "FAILED: detached identity manifest has local modifications"
      exit 86
    }

    manifest_version="$(awk -F= '$1=="MANIFEST_VERSION"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_baseline_commit="$(awk -F= '$1=="APPROVED_BASELINE_COMMIT"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_wrapper_path="$(awk -F= '$1=="WRAPPER_PATH"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_wrapper_sha="$(awk -F= '$1=="WRAPPER_SHA256"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_wrapper_blob="$(awk -F= '$1=="WRAPPER_GIT_BLOB"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_wrapper_mode="$(awk -F= '$1=="WRAPPER_MODE"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_sql_path="$(awk -F= '$1=="SQL_PATH"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_sql_sha="$(awk -F= '$1=="SQL_SHA256"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_sql_mode="$(awk -F= '$1=="SQL_MODE"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_exit_93_required="$(awk -F= '$1=="WRAPPER_EXIT_93_REQUIRED"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"
    manifest_live_execution_authorized="$(awk -F= '$1=="LIVE_EXECUTION_AUTHORIZED"{print substr($0,index($0,"=")+1)}' "${identity_manifest}")"

    [[ "${manifest_version}" == "1" ]] || {
      echo "FAILED: detached identity manifest version mismatch"
      exit 87
    }
    [[ "${manifest_baseline_commit}" =~ ^[0-9a-f]{40}$ ]] || {
      echo "FAILED: manifest baseline commit is malformed"
      exit 88
    }
    git merge-base --is-ancestor "${manifest_baseline_commit}" HEAD || {
      echo "FAILED: manifest baseline commit is not an ancestor of HEAD"
      exit 89
    }
    [[ "${manifest_wrapper_path}" == "${wrapper}" ]] || {
      echo "FAILED: manifest wrapper path mismatch"
      exit 90
    }
    [[ "${manifest_sql_path}" == "${sql_candidate}" ]] || {
      echo "FAILED: manifest SQL path mismatch"
      exit 91
    }
    [[ "${manifest_wrapper_mode}" == "644" && "${manifest_sql_mode}" == "644" ]] || {
      echo "FAILED: manifest file-mode contract mismatch"
      exit 92
    }
    [[ "${manifest_exit_93_required}" == "YES" ]] || {
      echo "FAILED: manifest does not require exit 93"
      exit 93
    }
    [[ "${manifest_live_execution_authorized}" == "NO" ]] || {
      echo "FAILED: manifest unexpectedly authorizes live execution"
      exit 94
    }

    local wrapper_actual_sha wrapper_actual_blob
    wrapper_actual_sha="$(shasum -a 256 "$0" | awk '{print $1}')"
    wrapper_actual_blob="$(git hash-object "$0")"

    [[ "${wrapper_actual_sha}" == "${manifest_wrapper_sha}" ]] || {
      echo "FAILED: wrapper SHA-256 mismatch"
      exit 95
    }
    [[ "${wrapper_actual_blob}" == "${manifest_wrapper_blob}" ]] || {
      echo "FAILED: wrapper Git blob mismatch"
      exit 96
    }
    [[ "$(stat -f '%Lp' "$0")" == "${manifest_wrapper_mode}" ]] || {
      echo "FAILED: wrapper mode mismatch"
      exit 97
    }
    [[ "$(shasum -a 256 "${sql_candidate}" | awk '{print $1}')" == "${manifest_sql_sha}" ]] || {
      echo "FAILED: SQL candidate SHA-256 mismatch against manifest"
      exit 98
    }
    [[ "$(stat -f '%Lp' "${sql_candidate}")" == "${manifest_sql_mode}" ]] || {
      echo "FAILED: SQL candidate mode mismatch against manifest"
      exit 99
    }

    local record_nonce record_environment record_commit record_sql_sha record_expiry record_consumed
    record_nonce="$(printf '%s
' "${authorization_payload}" | awk -F= '$1=="AUTHORIZATION_NONCE"{print substr($0,index($0,"=")+1)}')"
    record_environment="$(printf '%s
' "${authorization_payload}" | awk -F= '$1=="ENVIRONMENT_CLASS"{print substr($0,index($0,"=")+1)}')"
    record_commit="$(printf '%s
' "${authorization_payload}" | awk -F= '$1=="APPROVED_COMMIT"{print substr($0,index($0,"=")+1)}')"
    record_sql_sha="$(printf '%s
' "${authorization_payload}" | awk -F= '$1=="SQL_SHA256"{print substr($0,index($0,"=")+1)}')"
    record_expiry="$(printf '%s
' "${authorization_payload}" | awk -F= '$1=="EXPIRES_EPOCH"{print substr($0,index($0,"=")+1)}')"
    record_consumed="$(printf '%s
' "${authorization_payload}" | awk -F= '$1=="CONSUMED"{print substr($0,index($0,"=")+1)}')"

    [[ "${record_nonce}" =~ ^[0-9A-Za-z_-]{32,}$ ]] || {
      echo "FAILED: authorization nonce is missing or malformed"
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

    # PHASE 26YD REVIEW BOUNDARY:
    # A later explicitly authorized execution phase may replace only the exit-93
    # block above with the reviewed psql invocation below.
    #
    # PGSERVICEFILE="/dev/fd/${service_fd}" PGSERVICE="aifinder_preflight"     #   psql --no-psqlrc --set=ON_ERROR_STOP=1     #     --command="SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;"     #     --command="SET statement_timeout = '10s';"     #     --command="SET lock_timeout = '5s';"     #     --file="${sql_candidate}"
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
  authorization_fd=""
  authorization_payload=""
  record_nonce=""

  return "${rc}"
}

main "$@"
exit $?
