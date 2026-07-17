#!/usr/bin/env bash
# AIFINDER_AUTORUN_SCRIPT_V1
# Phase 27BJ narrow service-FD adapter candidate.
# Inert unless invoked with the exact --execute flag after Gemini approval.
set -uo pipefail

main() {
  local repo="/Users/jamescarlodumaua/aifinder"
  local wrapper="scripts/_drafts/discovery-phase-26yb-read-only-target-catalog-preflight-candidate.sh"
  local generator="scripts/_drafts/discovery-phase-26yh-one-use-authorization-record-generator-candidate.sh"
  local expected_wrapper_sha="723fc9c1398323079ffa41a80c371c7176f2be526cb4360334c76429a3066c51"
  local environment_class="staging"
  local ttl_seconds="300"
  local execute_flag="${1:-}"
  # Directed identity chain:
  # wrapper -> adapter -> manifest -> generator.
  # Generator verifies the manifest and adapter identity.
  # Adapter verifies generator presence, mode, and shell syntax.

  if [[ "${execute_flag}" != "--execute" || $# -ne 1 ]]; then
    echo "BLOCKED: Phase 27BJ adapter is inert without the exact --execute flag"
    echo "Runtime execution: NOT_PERFORMED"
    return 93
  fi

  (
    set -euo pipefail
    umask 077

    cd "${repo}"
    [[ "$(git rev-parse --show-toplevel)" == "${repo}" ]] || {
      echo "FAILED: repository scope mismatch"
      exit 10
    }
    [[ "$(git branch --show-current)" == "main" ]] || {
      echo "FAILED: branch mismatch"
      exit 11
    }
    [[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || {
      echo "FAILED: local HEAD is not synchronized with origin/main"
      exit 12
    }
    [[ "$(shasum -a 256 "${wrapper}" | awk '{print $1}')" == "${expected_wrapper_sha}" ]] || {
      echo "FAILED: wrapper identity mismatch"
      exit 14
    }
    [[ -f "${generator}" ]] || {
      echo "FAILED: generator file is missing"
      exit 15
    }
    [[ "$(stat -f '%Lp' "${generator}")" == "644" ]] || {
      echo "FAILED: generator mode mismatch"
      exit 15
    }
    bash -n "${generator}"

    command -v python3 >/dev/null 2>&1 || {
      echo "FAILED: Python 3 is unavailable"
      exit 16
    }
    command -v psql >/dev/null 2>&1 || {
      echo "FAILED: psql is unavailable"
      exit 17
    }

    [[ -n "${AIFINDER_RLS_METADATA_DATABASE_URL:-}" ]] || {
      echo "FAILED: approved database URL environment variable is missing"
      exit 79
    }

    local ts service_file raw_output issuance_output record_path=""
    local service_fd="9" authorization_fd="8" wrapper_rc=0
    ts="$(date +%Y%m%d-%H%M%S)"
    service_file="$(mktemp "/tmp/aifinder-phase-27bj-service-${ts}.XXXXXX")"
    raw_output="$(mktemp "/tmp/aifinder-phase-27bj-wrapper-raw-${ts}.XXXXXX")"
    chmod 600 "${service_file}" "${raw_output}"

    cleanup() {
      local cleanup_rc=$?
      if [[ -n "${service_fd:-}" ]]; then
        eval "exec ${service_fd}>&-" 2>/dev/null || true
      fi
      if [[ -n "${authorization_fd:-}" ]]; then
        eval "exec ${authorization_fd}>&-" 2>/dev/null || true
      fi
      if [[ -n "${record_path:-}" ]]; then
        rm -f -- "${record_path}" 2>/dev/null || true
      fi
      rm -f -- "${service_file:-}" "${raw_output:-}" 2>/dev/null || true
      unset AIFINDER_RLS_METADATA_DATABASE_URL
      return "${cleanup_rc}"
    }
    trap cleanup EXIT HUP INT TERM

    # Parse the URL inside Python and write only the exact libpq service keys.
    # No connection component is emitted to stdout, stderr, argv, or the log.
    AIFINDER_SERVICE_TARGET="${service_file}" python3 - <<'PY_SERVICE_ADAPTER'
import os
import stat
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

raw = os.environ.get("AIFINDER_RLS_METADATA_DATABASE_URL", "")
target_text = os.environ.get("AIFINDER_SERVICE_TARGET", "")
if not raw or not target_text:
    raise SystemExit(80)
if "\x00" in raw or "\n" in raw or "\r" in raw:
    raise SystemExit(81)

parsed = urlsplit(raw)
if parsed.scheme not in {"postgres", "postgresql"}:
    raise SystemExit(82)
if not parsed.hostname or parsed.username is None:
    raise SystemExit(83)

host = parsed.hostname
port = parsed.port or 5432
user = unquote(parsed.username)
password = unquote(parsed.password or "")
dbname = unquote(parsed.path.lstrip("/"))
if not dbname:
    raise SystemExit(84)

query = parse_qs(parsed.query, keep_blank_values=True)
sslmode_values = query.get("sslmode", [])
sslmode = sslmode_values[-1] if sslmode_values else "require"
allowed_sslmodes = {
    "disable", "allow", "prefer", "require",
    "verify-ca", "verify-full",
}
if sslmode not in allowed_sslmodes:
    raise SystemExit(85)

values = {
    "host": host,
    "port": str(port),
    "dbname": dbname,
    "user": user,
    "password": password,
    "sslmode": sslmode,
}
for value in values.values():
    if "\x00" in value or "\n" in value or "\r" in value:
        raise SystemExit(86)

target = Path(target_text)
payload = (
    "[aifinder_preflight]\n"
    + "".join(f"{key}={values[key]}\n" for key in (
        "host", "port", "dbname", "user", "password", "sslmode"
    ))
)
fd = os.open(
    target,
    os.O_WRONLY | os.O_TRUNC,
    0o600,
)
try:
    data = payload.encode("utf-8")
    view = memoryview(data)
    written = 0
    while written < len(view):
        written += os.write(fd, view[written:])
    os.fsync(fd)
finally:
    os.close(fd)

os.chmod(target, 0o600)
st = target.stat()
if not stat.S_ISREG(st.st_mode):
    raise SystemExit(87)
if stat.S_IMODE(st.st_mode) != 0o600 or st.st_uid != os.getuid():
    raise SystemExit(88)
PY_SERVICE_ADAPTER

    unset AIFINDER_SERVICE_TARGET

    # Mint one authorization record and capture only the generator's structured
    # handoff. Authorization contents are never read by this adapter.
    issuance_output="$(
      bash "${generator}" \
        --environment-class "${environment_class}" \
        --ttl-seconds "${ttl_seconds}"
    )"

    record_path="$(
      printf '%s\n' "${issuance_output}" |
      awk -F= '$1=="RECORD_PATH"{print substr($0,index($0,"=")+1)}'
    )"
    local scope
    scope="$(
      printf '%s\n' "${issuance_output}" |
      awk -F= '$1=="SCOPE"{print substr($0,index($0,"=")+1)}'
    )"

    [[ "${record_path}" == /tmp/aifinder-phase-26yc-authorization-*.txt ]] || {
      echo "FAILED: authorization path is outside approved scope"
      exit 89
    }
    [[ "${scope}" == "READ_ONLY_CATALOG_PREFLIGHT_ONLY" ]] || {
      echo "FAILED: authorization scope mismatch"
      exit 90
    }
    [[ -f "${record_path}" ]] || {
      echo "FAILED: authorization record is missing"
      exit 91
    }
    [[ "$(stat -f '%Lp' "${record_path}")" == "600" ]] || {
      echo "FAILED: authorization record mode mismatch"
      exit 92
    }
    [[ "$(stat -f '%u' "${record_path}")" == "$(id -u)" ]] || {
      echo "FAILED: authorization record owner mismatch"
      exit 94
    }

    exec 9<>"${service_file}"
    exec 8<>"${record_path}"

    if bash "${wrapper}" \
      --service-fd "${service_fd}" \
      --authorization-fd "${authorization_fd}" \
      --environment-class "${environment_class}" \
      >"${raw_output}" 2>&1
    then
      wrapper_rc=0
    else
      wrapper_rc=$?
    fi

    # Emit only allowlisted categorical evidence. Never emit raw wrapper lines.
    python3 - "${raw_output}" "${wrapper_rc}" <<'PY_REDACT'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
wrapper_rc = int(sys.argv[2])
text = path.read_text(encoding="utf-8", errors="replace")

allowed_exact = re.compile(
    r"^(?:"
    r"PSQL_[A-Z0-9_]+|"
    r"PSQL_CERT_UNCLASSIFIED_HAS_(?:SSL|CERT|CA|VERIFY|SELF_SIGNED|UNKNOWN)_TERM=(?:TRUE|FALSE)|"
    r"PSQL_EXIT_CODE=[0-9]+|"
    r"WRAPPER_RESULT=[A-Z0-9_]+"
    r")$"
)

selected = []
for raw_line in text.splitlines():
    line = raw_line.strip()
    if allowed_exact.fullmatch(line):
        selected.append(line)

print("=== AiFinder Phase 27BJ Redacted Runtime Evidence ===")
print(f"WRAPPER_EXIT_CODE={wrapper_rc}")
if selected:
    for line in selected:
        print(line)
else:
    print("REDACTED_EVIDENCE_COUNT=0")
print("RAW_OUTPUT_EMITTED=NO")
print("DATABASE_MUTATION=NOT_AUTHORIZED")
print("OPERATIONAL_REACTIVATION=BLOCKED_PENDING_GEMINI")
PY_REDACT

    return "${wrapper_rc}"
  )
}

main "$@"
exit $?
