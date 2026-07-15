#!/usr/bin/env bash
# CANDIDATE ONLY — DO NOT EXECUTE UNTIL SEPARATELY APPROVED.
#
# AiFinder catalog-only live RLS metadata wrapper.
# Requires:
#   AIFINDER_RLS_METADATA_DATABASE_URL
#
# The connection value is never printed, hashed, measured, copied, or persisted.

set -u
set -o pipefail

readonly REPO="/Users/jamescarlodumaua/aifinder"
readonly EXPECTED_BASELINE="d117f9fe24e7de85ffdf92c631b7547b64bbfac2"
readonly QUERY_FILE="$REPO/scripts/discovery-live-rls-metadata-catalog-query.sql"
readonly EXPECTED_QUERY_SHA256="759d285ffa9f84eb5f996a80625a94342c77ca69e423b6aefc7bfcdae6d99bde"
readonly CONNECTION_ENV_NAME="AIFINDER_RLS_METADATA_DATABASE_URL"
readonly TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
readonly LOG="/tmp/aifinder-live-rls-metadata-${TIMESTAMP}.log"
readonly RAW_OUTPUT="/tmp/aifinder-live-rls-metadata-raw-${TIMESTAMP}.txt"

fail() {
  printf 'FAILED: %s\n' "$1"
  return 1
}

verify_repo() {
  local branch head ahead behind

  [[ -d "$REPO/.git" ]] || { fail "Repository not found"; return 1; }

  branch="$(git -C "$REPO" branch --show-current)"
  [[ "$branch" == "main" ]] || { fail "Expected branch main"; return 1; }

  git -C "$REPO" fetch origin main --quiet || {
    fail "Unable to fetch origin/main"
    return 1
  }

  head="$(git -C "$REPO" rev-parse HEAD)"
  [[ "$head" == "$EXPECTED_BASELINE" ]] || {
    fail "Baseline mismatch"
    return 1
  }

  [[ "$(git -C "$REPO" rev-parse origin/main)" == "$EXPECTED_BASELINE" ]] || {
    fail "origin/main mismatch"
    return 1
  }

  ahead="$(git -C "$REPO" rev-list --count origin/main..HEAD)"
  behind="$(git -C "$REPO" rev-list --count HEAD..origin/main)"
  [[ "$ahead" == "0" && "$behind" == "0" ]] || {
    fail "Repository is not synchronized"
    return 1
  }

  [[ -z "$(git -C "$REPO" status --porcelain)" ]] || {
    fail "Working tree must be clean"
    return 1
  }
}

verify_query_identity() {
  local actual_sha
  [[ -f "$QUERY_FILE" ]] || {
    fail "Immutable query file missing"
    return 1
  }

  actual_sha="$(shasum -a 256 "$QUERY_FILE" | awk '{print $1}')"
  [[ "$actual_sha" == "$EXPECTED_QUERY_SHA256" ]] || {
    fail "Immutable query SHA-256 mismatch"
    return 1
  }
}

verify_query_safety() {
  python3 - "$QUERY_FILE" <<'PY'
from __future__ import annotations

import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
sql = path.read_text(encoding="utf-8", errors="strict")
normalized = re.sub(r"--.*?$", "", sql, flags=re.M)
normalized = re.sub(r"/\*.*?\*/", "", normalized, flags=re.S)
lower = normalized.lower()

approved_sources = {
    "pg_catalog.pg_class",
    "pg_catalog.pg_namespace",
    "pg_catalog.pg_policy",
}

source_pattern = re.compile(r"\b(?:from|join)\s+([a-z_][a-z0-9_.]*)", re.I)
sources = {m.group(1).lower() for m in source_pattern.finditer(normalized)}
unapproved = sorted(sources - approved_sources)

prohibited = re.compile(
    r"\b(insert|update|delete|merge|truncate|create|alter|drop|grant|revoke|"
    r"vacuum|analyze|copy|call|do|execute|prepare|deallocate|listen|notify|"
    r"security\s+definer)\b",
    re.I,
)

if unapproved:
    print("UNAPPROVED_SQL_SOURCES=" + ",".join(unapproved))
    sys.exit(2)

if prohibited.search(normalized):
    print("PROHIBITED_SQL_KEYWORD_PRESENT=YES")
    sys.exit(3)

required_fragments = [
    "begin transaction read only",
    "set local statement_timeout = 5000",
    "rollback",
]

for fragment in required_fragments:
    if fragment not in lower:
        print("MISSING_REQUIRED_SQL_FRAGMENT=" + fragment)
        sys.exit(4)

print("CATALOG_SOURCE_ALLOWLIST=PASSED")
print("MUTATION_KEYWORD_SCAN=PASSED")
print("READ_ONLY_TRANSACTION_CONTRACT=PASSED")
PY
}

verify_connection_presence_only() {
  if [[ -n "${!CONNECTION_ENV_NAME+x}" && -n "${!CONNECTION_ENV_NAME}" ]]; then
    printf '%s_PRESENT=YES\n' "$CONNECTION_ENV_NAME"
  else
    printf '%s_PRESENT=NO\n' "$CONNECTION_ENV_NAME"
    fail "Approved connection environment variable is absent"
    return 1
  fi
}

run_catalog_queries() {
  command -v psql >/dev/null 2>&1 || {
    fail "psql is unavailable"
    return 1
  }

  # Connection value is passed directly and never echoed.
  psql \
    "${!CONNECTION_ENV_NAME}" \
    -w \
    --no-psqlrc \
    --set=ON_ERROR_STOP=1 \
    --set=VERBOSITY=terse \
    --pset=pager=off \
    --pset=footer=off \
    --file="$QUERY_FILE" \
    > "$RAW_OUTPUT" 2>&1
}

verify_output_safety() {
  if grep -Eiq \
    '(BEGIN (RSA|OPENSSH|EC|PGP) PRIVATE KEY|authorization:[[:space:]]*bearer|'
    'sk-[A-Za-z0-9_-]{16,}|eyJ[A-Za-z0-9._-]{20,}|postgres(ql)?://|'
    'password[[:space:]]*=|service[_-]?role[[:space:]]*=)' \
    "$RAW_OUTPUT"; then
    fail "Potential secret-like output detected"
    return 1
  fi
}

main() {
  printf '=== AiFinder Live RLS Metadata Inspection ===\n'
  printf 'Boundary: immutable catalog-only read-only queries.\n'

  verify_repo || return $?
  verify_query_identity || return $?
  verify_query_safety || return $?
  verify_connection_presence_only || return $?
  run_catalog_queries || return $?
  verify_output_safety || return $?

  cat "$RAW_OUTPUT"

  [[ -z "$(git -C "$REPO" status --porcelain)" ]] || {
    fail "Repository changed during metadata inspection"
    return 1
  }

  printf 'PASSED: CATALOG_ONLY_LIVE_RLS_METADATA_INSPECTION\n'
  printf 'Database mutation: NONE\n'
  printf 'Application row reads: NONE\n'
  printf 'Environment values printed: NO\n'
}

main "$@" 2>&1 | tee "$LOG"
rc=${PIPESTATUS[0]}

if [[ "$rc" -eq 0 ]]; then
  pbcopy < "$LOG" 2>/dev/null || true
else
  # Do not copy raw output after a failure because it may contain an
  # unexpected connection error. Copy only the high-level log after the
  # secret-like scan has passed or manually inspect locally.
  printf 'Failure log retained at: %s\n' "$LOG"
fi

rm -f "$RAW_OUTPUT"
exit "$rc"
