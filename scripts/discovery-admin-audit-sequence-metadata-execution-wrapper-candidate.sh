#!/usr/bin/env bash
# CANDIDATE ONLY — DO NOT EXECUTE WITHOUT A NEW ONE-TIME TOKEN.
#
# Dedicated admin audit sequence metadata execution wrapper.
# Bound query SHA-256:
# 2b231fe90f7e0cfca150535cb2d90b7ab96514fa50d7efc567cdeecba4738d43

set -u
set -o pipefail

readonly REPO="/Users/jamescarlodumaua/aifinder"
readonly PACKAGE_BASELINE="0bb936c98d8e5d46e6acf9a09a1c494a94b5b405"
readonly QUERY_FILE="scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql"
readonly EXPECTED_QUERY_SHA="2b231fe90f7e0cfca150535cb2d90b7ab96514fa50d7efc567cdeecba4738d43"
readonly CONNECTION_ENV_NAME="AIFINDER_RLS_METADATA_DATABASE_URL"
readonly RAW_OUTPUT="/tmp/aifinder-sequence-metadata-raw-$(date -u +%Y%m%dT%H%M%SZ).txt"

fail() {
  printf 'FAILED: %s\n' "$1"
  return 1
}

sha256_file() {
  shasum -a 256 "$1" | awk '{print $1}'
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

  [[ "$(sha256_file "$REPO/$QUERY_FILE")" == "$EXPECTED_QUERY_SHA" ]] || {
    fail "Query SHA-256 mismatch"
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

verify_query_safety() {
  python3 - "$REPO/$QUERY_FILE" <<'PY'
from pathlib import Path
import re
import sys

text = Path(sys.argv[1]).read_text(encoding="utf-8")
lower = re.sub(r"--[^\n]*", "", text.lower())

for token in ("begin read only", "statement_timeout", "lock_timeout", "rollback"):
    if token not in lower:
        raise SystemExit(f"Missing required safety token: {token}")

for pattern in (
    r"\binsert\b", r"\bupdate\b", r"\bdelete\b", r"\btruncate\b",
    r"\bdrop\b", r"\balter\b", r"\bcreate\b", r"\bgrant\b",
    r"\brevoke\b", r"\bcomment\s+on\b", r"\bcopy\b", r"\bcall\b",
    r"\bdo\s+\$", r"\bexecute\b",
):
    if re.search(pattern, lower):
        raise SystemExit(f"Forbidden mutation token found: {pattern}")

allowed = {
    "pg_catalog.pg_class",
    "pg_catalog.pg_namespace",
    "pg_catalog.pg_roles",
    "pg_catalog.pg_sequence",
    "pg_catalog.pg_depend",
    "pg_catalog.pg_attribute",
    "information_schema.role_usage_grants",
}

refs = set(re.findall(
    r"\b(?:from|join)\s+((?:pg_catalog|information_schema)\.[a-z_]+)",
    lower,
))
unexpected = refs - allowed
if unexpected:
    raise SystemExit(f"Unexpected metadata sources: {sorted(unexpected)}")

if "admin_audit_logs_id_seq" not in lower:
    raise SystemExit("Target sequence missing")

print("SEQUENCE_METADATA_QUERY_STATIC_SAFETY=PASSED")
PY
}

verify_output_safety() {
  if grep -Eiq     '(BEGIN (RSA|OPENSSH|EC|PGP) PRIVATE KEY|authorization:[[:space:]]*bearer|sk-[A-Za-z0-9_-]{16,}|eyJ[A-Za-z0-9._-]{20,}|postgres(ql)?://|password[[:space:]]*=|service[_-]?role[[:space:]]*=)'     "$RAW_OUTPUT"; then
    rm -f "$RAW_OUTPUT"
    fail "Potential secret-like output detected"
    return 1
  fi
}

main() {
  local rc

  printf '=== AiFinder Admin Audit Sequence Metadata Inspection ===\n'
  printf 'Boundary: exact sequence catalog-only read-only query.\n'

  verify_repo || return $?
  verify_query_safety || return $?
  verify_connection_presence_only || return $?

  command -v psql >/dev/null 2>&1 || {
    fail "psql not available"
    return 3
  }

  set +e
  psql     "${!CONNECTION_ENV_NAME}"     -w     --no-psqlrc     --set=ON_ERROR_STOP=1     --file="$REPO/$QUERY_FILE"     >"$RAW_OUTPUT" 2>&1
  rc=$?
  set -e

  if [[ "$rc" -ne 0 ]]; then
    rm -f "$RAW_OUTPUT"
    fail "Sequence metadata query failed"
    return "$rc"
  fi

  verify_output_safety || return $?

  cat "$RAW_OUTPUT"
  rm -f "$RAW_OUTPUT"

  printf 'PASSED: ADMIN_AUDIT_SEQUENCE_METADATA_INSPECTION\n'
  printf 'Database mutation: NONE\n'
  printf 'Application row reads: NONE\n'
  printf 'Environment values printed: NO\n'
}

main
exit $?
