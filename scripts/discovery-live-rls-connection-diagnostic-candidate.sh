#!/usr/bin/env bash
# CANDIDATE ONLY — DO NOT EXECUTE UNTIL SEPARATELY APPROVED.
#
# Sanitized PostgreSQL connection diagnostic.
# Reports only one category:
# - CONNECTION_OK
# - AUTHENTICATION_FAILED
# - DNS_OR_HOST_FAILED
# - NETWORK_TIMEOUT
# - DATABASE_NOT_FOUND
# - SSL_OR_TLS_FAILED
# - MALFORMED_CONNECTION_URL
# - PSQL_NOT_AVAILABLE
# - UNKNOWN_CONNECTION_FAILURE
#
# Never prints the connection URL, password, host, username, database rows,
# raw psql output, or server detail strings.

set -u
set -o pipefail

readonly REPO="/Users/jamescarlodumaua/aifinder"
readonly PACKAGE_BASELINE="aff7af4904999687e71c2678acc61bb1a5a7b02d"
readonly CONNECTION_ENV_NAME="AIFINDER_RLS_METADATA_DATABASE_URL"
readonly RAW_ERROR="/tmp/aifinder-rls-connection-diagnostic-raw-$(date -u +%Y%m%dT%H%M%SZ).txt"

fail() {
  printf 'FAILED: %s\n' "$1"
  return 1
}

verify_repo() {
  local head

  [[ -d "$REPO/.git" ]] || { fail "Repository not found"; return 1; }

  git -C "$REPO" fetch origin main --quiet || {
    fail "Unable to fetch origin/main"
    return 1
  }

  head="$(git -C "$REPO" rev-parse HEAD)"

  [[ "$(git -C "$REPO" rev-parse origin/main)" == "$head" ]] || {
    fail "HEAD and origin/main differ"
    return 1
  }

  git -C "$REPO" merge-base --is-ancestor "$PACKAGE_BASELINE" "$head" || {
    fail "Approved package baseline is not an ancestor of HEAD"
    return 1
  }

  [[ -z "$(git -C "$REPO" status --porcelain)" ]] || {
    fail "Working tree must be clean"
    return 1
  }
}

verify_connection_presence_only() {
  if [[ -n "${!CONNECTION_ENV_NAME+x}" && -n "${!CONNECTION_ENV_NAME}" ]]; then
    printf '%s_PRESENT=YES\n' "$CONNECTION_ENV_NAME"
  else
    printf '%s_PRESENT=NO\n' "$CONNECTION_ENV_NAME"
    return 2
  fi
}

classify_error() {
  python3 - "$RAW_ERROR" <<'PY'
from pathlib import Path
import re
import sys

text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace").lower()

patterns = [
    ("AUTHENTICATION_FAILED", [
        r"password authentication failed",
        r"authentication failed",
        r"invalid password",
    ]),
    ("DNS_OR_HOST_FAILED", [
        r"could not translate host name",
        r"name or service not known",
        r"nodename nor servname provided",
        r"no such host",
    ]),
    ("NETWORK_TIMEOUT", [
        r"connection timed out",
        r"timeout expired",
        r"operation timed out",
    ]),
    ("DATABASE_NOT_FOUND", [
        r'database "[^"]+" does not exist',
    ]),
    ("SSL_OR_TLS_FAILED", [
        r"ssl error",
        r"tls",
        r"certificate verify failed",
    ]),
    ("MALFORMED_CONNECTION_URL", [
        r"invalid uri",
        r"missing \"=\" after",
        r"invalid connection option",
        r"could not parse",
    ]),
]

for category, regexes in patterns:
    if any(re.search(rx, text) for rx in regexes):
        print(category)
        sys.exit(0)

print("UNKNOWN_CONNECTION_FAILURE")
PY
}

run_diagnostic() {
  command -v psql >/dev/null 2>&1 || {
    printf 'PSQL_NOT_AVAILABLE\n'
    return 3
  }

  # Executes only SELECT 1 to verify connectivity.
  # No application relation is referenced.
  if psql \
      "${!CONNECTION_ENV_NAME}" \
      -w \
      --no-psqlrc \
      --set=ON_ERROR_STOP=1 \
      --set=VERBOSITY=terse \
      --command='select 1;' \
      >/dev/null 2>"$RAW_ERROR"; then
    printf 'CONNECTION_OK\n'
    rm -f "$RAW_ERROR"
    return 0
  fi

  classify_error
  rm -f "$RAW_ERROR"
  return 4
}

main() {
  printf '=== AiFinder Sanitized PostgreSQL Connection Diagnostic ===\n'
  printf 'Boundary: one connection test using SELECT 1 only.\n'

  verify_repo || return $?
  verify_connection_presence_only || return $?
  run_diagnostic
}

main
exit $?
