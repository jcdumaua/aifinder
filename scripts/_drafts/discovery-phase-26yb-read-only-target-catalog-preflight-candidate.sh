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
  local sql_candidate="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sql"
  local wrapper="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh"
  local sql_sha="32ea49528123a7bbafe6d430fdc637a91da4a6c977ee5cc9e5f912770a907c55"
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
    [[ -r "/dev/fd/${authorization_fd}" && -w "/dev/fd/${authorization_fd}" ]] || {
      echo "FAILED: supplied authorization descriptor is not readable and writable"
      exit 72
    }
    [[ -f "/dev/fd/${authorization_fd}" ]] || {
      echo "FAILED: authorization descriptor does not reference a regular file"
      exit 73
    }
    [[ "$(stat -f '%u' "/dev/fd/${authorization_fd}")" == "$(id -u)" ]] || {
      echo "FAILED: authorization record owner mismatch"
      exit 74
    }
    [[ "$(stat -f '%Lp' "/dev/fd/${authorization_fd}")" == "600" ]] || {
      echo "FAILED: authorization record mode is not 600"
      exit 75
    }
    command -v python3 >/dev/null 2>&1 || {
      echo "FAILED: Python 3 is unavailable"
      exit 76
    }

    [[ -f "${identity_manifest}" ]] || { echo "FAILED: reviewed identity manifest is missing"; exit 77; }
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

    [[ "${manifest_version}" == "1" ]] || { echo "FAILED: manifest version mismatch"; exit 78; }
    [[ "${manifest_baseline_commit}" =~ ^[0-9a-f]{40}$ ]] || { echo "FAILED: manifest baseline format mismatch"; exit 79; }
    [[ "${manifest_wrapper_path}" == "${wrapper}" ]] || { echo "FAILED: manifest wrapper path mismatch"; exit 80; }
    [[ "${manifest_wrapper_sha}" =~ ^[0-9a-f]{64}$ ]] || { echo "FAILED: manifest wrapper SHA format mismatch"; exit 81; }
    [[ "${manifest_wrapper_blob}" =~ ^[0-9a-f]{40}$ ]] || { echo "FAILED: manifest wrapper blob format mismatch"; exit 82; }
    [[ "${manifest_wrapper_mode}" == "644" ]] || { echo "FAILED: manifest wrapper mode mismatch"; exit 83; }
    [[ "${manifest_sql_path}" == "${sql_candidate}" ]] || { echo "FAILED: manifest SQL path mismatch"; exit 84; }
    [[ "${manifest_sql_sha}" == "${sql_sha}" ]] || { echo "FAILED: manifest SQL SHA mismatch"; exit 85; }
    [[ "${manifest_sql_mode}" == "644" ]] || { echo "FAILED: manifest SQL mode mismatch"; exit 86; }
    [[ "${manifest_exit_93_required}" == "NO" ]] || { echo "FAILED: manifest inert-stop state mismatch"; exit 87; }
    [[ "${manifest_live_execution_authorized}" == "YES" ]] || { echo "FAILED: manifest live authorization mismatch"; exit 88; }
    [[ "$(shasum -a 256 "${wrapper}" | awk '{print $1}')" == "${manifest_wrapper_sha}" ]] || { echo "FAILED: wrapper SHA does not match reviewed manifest"; exit 89; }
    [[ "$(git hash-object "${wrapper}")" == "${manifest_wrapper_blob}" ]] || { echo "FAILED: wrapper Git blob does not match reviewed manifest"; exit 90; }
    [[ "$(stat -f '%Lp' "${wrapper}")" == "${manifest_wrapper_mode}" ]] || { echo "FAILED: wrapper file mode does not match reviewed manifest"; exit 91; }

    python3 - \
      "${authorization_fd}" \
      "${environment_class}" \
      "${sql_sha}" \
      "${manifest_wrapper_sha}" \
      "$(shasum -a 256 "${identity_manifest}" | awk '{print $1}')" <<'PY_AUTH_TRANSACTION'
import fcntl
import os
import re
import sys
import time

fd = int(sys.argv[1])
expected_environment = sys.argv[2]
expected_sql_sha = sys.argv[3]
expected_wrapper_sha = sys.argv[4]
expected_manifest_sha = sys.argv[5]

try:
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    raise SystemExit(77)

os.lseek(fd, 0, os.SEEK_SET)
raw_bytes = os.read(fd, 65536)
try:
    raw = raw_bytes.decode("utf-8")
except UnicodeDecodeError:
    raise SystemExit(78)

lines = raw.splitlines()
if not lines:
    raise SystemExit(78)

records = {}
for line in lines:
    if "=" not in line:
        raise SystemExit(79)
    key, value = line.split("=", 1)
    if not re.fullmatch(r"[A-Z0-9_]+", key):
        raise SystemExit(79)
    if key in records:
        raise SystemExit(79)
    records[key] = value

