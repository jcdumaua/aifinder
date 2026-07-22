#!/usr/bin/env python3
"""Run the Phase 27NM-27OL public fabricated fixture corpus only."""

from __future__ import annotations

import hashlib
import json
import os
import stat
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any, Final, NoReturn


SCRIPT_DIRECTORY: Final[Path] = Path(__file__).resolve().parent
FIXTURE_PATH: Final[Path] = SCRIPT_DIRECTORY / (
    "discovery-phase-27nm-27ol-bounded-evidence-fixtures.json"
)
VALIDATOR_PATH: Final[Path] = SCRIPT_DIRECTORY / (
    "discovery-phase-27nm-27ol-bounded-evidence-validator-candidate.py"
)
MAX_CORPUS_BYTES: Final[int] = 131_072
EXPECTED_PHASE: Final[str] = (
    "PHASE_27NM_27OL_LIVE_PREFLIGHT_ACTIVATION_READINESS_SYNTHETIC_"
    "ASSURANCE_AND_DOWNSTREAM_DEPENDENCY_CONSOLIDATION"
)
EXPECTED_FIXTURE_SHA256: Final[str] = (
    "99bdbb6fa49c359c84e2591249dc412a96a23ad04cd3c1aeaad3727a3f96ad5d"
)
EXPECTED_FIXTURE_IDS: Final[tuple[str, ...]] = (
    "valid_bounded_result",
    "missing_key",
    "duplicate_key",
    "reordered_key",
    "unexpected_key",
    "malformed_delimiter",
    "empty_value",
    "invalid_utf8",
    "oversized_payload",
    "too_many_lines",
    "negative_integer",
    "integer_overflow_length",
    "invalid_timestamp",
    "invalid_environment_category",
    "invalid_policy_category",
    "invalid_grant_category",
    "negative_assertion_true",
    "secret_like_token",
    "database_url_shape",
    "hostname_project_reference_shape",
    "raw_sqlstate_detail",
    "raw_postgresql_error_text",
    "raw_identifier_owner_role",
    "digest_mismatch",
    "leading_whitespace",
    "duplicate_normalized_digest_field",
    "crlf_line_endings",
    "missing_final_lf",
    "nul_byte",
    "per_value_byte_limit",
    "valid_normalized_pipe",
    "valid_output_persistence",
    "invalid_cli_usage",
)
SANITIZED_ENVIRONMENT: Final[dict[str, str]] = {
    "PATH": "/usr/bin:/bin",
    "HOME": "/nonexistent",
    "TMPDIR": "/private/tmp",
    "LC_ALL": "C",
    "PYTHONDONTWRITEBYTECODE": "1",
}


class RunnerFailure(Exception):
    pass


def fail() -> NoReturn:
    raise RunnerFailure


