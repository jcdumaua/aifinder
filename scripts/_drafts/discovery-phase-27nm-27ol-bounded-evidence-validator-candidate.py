#!/usr/bin/env python3
"""Review-only bounded evidence validator for Phase 27NM-27OL.

This standalone candidate has no database, network, environment, application,
or wrapper dependency. It accepts raw evidence on stdin and writes nothing
unless an explicit output target is supplied.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import os
import re
import stat
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Final, NoReturn, Sequence


MAX_INPUT_BYTES: Final[int] = 16_384
MAX_VALUE_BYTES: Final[int] = 256
MAX_INTEGER: Final[int] = 9_223_372_036_854_775_807
REPOSITORY_ROOT: Final[Path] = Path("/Users/jamescarlodumaua/aifinder")
OUTPUT_NAME_RE: Final[re.Pattern[str]] = re.compile(
    r"^aifinder-phase-27nm-27ol-bounded-evidence-\d{8}T\d{6}Z\.txt$"
)
SHA256_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
TIMESTAMP_RE: Final[re.Pattern[str]] = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$"
)
INTEGER_RE: Final[re.Pattern[str]] = re.compile(r"^(?:0|[1-9][0-9]*)$")

EXPECTED_KEYS: Final[tuple[str, ...]] = (
    "TARGET_ENVIRONMENT_CLASSIFICATION",
    "EVIDENCE_TIMESTAMP_UTC",
    "SNAPSHOT_IDENTITY_CLASSIFICATION",
    "EXPECTED_REPOSITORY_MIGRATION_COUNT",
    "EXPECTED_HISTORY_IDENTITY_COUNT",
    "LIVE_HISTORY_ENTRY_COUNT",
    "MATCHED_HISTORY_IDENTITY_COUNT",
    "MISSING_HISTORY_IDENTITY_COUNT",
    "UNEXPECTED_HISTORY_IDENTITY_COUNT",
    "DUPLICATED_HISTORY_IDENTITY_COUNT",
    "RENAMED_SAME_CONTENT_COUNT",
    "DIFFERENT_CONTENT_COUNT",
    "MIGRATION_HISTORY_OVERALL_CLASSIFICATION",
    "EXPECTED_RELATION_COUNT",
    "PRESENT_RELATION_COUNT",
    "MISSING_RELATION_COUNT",
    "RLS_ENABLED_COUNT",
    "RLS_FORCED_COUNT",
    "EXPECTED_POLICY_COUNT",
    "MATCHED_POLICY_COUNT",
    "UNEXPECTED_POLICY_COUNT",
    "TOOLS_LEGACY_POLICY_COUNT",
    "TOOLS_APPROVED_ONLY_POLICY_COUNT",
    "POLICY_CLASSIFICATION",
    "EXPECTED_GRANT_CLASS_COUNT",
    "MATCHED_GRANT_CLASS_COUNT",
    "UNEXPECTED_GRANT_CLASS_COUNT",
    "PUBLIC_GRANT_CLASSIFICATION",
    "ANON_GRANT_CLASSIFICATION",
    "AUTHENTICATED_GRANT_CLASSIFICATION",
    "SERVICE_ROLE_GRANT_CLASSIFICATION",
    "OWNERSHIP_CLASSIFICATION",
    "SEQUENCE_DEPENDENCY_CLASSIFICATION",
    "FUNCTION_SECURITY_CLASSIFICATION",
    "TRIGGER_DEPENDENCY_CLASSIFICATION",
    "OUT_OF_BAND_DRIFT_CLASSIFICATION",
    "FORWARD_PRECONDITION_CLASSIFICATION",
    "ROLLBACK_PRECONDITION_CLASSIFICATION",
    "TYPE_GENERATION_ELIGIBILITY_CLASSIFICATION",
    "ROW_VALUES_PRINTED",
    "RAW_CATALOG_ROWS_PRINTED",
    "RAW_MIGRATION_HISTORY_ROWS_PRINTED",
    "POLICY_EXPRESSIONS_PRINTED",
    "GRANT_ROWS_PRINTED",
    "OWNER_IDENTITIES_PRINTED",
    "FUNCTION_BODIES_PRINTED",
    "TRIGGER_DEFINITIONS_PRINTED",
    "INDEX_DEFINITIONS_PRINTED",
    "CONSTRAINT_DEFINITIONS_PRINTED",
    "DATABASE_URL_PRINTED",
    "HOSTNAMES_PRINTED",
    "PROJECT_REFERENCE_PRINTED",
    "CREDENTIALS_PRINTED",
    "SECRETS_PRINTED",
    "RAW_ERROR_TEXT_PRINTED",
    "UNAPPROVED_DATABASE_IDENTIFIERS_PRINTED",
)

CATEGORICAL_ALLOWLISTS: Final[dict[str, frozenset[str]]] = {
    "TARGET_ENVIRONMENT_CLASSIFICATION": frozenset(
        {"LOCAL", "PREVIEW", "STAGING", "PRODUCTION"}
    ),
    "MIGRATION_HISTORY_OVERALL_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "DUPLICATED", "OUT_OF_BAND", "DRIFT", "EXACT_MATCH"}
    ),
    "POLICY_CLASSIFICATION": frozenset(
        {"SEMANTIC_MISMATCH", "MISSING", "UNEXPECTED", "EXACT_MATCH", "UNAVAILABLE"}
    ),
    "PUBLIC_GRANT_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "EXPECTED_NONE", "UNEXPECTED_PRESENT"}
    ),
    "ANON_GRANT_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "EXPECTED_NONE", "UNEXPECTED_PRESENT"}
    ),
    "AUTHENTICATED_GRANT_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "EXPECTED_NONE", "UNEXPECTED_PRESENT"}
    ),
    "SERVICE_ROLE_GRANT_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "INSUFFICIENT", "SUFFICIENT", "UNEXPECTED"}
    ),
    "OWNERSHIP_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "EXPECTED_MATCH", "MISMATCH"}
    ),
    "SEQUENCE_DEPENDENCY_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "MISSING", "EXPECTED_MATCH", "MISMATCH"}
    ),
    "FUNCTION_SECURITY_CLASSIFICATION": frozenset(
        {
            "UNAVAILABLE",
            "EXPECTED_MATCH",
            "MISSING",
            "UNSAFE_DEFINER_OR_SEARCH_PATH",
            "UNEXPECTED_EXECUTE_GRANT",
        }
    ),
    "TRIGGER_DEPENDENCY_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "EXPECTED_MATCH", "MISSING", "UNEXPECTED"}
    ),
    "OUT_OF_BAND_DRIFT_CLASSIFICATION": frozenset(
        {
            "UNAVAILABLE",
            "MULTIPLE",
            "MIGRATION_HISTORY",
            "SCHEMA",
            "POLICY",
            "GRANT",
            "FUNCTION_OR_TRIGGER",
            "NONE",
        }
    ),
    "FORWARD_PRECONDITION_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "PASS", "FAIL"}
    ),
    "ROLLBACK_PRECONDITION_CLASSIFICATION": frozenset(
        {"UNAVAILABLE", "PASS", "FAIL"}
    ),
    "TYPE_GENERATION_ELIGIBILITY_CLASSIFICATION": frozenset(
        {"BLOCKED", "UNAVAILABLE"}
    ),
}

LITERAL_VALUES: Final[dict[str, str]] = {
    "SNAPSHOT_IDENTITY_CLASSIFICATION": "SINGLE_READ_ONLY_TRANSACTION",
    "EXPECTED_REPOSITORY_MIGRATION_COUNT": "24",
    "EXPECTED_GRANT_CLASS_COUNT": "4",
}

INTEGER_KEYS: Final[frozenset[str]] = frozenset(
    {"EXPECTED_RELATION_COUNT", "EXPECTED_POLICY_COUNT"}
)
INTEGER_OR_UNAVAILABLE_KEYS: Final[frozenset[str]] = frozenset(
    {
        "EXPECTED_HISTORY_IDENTITY_COUNT",
        "LIVE_HISTORY_ENTRY_COUNT",
        "MATCHED_HISTORY_IDENTITY_COUNT",
        "MISSING_HISTORY_IDENTITY_COUNT",
        "UNEXPECTED_HISTORY_IDENTITY_COUNT",
        "DUPLICATED_HISTORY_IDENTITY_COUNT",
        "RENAMED_SAME_CONTENT_COUNT",
        "DIFFERENT_CONTENT_COUNT",
        "PRESENT_RELATION_COUNT",
        "MISSING_RELATION_COUNT",
        "RLS_ENABLED_COUNT",
        "RLS_FORCED_COUNT",
        "MATCHED_POLICY_COUNT",
        "UNEXPECTED_POLICY_COUNT",
        "TOOLS_LEGACY_POLICY_COUNT",
        "TOOLS_APPROVED_ONLY_POLICY_COUNT",
        "MATCHED_GRANT_CLASS_COUNT",
        "UNEXPECTED_GRANT_CLASS_COUNT",
    }
)
NEGATIVE_ASSERTION_KEYS: Final[frozenset[str]] = frozenset(EXPECTED_KEYS[39:])

SENSITIVE_PATTERNS: Final[tuple[re.Pattern[str], ...]] = (
    re.compile(r"(?i)(?:postgres(?:ql)?|supabase)://"),
    re.compile(r"(?i)(?:ERROR|FATAL|DETAIL|HINT|CONTEXT):"),
    re.compile(r"(?i)\bSQLSTATE\b"),
    re.compile(r"(?i)(?:db\.)?[a-z0-9]{20,}\.supabase\.co\b"),
    re.compile(r"\bAKIA[A-Z0-9]{16}\b"),
    re.compile(r"\b(?:sk|sbp)_[A-Za-z0-9_-]{16,}\b"),
    re.compile(r"^[a-z][a-z0-9]*_[a-z0-9_]+$"),
)

EXIT_CODES: Final[dict[str, int]] = {
    "USAGE": 2,
    "INPUT_ENCODING": 10,
    "INPUT_SIZE": 11,
    "LINE_ENDING": 12,
    "LINE_COUNT": 13,
    "KEY_CONTRACT": 14,
    "DELIMITER": 15,
    "EMPTY_VALUE": 16,
    "WHITESPACE": 17,
    "INTEGER": 18,
    "TIMESTAMP": 19,
    "CATEGORY": 20,
    "NEGATIVE_ASSERTION": 21,
    "SENSITIVE_VALUE": 22,
    "DIGEST_MISMATCH": 23,
    "OUTPUT_PERSISTENCE": 24,
    "INTERNAL": 70,
}


@dataclass(frozen=True)
class CliOptions:
    output: Path | None
    normalized_output_fd: int | None
    expected_sha256: str | None


class ValidationFailure(Exception):
    def __init__(self, category: str) -> None:
        super().__init__(category)
        self.category = category


def fail(category: str) -> NoReturn:
    raise ValidationFailure(category)


def parse_cli(argv: Sequence[str]) -> CliOptions:
    output: Path | None = None
    normalized_output_fd: int | None = None
    expected_sha256: str | None = None
    index = 0
    while index < len(argv):
        flag = argv[index]
        if index + 1 >= len(argv):
            fail("USAGE")
        value = argv[index + 1]
        if flag == "--output" and output is None:
            output = Path(value)
        elif flag == "--normalized-output-fd" and normalized_output_fd is None:
            if re.fullmatch(r"[0-9]+", value) is None or int(value) < 3:
                fail("USAGE")
            normalized_output_fd = int(value)
        elif flag == "--expected-sha256" and expected_sha256 is None:
            if SHA256_RE.fullmatch(value) is None:
                fail("USAGE")
            expected_sha256 = value
        else:
            fail("USAGE")
        index += 2
    return CliOptions(
        output=output,
        normalized_output_fd=normalized_output_fd,
        expected_sha256=expected_sha256,
    )


def read_stdin() -> bytes:
    raw = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
    if len(raw) > MAX_INPUT_BYTES:
        fail("INPUT_SIZE")
    return raw


def validate_integer(value: str) -> None:
    if len(value) > 19 or INTEGER_RE.fullmatch(value) is None:
        fail("INTEGER")
    if int(value) > MAX_INTEGER:
        fail("INTEGER")


def contains_sensitive_value(value: str) -> bool:
    return any(pattern.search(value) is not None for pattern in SENSITIVE_PATTERNS)


def validate_timestamp(value: str) -> None:
    if TIMESTAMP_RE.fullmatch(value) is None:
        fail("TIMESTAMP")
    try:
        parsed = dt.datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        fail("TIMESTAMP")
    if parsed.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z" != value:
        fail("TIMESTAMP")


def validate_value(key: str, value: str) -> None:
    if not value:
        fail("EMPTY_VALUE")
    if contains_sensitive_value(value):
        fail("SENSITIVE_VALUE")
    if value != value.strip() or any(character.isspace() for character in value):
        fail("WHITESPACE")
    if len(value.encode("ascii", "strict")) > MAX_VALUE_BYTES:
        fail("INPUT_SIZE")

    if key in NEGATIVE_ASSERTION_KEYS:
        if value != "false":
            fail("NEGATIVE_ASSERTION")
        return
    if key in LITERAL_VALUES:
        if value != LITERAL_VALUES[key]:
            fail("CATEGORY")
        return
    if key == "EVIDENCE_TIMESTAMP_UTC":
        validate_timestamp(value)
        return
    if key in INTEGER_KEYS:
        validate_integer(value)
        return
    if key in INTEGER_OR_UNAVAILABLE_KEYS:
        if value != "UNAVAILABLE":
            validate_integer(value)
        return
    if key in CATEGORICAL_ALLOWLISTS:
        if value not in CATEGORICAL_ALLOWLISTS[key]:
            fail("CATEGORY")
        return
    fail("INTERNAL")


def validate_and_normalize(raw: bytes) -> tuple[bytes, str]:
    try:
        decoded = raw.decode("utf-8", "strict")
    except UnicodeDecodeError:
        fail("INPUT_ENCODING")
    if "\x00" in decoded:
        fail("INPUT_ENCODING")
    if "\r" in decoded or not decoded.endswith("\n"):
        fail("LINE_ENDING")
    lines = decoded[:-1].split("\n")
    if len(lines) != len(EXPECTED_KEYS):
        fail("LINE_COUNT")

    normalized_lines: list[str] = []
    for expected_key, line in zip(EXPECTED_KEYS, lines):
        if line.count("|") != 1:
            fail("DELIMITER")
        key, value = line.split("|", 1)
        if key != key.strip() or value != value.strip():
            fail("WHITESPACE")
        if key != expected_key:
            fail("KEY_CONTRACT")
        try:
            key.encode("ascii", "strict")
            value.encode("ascii", "strict")
        except UnicodeEncodeError:
            fail("INPUT_ENCODING")
        validate_value(key, value)
        normalized_lines.append(f"{key}|{value}")

    normalized = ("\n".join(normalized_lines) + "\n").encode("ascii")
    digest = hashlib.sha256(normalized).hexdigest()
    return normalized, digest


def open_output_directory(path: Path) -> tuple[int, str]:
    if not path.is_absolute() or OUTPUT_NAME_RE.fullmatch(path.name) is None:
        fail("OUTPUT_PERSISTENCE")
    parent = path.parent
    try:
        parent_lstat = parent.lstat()
        resolved_parent = parent.resolve(strict=True)
    except OSError:
        fail("OUTPUT_PERSISTENCE")
    if stat.S_ISLNK(parent_lstat.st_mode) or not stat.S_ISDIR(parent_lstat.st_mode):
        fail("OUTPUT_PERSISTENCE")
    if resolved_parent == REPOSITORY_ROOT or REPOSITORY_ROOT in resolved_parent.parents:
        fail("OUTPUT_PERSISTENCE")
    if parent_lstat.st_uid != os.getuid() or parent_lstat.st_mode & 0o022:
        fail("OUTPUT_PERSISTENCE")
    try:
        directory_fd = os.open(parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    except OSError:
        fail("OUTPUT_PERSISTENCE")
    return directory_fd, path.name


def persist_to_directory_fd(
    directory_fd: int, final_name: str, normalized: bytes, digest: str
) -> None:
    payload = normalized + f"BOUNDED_EVIDENCE_SHA256|{digest}\n".encode("ascii")
    temporary_name = f".aifinder-evidence-{os.getpid()}-{digest[:16]}.tmp"
    temporary_created = False
    final_created = False
    completed = False
    try:
        directory_state = os.fstat(directory_fd)
        if (
            not stat.S_ISDIR(directory_state.st_mode)
            or directory_state.st_uid != os.getuid()
            or directory_state.st_mode & 0o022
        ):
            fail("OUTPUT_PERSISTENCE")
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW
        temporary_fd = os.open(
            temporary_name, flags, 0o600, dir_fd=directory_fd
        )
        temporary_created = True
        try:
            os.fchmod(temporary_fd, 0o600)
            written = 0
            while written < len(payload):
                count = os.write(temporary_fd, payload[written:])
                if count <= 0:
                    fail("OUTPUT_PERSISTENCE")
                written += count
            os.fsync(temporary_fd)
            created = os.fstat(temporary_fd)
            if not stat.S_ISREG(created.st_mode) or stat.S_IMODE(created.st_mode) != 0o600:
                fail("OUTPUT_PERSISTENCE")
        finally:
            os.close(temporary_fd)
        os.link(
            temporary_name,
            final_name,
            src_dir_fd=directory_fd,
            dst_dir_fd=directory_fd,
            follow_symlinks=False,
        )
        final_created = True
        final_state = os.stat(final_name, dir_fd=directory_fd, follow_symlinks=False)
        if (
            not stat.S_ISREG(final_state.st_mode)
            or stat.S_IMODE(final_state.st_mode) != 0o600
        ):
            fail("OUTPUT_PERSISTENCE")
        os.unlink(temporary_name, dir_fd=directory_fd)
        temporary_created = False
        os.fsync(directory_fd)
        completed = True
    except ValidationFailure:
        raise
    except OSError:
        fail("OUTPUT_PERSISTENCE")
    finally:
        if not completed and final_created and directory_fd >= 0:
            try:
                os.unlink(final_name, dir_fd=directory_fd)
            except OSError:
                pass
        if temporary_created and directory_fd >= 0:
            try:
                os.unlink(temporary_name, dir_fd=directory_fd)
            except OSError:
                pass


def persist_exclusive(path: Path, normalized: bytes, digest: str) -> None:
    directory_fd = -1
    try:
        directory_fd, final_name = open_output_directory(path)
        persist_to_directory_fd(directory_fd, final_name, normalized, digest)
    finally:
        if directory_fd >= 0:
            try:
                os.close(directory_fd)
            except OSError:
                pass


def emit_result(category: str, digest: str | None = None) -> None:
    if digest is None:
        message = f"INVALID:{category}\n"
    else:
        message = f"VALID:{digest}\n"
    os.write(1, message.encode("ascii"))


def emit_normalized_to_pipe(fd: int, normalized: bytes, digest: str) -> None:
    try:
        descriptor = os.fstat(fd)
        if not stat.S_ISFIFO(descriptor.st_mode):
            fail("OUTPUT_PERSISTENCE")
        payload = normalized + f"BOUNDED_EVIDENCE_SHA256|{digest}\n".encode("ascii")
        written = 0
        while written < len(payload):
            count = os.write(fd, payload[written:])
            if count <= 0:
                fail("OUTPUT_PERSISTENCE")
            written += count
    except ValidationFailure:
        raise
    except OSError:
        fail("OUTPUT_PERSISTENCE")


def main(argv: Sequence[str]) -> int:
    options = parse_cli(argv)
    normalized, digest = validate_and_normalize(read_stdin())
    if options.expected_sha256 is not None and options.expected_sha256 != digest:
        fail("DIGEST_MISMATCH")
    if options.output is not None:
        persist_exclusive(options.output, normalized, digest)
    if options.normalized_output_fd is not None:
        emit_normalized_to_pipe(options.normalized_output_fd, normalized, digest)
    emit_result("VALID", digest)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except ValidationFailure as failure:
        emit_result(failure.category)
        raise SystemExit(EXIT_CODES.get(failure.category, EXIT_CODES["INTERNAL"]))
    except Exception:
        emit_result("INTERNAL")
        raise SystemExit(EXIT_CODES["INTERNAL"])