required = {
    "AUTHORIZATION_VERSION",
    "AUTHORIZATION_NONCE",
    "ENVIRONMENT_CLASS",
    "SQL_SHA256",
    "WRAPPER_SHA256",
    "MANIFEST_SHA256",
    "EXPECTED_REPLICA_STATE",
    "REQUIRE_READ_ONLY_SESSION",
    "ISSUED_EPOCH",
    "EXPIRES_EPOCH",
    "CONSUMED",
    "EXECUTION_SCOPE",
    "MIGRATION_EXECUTION_AUTHORIZED",
}
if set(records) != required:
    raise SystemExit(79)

if records["AUTHORIZATION_VERSION"] != "1":
    raise SystemExit(80)
if not re.fullmatch(r"[0-9A-Za-z_-]{32,}", records["AUTHORIZATION_NONCE"]):
    raise SystemExit(81)
if records["ENVIRONMENT_CLASS"] != expected_environment or expected_environment != "staging":
    raise SystemExit(82)
if records["SQL_SHA256"] != expected_sql_sha:
    raise SystemExit(83)
if records["WRAPPER_SHA256"] != expected_wrapper_sha:
    raise SystemExit(84)
if records["MANIFEST_SHA256"] != expected_manifest_sha:
    raise SystemExit(85)
if records["EXPECTED_REPLICA_STATE"] != "PRIMARY":
    raise SystemExit(86)
if records["REQUIRE_READ_ONLY_SESSION"] != "YES":
    raise SystemExit(87)
if records["EXECUTION_SCOPE"] != "READ_ONLY_CATALOG_PREFLIGHT_ONLY":
    raise SystemExit(88)
if records["MIGRATION_EXECUTION_AUTHORIZED"] != "NO":
    raise SystemExit(89)
if not records["ISSUED_EPOCH"].isdigit() or not records["EXPIRES_EPOCH"].isdigit():
    raise SystemExit(90)
now = int(time.time())
issued = int(records["ISSUED_EPOCH"])
expires = int(records["EXPIRES_EPOCH"])
if issued > now or expires < now or expires - issued > 300:
    raise SystemExit(91)
if records["CONSUMED"] != "NO":
    raise SystemExit(92)

matches = [i for i, line in enumerate(lines) if line == "CONSUMED=NO"]
if len(matches) != 1:
    raise SystemExit(93)
lines[matches[0]] = "CONSUMED=YES"

updated = ("\n".join(lines) + "\n").encode("utf-8")
os.lseek(fd, 0, os.SEEK_SET)
os.ftruncate(fd, 0)
view = memoryview(updated)
while view:
    written = os.write(fd, view)
    if written <= 0:
        raise SystemExit(94)
    view = view[written:]
os.fsync(fd)

os.lseek(fd, 0, os.SEEK_SET)
verify = os.read(fd, 65536).decode("utf-8").splitlines()
if verify.count("CONSUMED=YES") != 1 or "CONSUMED=NO" in verify:
    raise SystemExit(95)

fcntl.flock(fd, fcntl.LOCK_UN)
PY_AUTH_TRANSACTION
    auth_transaction_rc=$?
    [[ "${auth_transaction_rc}" -eq 0 ]] || {
      echo "FAILED: authorization lock, validation, or consumption transaction failed"
      exit "${auth_transaction_rc}"
    }

    authorization_payload=""
    command -v psql >/dev/null 2>&1 || {
      echo "FAILED: PostgreSQL client is unavailable"
      exit 92
    }

    local psql_output
    psql_output="$(mktemp "/tmp/aifinder-phase-26yc-psql-redacted-${ts}.XXXXXX")"
    chmod 600 "${psql_output}"

    local psql_rc=0
    set +e
    PGSERVICEFILE="/dev/fd/${service_fd}" PGSERVICE="aifinder_preflight" \
      psql --no-psqlrc --set=ON_ERROR_STOP=0 --set=VERBOSITY=sqlstate --tuples-only --no-align \
        --command="SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;" \
        --command="SET statement_timeout = '10s';" \
        --command="SET lock_timeout = '5s';" \
        --file="${sql_candidate}" \
        --command='\echo __AIFINDER_LAST_ERROR_SQLSTATE__ :LAST_ERROR_SQLSTATE' \
        >"${psql_output}" 2>&1
    psql_rc=$?
    set -e

    local failure_class
    failure_class="$(python3 - "${psql_output}" "${psql_rc}" <<'PY_PSQL_CLASSIFY'
from pathlib import Path
import re
import sys