def load_corpus() -> dict[str, Any]:
    try:
        raw = FIXTURE_PATH.read_bytes()
    except OSError:
        fail()
    if len(raw) > MAX_CORPUS_BYTES:
        fail()
    if hashlib.sha256(raw).hexdigest() != EXPECTED_FIXTURE_SHA256:
        fail()
    try:
        corpus = json.loads(raw.decode("utf-8", "strict"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        fail()
    if not isinstance(corpus, dict) or set(corpus) != {
        "fixture_version",
        "phase",
        "delimiter",
        "valid_lines",
        "fixtures",
    }:
        fail()
    if (
        corpus["fixture_version"] != 1
        or corpus["phase"] != EXPECTED_PHASE
        or corpus["delimiter"] != "|"
    ):
        fail()
    if not isinstance(corpus["valid_lines"], list) or len(corpus["valid_lines"]) != 56:
        fail()
    if not all(isinstance(line, str) for line in corpus["valid_lines"]):
        fail()
    if not isinstance(corpus["fixtures"], list) or len(corpus["fixtures"]) != len(
        EXPECTED_FIXTURE_IDS
    ):
        fail()
    fixture_ids = [
        fixture.get("id") if isinstance(fixture, dict) else None
        for fixture in corpus["fixtures"]
    ]
    if fixture_ids != list(EXPECTED_FIXTURE_IDS):
        fail()
    return corpus


def locate(lines: list[str], key: str) -> int:
    matches = [index for index, line in enumerate(lines) if line.startswith(key + "|")]
    if len(matches) != 1:
        fail()
    return matches[0]


def set_value(lines: list[str], key: str, value: str) -> None:
    lines[locate(lines, key)] = f"{key}|{value}"


def build_payload(valid_lines: list[str], fixture: dict[str, Any]) -> bytes:
    lines = list(valid_lines)
    operation = fixture.get("operation")
    if operation == "identity":
        pass
    elif operation == "remove_key":
        lines.pop(locate(lines, fixture["key"]))
    elif operation == "duplicate_key":
        source = lines[locate(lines, fixture["source_key"])]
        lines[locate(lines, fixture["target_key"])] = source
    elif operation == "swap_keys":
        first = locate(lines, fixture["first_key"])
        second = locate(lines, fixture["second_key"])
        lines[first], lines[second] = lines[second], lines[first]
    elif operation == "replace_key":
        index = locate(lines, fixture["key"])
        _, value = lines[index].split("|", 1)
        lines[index] = f"{fixture['replacement_key']}|{value}"
    elif operation == "replace_delimiter":
        index = locate(lines, fixture["key"])
        lines[index] = lines[index].replace("|", fixture["delimiter"], 1)
    elif operation == "replace_value":
        set_value(lines, fixture["key"], fixture["value"])
    elif operation == "replace_repeated_value":
        value = fixture["character"] * fixture["count"]
        set_value(lines, fixture["key"], value)
    elif operation == "append_lines":
        lines.extend(fixture["lines"])
    elif operation == "insert_invalid_utf8":
        payload = ("\n".join(lines) + "\n").encode("ascii")
        marker = (fixture["key"] + "|").encode("ascii")
        return payload.replace(marker, marker + b"\xff", 1)
    elif operation == "crlf":
        return ("\r\n".join(lines) + "\r\n").encode("ascii")
    elif operation == "missing_final_lf":
        return "\n".join(lines).encode("ascii")
    elif operation == "insert_nul":
        payload = ("\n".join(lines) + "\n").encode("ascii")
        marker = (fixture["key"] + "|").encode("ascii")
        return payload.replace(marker, marker + b"\x00", 1)
    else:
        fail()
    return ("\n".join(lines) + "\n").encode("ascii")


def run_fixture(valid_lines: list[str], fixture: dict[str, Any]) -> bool:
    required = {"id", "operation", "expected_category", "expected_exit"}
    if not isinstance(fixture, dict) or not required.issubset(fixture):
        fail()
    fixture_id = fixture["id"]
    expected_category = fixture["expected_category"]
    expected_exit = fixture["expected_exit"]
    if not isinstance(fixture_id, str) or not fixture_id.isascii():
        fail()
    if not isinstance(expected_category, str) or not isinstance(expected_exit, int):
        fail()

    payload = build_payload(valid_lines, fixture)
    digest = hashlib.sha256(payload).hexdigest()
    command = [sys.executable, "-B", str(VALIDATOR_PATH)]
    expected_sha256 = fixture.get("expected_sha256")
    if expected_sha256 is not None:
        command.extend(["--expected-sha256", expected_sha256])
    validator_args = fixture.get("validator_args", [])
    if not isinstance(validator_args, list) or not all(
        isinstance(value, str) for value in validator_args
    ):
        fail()
    command.extend(validator_args)
    mode = fixture.get("validator_mode", "default")
    if mode not in {"default", "normalized_pipe", "output_persistence"}:
        fail()

    normalized_result: bytes | None = None
    persisted_ok = True
    try:
        if mode == "normalized_pipe":
            read_fd, write_fd = os.pipe()
            try:
                completed = subprocess.run(
                    [*command, "--normalized-output-fd", str(write_fd)],
                    input=payload,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=SANITIZED_ENVIRONMENT,
                    cwd="/private/tmp",
                    check=False,
                    timeout=5,
                    pass_fds=(write_fd,),
                )
            finally:
                os.close(write_fd)
            try:
                normalized_result = os.read(read_fd, 20_000)
            finally:
                os.close(read_fd)
        elif mode == "output_persistence":
            with tempfile.TemporaryDirectory(
                prefix="aifinder-phase-27nm-27ol-synthetic-", dir="/private/tmp"
            ) as temporary_directory:
                os.chmod(temporary_directory, 0o700)
                output_path = Path(temporary_directory) / (
                    "aifinder-phase-27nm-27ol-bounded-evidence-"
                    "20260721T000000Z.txt"
                )
                completed = subprocess.run(
                    [*command, "--output", str(output_path)],
                    input=payload,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=SANITIZED_ENVIRONMENT,
                    cwd="/private/tmp",
                    check=False,
                    timeout=5,
                )
                expected_persisted = payload + (
                    f"BOUNDED_EVIDENCE_SHA256|{digest}\n".encode("ascii")
                )
                state = output_path.lstat() if output_path.exists() else None
                persisted_ok = (
                    state is not None
                    and stat.S_ISREG(state.st_mode)
                    and not stat.S_ISLNK(state.st_mode)
                    and stat.S_IMODE(state.st_mode) == 0o600
                    and output_path.read_bytes() == expected_persisted
                    and len(list(Path(temporary_directory).iterdir())) == 1
                )
        else:
            completed = subprocess.run(
                command,
                input=payload,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=SANITIZED_ENVIRONMENT,
                cwd="/private/tmp",
                check=False,
                timeout=5,
            )
    except (OSError, subprocess.SubprocessError):
        return False
    if completed.stderr:
        return False
    if expected_category == "VALID":
        output_ok = completed.stdout == f"VALID:{digest}\n".encode("ascii")
        if mode == "normalized_pipe":
            output_ok = output_ok and normalized_result == payload + (
                f"BOUNDED_EVIDENCE_SHA256|{digest}\n".encode("ascii")
            )
        if mode == "output_persistence":
            output_ok = output_ok and persisted_ok
    else:
        output_ok = completed.stdout == (
            f"INVALID:{expected_category}\n".encode("ascii")
        )
    return completed.returncode == expected_exit and output_ok


def main() -> int:
    corpus = load_corpus()
    seen: set[str] = set()
    all_passed = True
    for fixture in corpus["fixtures"]:
        fixture_id = fixture.get("id") if isinstance(fixture, dict) else None
        if not isinstance(fixture_id, str) or fixture_id in seen:
            fail()
        seen.add(fixture_id)
        passed = run_fixture(corpus["valid_lines"], fixture)
        print(f"{fixture_id} {'PASS' if passed else 'FAIL'}")
        all_passed = all_passed and passed
    return 0 if all_passed else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception:
        print("runner_internal FAIL")
        raise SystemExit(70)
