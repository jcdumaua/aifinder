#!/usr/bin/env bash
# CANDIDATE ONLY — DO NOT EXECUTE WITHOUT A NEW ONE-TIME TOKEN.
#
# Dedicated catalog DDL metadata execution wrapper.
# Bound SQL SHA-256:
# b2b93480012f4dbec65203c556829b61b49500ab85fd5e0c493084b9b57f3589

set -u
set -o pipefail

readonly REPO="/Users/jamescarlodumaua/aifinder"
readonly PACKAGE_BASELINE="5a7f152c97cea39fe3090069bd5a7efb4fec28d6"
readonly SQL_FILE="scripts/discovery-rls-drift-catalog-ddl-metadata-query-candidate.sql"
readonly EXPECTED_SQL_SHA="b2b93480012f4dbec65203c556829b61b49500ab85fd5e0c493084b9b57f3589"
readonly CONNECTION_ENV_NAME="AIFINDER_RLS_METADATA_DATABASE_URL"
readonly RAW_OUTPUT="/tmp/aifinder-catalog-ddl-metadata-raw-$(date -u +%Y%m%dT%H%M%SZ).txt"

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

  [[ "$(sha256_file "$REPO/$SQL_FILE")" == "$EXPECTED_SQL_SHA" ]] || {
    fail "SQL SHA-256 mismatch"
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
  python3 - "$REPO/$SQL_FILE" <<'PY'
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
    "pg_catalog.pg_policy",
    "pg_catalog.pg_class",
    "pg_catalog.pg_namespace",
    "pg_catalog.pg_roles",
    "pg_catalog.pg_attribute",
    "pg_catalog.pg_attrdef",
    "pg_catalog.pg_constraint",
    "pg_catalog.pg_index",
    "pg_catalog.pg_trigger",
    "information_schema.role_table_grants",
}

refs = set(re.findall(
    r"\b(?:from|join)\s+((?:pg_catalog|information_schema)\.[a-z_]+)",
    lower,
))
unexpected = refs - allowed
if unexpected:
    raise SystemExit(f"Unexpected catalog relations: {sorted(unexpected)}")

print("CATALOG_DDL_QUERY_STATIC_SAFETY=PASSED")
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

  printf '=== AiFinder Catalog DDL Metadata Inspection ===\n'
  printf 'Boundary: exact catalog-only read-only query.\n'

  verify_repo || return $?
  verify_query_safety || return $?
  verify_connection_presence_only || return $?

  command -v psql >/dev/null 2>&1 || {
    fail "psql not available"
    return 3
  }

  set +e
  psql     "${!CONNECTION_ENV_NAME}"     -w     --no-psqlrc     --set=ON_ERROR_STOP=1     --file="$REPO/$SQL_FILE"     >"$RAW_OUTPUT" 2>&1
  rc=$?
  set -e

  if [[ "$rc" -ne 0 ]]; then
    rm -f "$RAW_OUTPUT"
    fail "Catalog DDL metadata query failed"
    return "$rc"
  fi

  verify_output_safety || return $?

  cat "$RAW_OUTPUT"
  rm -f "$RAW_OUTPUT"

  printf 'PASSED: CATALOG_DDL_METADATA_INSPECTION\n'
  printf 'Database mutation: NONE\n'
  printf 'Application row reads: NONE\n'
  printf 'Environment values printed: NO\n'
}

main
exit $?