text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
psql_rc = int(sys.argv[2])
matches = re.findall(
    r"(?m)^__AIFINDER_LAST_ERROR_SQLSTATE__\s+([0-9A-Z]{5})\s*$",
    text,
)
code = matches[-1].upper() if matches else ""
classes = {
    "00": "SUCCESSFUL_COMPLETION",
    "01": "WARNING",
    "02": "NO_DATA",
    "03": "SQL_STATEMENT_NOT_YET_COMPLETE",
    "08": "CONNECTION_EXCEPTION",
    "09": "TRIGGERED_ACTION_EXCEPTION",
    "0A": "FEATURE_NOT_SUPPORTED",
    "0B": "INVALID_TRANSACTION_INITIATION",
    "0F": "LOCATOR_EXCEPTION",
    "0L": "INVALID_GRANTOR",
    "0P": "INVALID_ROLE_SPECIFICATION",
    "0Z": "DIAGNOSTICS_EXCEPTION",
    "20": "CASE_NOT_FOUND",
    "21": "CARDINALITY_VIOLATION",
    "22": "DATA_EXCEPTION",
    "23": "INTEGRITY_CONSTRAINT_VIOLATION",
    "24": "INVALID_CURSOR_STATE",
    "25": "INVALID_TRANSACTION_STATE",
    "26": "INVALID_SQL_STATEMENT_NAME",
    "27": "TRIGGERED_DATA_CHANGE_VIOLATION",
    "28": "INVALID_AUTHORIZATION_SPECIFICATION",
    "2B": "DEPENDENT_PRIVILEGE_DESCRIPTORS_STILL_EXIST",
    "2D": "INVALID_TRANSACTION_TERMINATION",
    "2F": "SQL_ROUTINE_EXCEPTION",
    "34": "INVALID_CURSOR_NAME",
    "38": "EXTERNAL_ROUTINE_EXCEPTION",
    "39": "EXTERNAL_ROUTINE_INVOCATION_EXCEPTION",
    "3B": "SAVEPOINT_EXCEPTION",
    "3D": "INVALID_CATALOG_NAME",
    "3F": "INVALID_SCHEMA_NAME",
    "40": "TRANSACTION_ROLLBACK",
    "42": "SYNTAX_OR_ACCESS_RULE_VIOLATION",
    "44": "WITH_CHECK_OPTION_VIOLATION",
    "53": "INSUFFICIENT_RESOURCES",
    "54": "PROGRAM_LIMIT_EXCEEDED",
    "55": "OBJECT_NOT_IN_PREREQUISITE_STATE",
    "57": "OPERATOR_INTERVENTION_OR_CANCELLATION",
    "58": "SYSTEM_ERROR",
    "72": "SNAPSHOT_FAILURE",
    "F0": "CONFIG_FILE_ERROR",
    "HV": "FOREIGN_DATA_WRAPPER_ERROR",
    "P0": "PLPGSQL_ERROR",
    "XX": "INTERNAL_ERROR",
}

if not code:
    lowered = text.lower()
    connection_patterns = [
        ("CONNECTION_DNS_RESOLUTION_FAILURE", (
            "could not translate host name",
            "name or service not known",
            "nodename nor servname provided",
        )),
        ("CONNECTION_TCP_REFUSED", ("connection refused",)),
        ("CONNECTION_TCP_UNREACHABLE", (
            "network is unreachable",
            "no route to host",
        )),
        ("CONNECTION_TIMEOUT", (
            "connection timed out",
            "timeout expired",
        )),
        ("CONNECTION_TLS_FAILURE", (
            "ssl error",
            "certificate verify failed",
            "tls",
        )),
        ("CONNECTION_AUTHENTICATION_FAILURE", (
            "password authentication failed",
            "authentication failed",
            "no password supplied",
            "sasl authentication failed",
        )),
        ("CONNECTION_DATABASE_SELECTION_FAILURE", (
            "database",
            "does not exist",
        )),
        ("CONNECTION_SERVER_CLOSED", (
            "server closed the connection unexpectedly",
        )),
    ]

    category = "CONNECTION_FAILURE_UNCLASSIFIED" if psql_rc != 0 else "SQLSTATE_MARKER_UNAVAILABLE"
    for label, needles in connection_patterns:
        if label == "CONNECTION_DATABASE_SELECTION_FAILURE":
            if all(needle in lowered for needle in needles):
                category = label
                break
        elif any(needle in lowered for needle in needles):
            category = label
            break
    print(category)
elif code == "00000":
    print("NO_SQL_FAILURE")
else:
    print(classes.get(code[:2], "UNRECOGNIZED_SQLSTATE_CLASS"))
PY_PSQL_CLASSIFY
)"

    if [[ "${failure_class}" != "NO_SQL_FAILURE" ]]; then
      rm -f "${psql_output}"
      echo "FAILED: read-only catalog preflight execution failed"
      echo "Redacted failure class: ${failure_class}"
      echo "psql exit status captured: YES"
      exit 100
    fi
    local output_line_count
    output_line_count="$(wc -l < "${psql_output}" | tr -d ' ')"
    rm -f "${psql_output}"

    {
      echo "# AiFinder Phase 26YC Live Preflight Review"
      echo
      echo "- Result: execution completed"
      echo "- Redacted output line count: ${output_line_count}"
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
