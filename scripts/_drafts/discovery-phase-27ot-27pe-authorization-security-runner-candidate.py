#!/usr/bin/env python3
"""Run the fabricated Option A authorization/replay/protected-claim repair corpus.

This runner uses a deterministic public adapter, an in-memory replay model, and a
bounded temporary-descriptor Bash harness. It provides no production cryptographic,
network, replay-service, operating-system, connection-profile, or launch assurance.
"""

from __future__ import annotations

import base64
import concurrent.futures
import copy
import fcntl
import hashlib
import hmac
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
from pathlib import Path
from types import ModuleType
from typing import Any, Final, Optional, Sequence

THIS_DIR: Final[Path] = Path(__file__).resolve().parent
FIXTURES_PATH: Final[Path] = THIS_DIR / "discovery-phase-27ot-27pe-authorization-security-fixtures.json"
VERIFIER_PATH: Final[Path] = THIS_DIR / "discovery-phase-27ot-27pe-signed-authorization-verifier-candidate.py"
REPLAY_PATH: Final[Path] = THIS_DIR / "discovery-phase-27ot-27pe-replay-authority-client-candidate.py"
ASSERTION_SCHEMA_PATH: Final[Path] = THIS_DIR / "discovery-phase-27ot-27pe-signed-authorization-assertion-schema.json"
LAUNCH_SCHEMA_PATH: Final[Path] = THIS_DIR / "discovery-phase-27ot-27pe-protected-launch-request-schema.json"
CLIENT_PATH: Final[Path] = THIS_DIR / "discovery-phase-27ot-27pe-authenticated-activation-client-candidate.sh"
REPOSITORY_ROOT: Final[Path] = THIS_DIR.parent.parent
ARCHITECTURE_GATE_PATH: Final[Path] = REPOSITORY_ROOT / "docs/discovery-phase-27ot-27pe-authorization-trust-architecture-and-static-assurance-gate.md"
RECOVERY_CONTRACT_PATH: Final[Path] = REPOSITORY_ROOT / "docs/discovery-phase-27nm-27ol-live-preflight-failure-and-recovery-contract.md"
MIGRATION_GATE_PATH: Final[Path] = REPOSITORY_ROOT / "docs/discovery-phase-27nm-27ol-migration-history-placement-grant-and-typegen-dependency-gate.md"
PUBLIC_ADAPTER_LABEL: Final[bytes] = b"AIFINDER_STATIC_DETERMINISTIC_ADAPTER_V1_PUBLIC_NON_SECRET"
CLIENT_FAILURE_LINE: Final[bytes] = b"PROTECTED_LAUNCH_REQUEST_FAILED\n"
CLIENT_PHASE: Final[str] = "PHASE_27NM_27OL_LIVE_PREFLIGHT_ACTIVATION_READINESS_SYNTHETIC_ASSURANCE_AND_DOWNSTREAM_DEPENDENCY_CONSOLIDATION"
BASELINE: Final[str] = "f7e7bd743a999f691bd30c593617aa191522fec6"
EXPECTED_CASES: Final[tuple[tuple[str, str, str], ...]] = (
    ("valid_exact_assertion", "VALID_ASSERTION", "PASS_STATIC_MODEL"),
    ("invalid_signature", "INVALID_SIGNATURE", "AUTH_SIGNATURE_FAILED"),
    ("unknown_key_id", "UNKNOWN_KEY_ID", "AUTH_SIGNATURE_FAILED"),
    ("revoked_key", "REVOKED_KEY", "AUTH_SIGNATURE_FAILED"),
    ("expired_assertion", "EXPIRED_ASSERTION", "AUTH_EXPIRED"),
    ("future_dated_assertion", "FUTURE_ASSERTION", "AUTH_EXPIRED"),
    ("nonce_replay", "NONCE_REPLAY", "AUTH_REPLAY_FAILED"),
    ("concurrent_consume_race", "CONCURRENT_CONSUME_RACE", "PASS_STATIC_MODEL"),
    ("replay_authority_unavailable", "AUTHORITY_UNAVAILABLE", "AUTHORITY_UNAVAILABLE"),
    ("ambiguous_consume_response", "AUTHORITY_AMBIGUOUS", "AUTHORITY_AMBIGUOUS"),
    ("wrong_baseline", "WRONG_BASELINE", "BINDING_FAILED"),
    ("wrong_activation_client_hash", "WRONG_ACTIVATION_CLIENT", "BINDING_FAILED"),
    ("wrong_sql_hash", "WRONG_SQL", "BINDING_FAILED"),
    ("wrong_activation_manifest_hash", "WRONG_ACTIVATION_MANIFEST", "BINDING_FAILED"),
    ("wrong_validator_hash", "WRONG_VALIDATOR", "BINDING_FAILED"),
    ("wrong_environment", "WRONG_ENVIRONMENT", "BINDING_FAILED"),
    ("mutation_flag_true", "MUTATION_TRUE", "AUTH_SCHEMA_FAILED"),
    ("migration_flag_true", "MIGRATION_TRUE", "AUTH_SCHEMA_FAILED"),
    ("type_generation_flag_true", "TYPEGEN_TRUE", "AUTH_SCHEMA_FAILED"),
    ("malformed_canonical_encoding", "NONCANONICAL", "AUTH_SCHEMA_FAILED"),
    ("duplicate_fields", "DUPLICATE_FIELDS", "AUTH_SCHEMA_FAILED"),
    ("extra_fields", "EXTRA_FIELDS", "AUTH_SCHEMA_FAILED"),
    ("algorithm_key_signature_substitution", "KEY_SUBSTITUTION", "AUTH_SIGNATURE_FAILED"),
    ("copied_consumed_receipt", "COPIED_RECEIPT", "AUTH_REPLAY_FAILED"),
    ("restored_local_unused_record", "RESTORED_LOCAL_UNUSED", "AUTH_REPLAY_FAILED"),
    ("output_directory_substitution", "WRONG_OUTPUT_DIRECTORY", "BINDING_FAILED"),
    ("artifact_post_open_mutation", "POST_OPEN_MUTATION", "BINDING_FAILED"),
    ("connection_profile_substitution", "WRONG_CONNECTION_PROFILE", "BINDING_FAILED"),
    ("crash_after_consume", "CRASH_AFTER_CONSUME", "PROTECTED_LAUNCH_FAILED"),
    ("crash_after_evidence_publication", "CRASH_AFTER_PUBLICATION", "OUTPUT_FAILED"),
    ("same_request_id_receipt_recovery", "SAME_REQUEST_RECOVERY", "PASS_STATIC_MODEL"),
    ("different_request_id_replay_rejection", "DIFFERENT_REQUEST_REPLAY", "AUTH_REPLAY_FAILED"),
    ("protected_launch_second_claim_rejection", "SECOND_JOURNAL_CLAIM", "AUTH_REPLAY_FAILED"),
    ("phase_newline_control", "PHASE_NEWLINE_CONTROL", "AUTH_SCHEMA_FAILED"),
    ("phase_tab_control", "PHASE_TAB_CONTROL", "AUTH_SCHEMA_FAILED"),
    ("phase_c0_control", "PHASE_C0_CONTROL", "AUTH_SCHEMA_FAILED"),
    ("phase_del_control", "PHASE_DEL_CONTROL", "AUTH_SCHEMA_FAILED"),
    ("valid_consume_launch_request_with_psql_fd", "VALID_CONSUME_LAUNCH_REQUEST", "PASS_STATIC_MODEL"),
    ("valid_recover_launch_request_without_receipt", "VALID_RECOVER_LAUNCH_REQUEST", "PASS_STATIC_MODEL"),
    ("leading_zero_descriptor_rejected", "LEADING_ZERO_DESCRIPTOR", "PROTECTED_LAUNCH_FAILED"),
    ("normalized_duplicate_descriptor_rejected", "NORMALIZED_DUPLICATE_DESCRIPTOR", "PROTECTED_LAUNCH_FAILED"),
    ("missing_psql_descriptor_rejected", "MISSING_PSQL_DESCRIPTOR", "PROTECTED_LAUNCH_FAILED"),
    ("caller_receipt_arguments_rejected", "CALLER_RECEIPT_ARGUMENTS", "AUTH_SCHEMA_FAILED"),
    ("assertion_boolean_version_rejected", "ASSERTION_BOOLEAN_VERSION", "AUTH_SCHEMA_FAILED"),
    ("assertion_expiry_not_after_issue_rejected", "ASSERTION_INVALID_LIFETIME_ORDER", "AUTH_SCHEMA_FAILED"),
    ("assertion_lifetime_over_300_seconds_rejected", "ASSERTION_LIFETIME_TOO_LONG", "AUTH_SCHEMA_FAILED"),
    ("receipt_boolean_version_rejected", "RECEIPT_BOOLEAN_VERSION", "AUTH_SCHEMA_FAILED"),
    ("replay_request_boolean_version_rejected", "REPLAY_REQUEST_BOOLEAN_VERSION", "AUTH_SCHEMA_FAILED"),
    ("replay_response_boolean_version_rejected", "REPLAY_RESPONSE_BOOLEAN_VERSION", "AUTH_SCHEMA_FAILED"),
    ("invalid_receipt_signature", "INVALID_RECEIPT_SIGNATURE", "AUTH_SIGNATURE_FAILED"),
    ("receipt_role_substitution", "RECEIPT_ROLE_SUBSTITUTION", "AUTH_SIGNATURE_FAILED"),
    ("receipt_assertion_binding_mismatch", "RECEIPT_ASSERTION_BINDING_MISMATCH", "AUTH_REPLAY_FAILED"),
    ("receipt_nonce_binding_mismatch", "RECEIPT_NONCE_BINDING_MISMATCH", "AUTH_REPLAY_FAILED"),
    ("receipt_request_id_mismatch", "RECEIPT_REQUEST_ID_MISMATCH", "AUTH_REPLAY_FAILED"),
    ("receipt_expiry_binding_mismatch", "RECEIPT_EXPIRY_BINDING_MISMATCH", "AUTH_REPLAY_FAILED"),
    ("receipt_terminal_state_invalid", "RECEIPT_TERMINAL_STATE_INVALID", "AUTH_SCHEMA_FAILED"),
    ("receipt_result_category_invalid", "RECEIPT_RESULT_CATEGORY_INVALID", "AUTH_SCHEMA_FAILED"),
    ("receipt_consumed_after_expiry", "RECEIPT_CONSUMED_AFTER_EXPIRY", "AUTH_SCHEMA_FAILED"),
    ("deployment_flag_true", "DEPLOYMENT_TRUE", "AUTH_SCHEMA_FAILED"),
    ("publishing_flag_true", "PUBLISHING_TRUE", "AUTH_SCHEMA_FAILED"),
    ("operational_reactivation_flag_true", "REACTIVATION_TRUE", "AUTH_SCHEMA_FAILED"),
    ("wrong_execution_scope_rejected", "WRONG_EXECUTION_SCOPE", "AUTH_SCHEMA_FAILED"),
    ("read_only_false_rejected", "READ_ONLY_FALSE", "AUTH_SCHEMA_FAILED"),
    ("exactly_one_run_false_rejected", "EXACTLY_ONE_RUN_FALSE", "AUTH_SCHEMA_FAILED"),
    ("noncanonical_consume_request_id_rejected", "NONCANONICAL_REQUEST_ID", "AUTH_SCHEMA_FAILED"),
    ("noncanonical_consume_request_internal_error_not_masked", "NONCANONICAL_REQUEST_ID_INTERNAL", "INTERNAL_FAILED"),
    ("recovery_binding_substitution_rejected", "RECOVERY_BINDING_SUBSTITUTION", "PROTECTED_LAUNCH_FAILED"),
    ("assertion_schema_phase_controls_rejected", "ASSERTION_SCHEMA_PHASE_CONTROLS", "PASS_STATIC_MODEL"),
    ("launch_schema_phase_controls_rejected", "LAUNCH_SCHEMA_PHASE_CONTROLS", "PASS_STATIC_MODEL"),
    ("schema_terminal_controls_rejected", "SCHEMA_TERMINAL_CONTROLS", "PASS_STATIC_MODEL"),
    ("exact_schema_contracts", "EXACT_SCHEMA_CONTRACTS", "PASS_STATIC_MODEL"),
    ("protected_output_contract_complete", "PROTECTED_OUTPUT_CONTRACT", "PASS_STATIC_MODEL"),
    ("migration_gate_predecessor_rebound", "MIGRATION_GATE_REBOUND", "PASS_STATIC_MODEL"),
)


class CorpusFailure(Exception):
    pass


def load_module(name: str, path: Path) -> ModuleType:
    if not path.is_file() or path.is_symlink():
        raise CorpusFailure
    spec = importlib.util.spec_from_file_location(name, str(path))
    if spec is None or spec.loader is None:
        raise CorpusFailure
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def request_id(byte_value: int) -> str:
    return b64url(bytes([byte_value]) * 32)


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("ascii")


def strict_json(raw: bytes) -> object:
    duplicate = False

    def hook(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        nonlocal duplicate
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)):
            duplicate = True
        return dict(pairs)

    value = json.loads(raw.decode("ascii", "strict"), object_pairs_hook=hook)
    if duplicate:
        raise CorpusFailure
    return value


class DeterministicProtectedVerifier:
    """Public deterministic adapter for protocol tests; not cryptography."""

    def __init__(self) -> None:
        self.known = {
            ("ASSERTION_ISSUER", "aifinder-static-issuer", "assertion-key-v1"),
            ("ASSERTION_ISSUER", "aifinder-static-issuer", "assertion-key-revoked"),
            ("REPLAY_RECEIPT_ISSUER", "aifinder-static-replay", "receipt-key-v1"),
        }
        self.revoked = {
            ("ASSERTION_ISSUER", "aifinder-static-issuer", "assertion-key-revoked")
        }

    def sign(
        self,
        role: str,
        issuer: str,
        key_id: str,
        algorithm: str,
        message: bytes,
    ) -> bytes:
        prefix = b"\n".join(
            (
                PUBLIC_ADAPTER_LABEL,
                role.encode("ascii"),
                issuer.encode("ascii"),
                key_id.encode("ascii"),
                algorithm.encode("ascii"),
            )
        )
        return hashlib.sha512(prefix + b"\n" + message).digest()

    def verify(
        self,
        role: str,
        issuer: str,
        key_id: str,
        algorithm: str,
        message: bytes,
        signature: bytes,
    ) -> bool:
        identity = (role, issuer, key_id)
        if identity not in self.known or identity in self.revoked or algorithm != "Ed25519":
            return False
        return hmac.compare_digest(
            signature, self.sign(role, issuer, key_id, algorithm, message)
        )


class InMemoryReplayTransport:
    """Fabricated atomic terminal-state model; no network or durability claim."""

    def __init__(
        self,
        verifier: ModuleType,
        adapter: DeterministicProtectedVerifier,
        *,
        assertion_issued_at_epoch: int,
        assertion_expiry_epoch: int,
        service_epoch: int,
        consumed_at_epoch: int,
        mode: str = "NORMAL",
    ) -> None:
        self.verifier = verifier
        self.adapter = adapter
        self.assertion_issued_at_epoch = assertion_issued_at_epoch
        self.assertion_expiry_epoch = assertion_expiry_epoch
        self.service_epoch = service_epoch
        self.consumed_at_epoch = consumed_at_epoch
        self.mode = mode
        self.records: dict[str, tuple[str, str, Optional[dict[str, object]]]] = {}
        self._lock = threading.Lock()
        self._concurrency_probe_lock = threading.Lock()
        self._concurrency_barrier: Optional[threading.Barrier] = None
        self.concurrency_rendezvous_count = 0
        self._concurrency_active_callers = 0
        self.concurrency_peak_callers = 0
        self.concurrency_probe_failed = False

    def enable_concurrency_probe(self, parties: int) -> None:
        if parties < 2 or self._concurrency_barrier is not None or self.records:
            raise CorpusFailure
        self._concurrency_barrier = threading.Barrier(parties)

    def _response(
        self,
        status: str,
        request_id_value: str,
        receipt: Optional[dict[str, object]] = None,
    ) -> bytes:
        response: dict[str, object] = {
            "consume_request_id": request_id_value,
            "status": status,
            "type": "AIFINDER_LIVE_PREFLIGHT_CONSUME_RESPONSE",
            "version": 1,
        }
        if receipt is not None:
            response["receipt"] = receipt
        return canonical(response)

    def _receipt(self, request: dict[str, object]) -> dict[str, object]:
        protected: dict[str, object] = {
            "algorithm": "Ed25519",
            "issuer": "aifinder-static-replay",
            "key_id": "receipt-key-v1",
            "type": "AIFINDER_LIVE_PREFLIGHT_CONSUME_RECEIPT",
            "version": 1,
        }
        payload: dict[str, object] = {
            "assertion_expiry_epoch": self.assertion_expiry_epoch,
            "assertion_sha256": request["assertion_sha256"],
            "consume_request_id": request["consume_request_id"],
            "consumed_at_epoch": self.consumed_at_epoch,
            "nonce_sha256": request["nonce_sha256"],
            "result_category": "AUTHORIZED_CONSUMED",
            "terminal_state": "CONSUMED",
        }
        signature = self.adapter.sign(
            "REPLAY_RECEIPT_ISSUER",
            "aifinder-static-replay",
            "receipt-key-v1",
            "Ed25519",
            self.verifier.receipt_signature_input(protected, payload),
        )
        return {"payload": payload, "protected": protected, "signature": b64url(signature)}

    def _stored_response(
        self,
        request_id_value: str,
        status: str,
        receipt: Optional[dict[str, object]],
    ) -> bytes:
        if status == "CONSUMED" and receipt is not None:
            return self._response(status, request_id_value, receipt)
        if status == "EXPIRED" and receipt is None:
            return self._response(status, request_id_value)
        raise CorpusFailure

    def exchange(
        self, request_raw: bytes, timeout_ms: int, maximum_response_bytes: int
    ) -> bytes:
        barrier = self._concurrency_barrier
        if barrier is None:
            with self._lock:
                return self._exchange_locked(request_raw, timeout_ms, maximum_response_bytes)
        with self._concurrency_probe_lock:
            self.concurrency_rendezvous_count += 1
            self._concurrency_active_callers += 1
            self.concurrency_peak_callers = max(
                self.concurrency_peak_callers, self._concurrency_active_callers
            )
        try:
            barrier.wait(timeout=5)
            with self._lock:
                return self._exchange_locked(request_raw, timeout_ms, maximum_response_bytes)
        except threading.BrokenBarrierError as failure:
            self.concurrency_probe_failed = True
            raise CorpusFailure from failure
        finally:
            with self._concurrency_probe_lock:
                self._concurrency_active_callers -= 1

    def _exchange_locked(
        self, request_raw: bytes, timeout_ms: int, maximum_response_bytes: int
    ) -> bytes:
        if timeout_ms != 5000 or maximum_response_bytes != 16384:
            raise OSError
        if self.mode == "UNAVAILABLE":
            raise OSError
        request = strict_json(request_raw)
        if not isinstance(request, dict):
            raise CorpusFailure
        nonce_hash = str(request["nonce_sha256"])
        request_id_value = str(request["consume_request_id"])
        existing = self.records.get(nonce_hash)

        if request["operation"] == "RECOVER_SAME_REQUEST":
            if existing is None:
                return self._response("AMBIGUOUS", request_id_value)
            stored_request_id, status, receipt = existing
            if stored_request_id != request_id_value:
                return self._response("REPLAY_REJECTED", request_id_value)
            return self._stored_response(request_id_value, status, receipt)

        if existing is not None:
            stored_request_id, status, receipt = existing
            if stored_request_id == request_id_value:
                return self._stored_response(request_id_value, status, receipt)
            return self._response("REPLAY_REJECTED", request_id_value)

        if self.mode == "AMBIGUOUS_BEFORE_COMMIT":
            raise TimeoutError

        if (
            self.service_epoch < self.assertion_issued_at_epoch
            or self.service_epoch > self.assertion_expiry_epoch
        ):
            self.records[nonce_hash] = (request_id_value, "EXPIRED", None)
            return self._response("EXPIRED", request_id_value)

        receipt = self._receipt(request)
        self.records[nonce_hash] = (request_id_value, "CONSUMED", receipt)
        if self.mode == "AMBIGUOUS_AFTER_COMMIT":
            self.mode = "NORMAL"
            raise TimeoutError
        return self._response("CONSUMED", request_id_value, receipt)


class ProtectedJournalModel:
    def __init__(self) -> None:
        self.claimed: set[str] = set()

    def claim(self, receipt_raw: bytes) -> bool:
        identity = hashlib.sha256(receipt_raw).hexdigest()
        if identity in self.claimed:
            return False
        self.claimed.add(identity)
        return True


class ProtectedEvidencePublicationModel:
    """Fabricated descriptor-relative normalized-evidence publication state."""

    REQUIRED_EVENTS: Final[tuple[str, ...]] = (
        "VALIDATOR_PIPE_VERIFIED",
        "TEMPORARY_FILE_MODE_0600_WRITTEN",
        "FILE_FSYNCED",
        "ATOMIC_NO_REPLACE_PUBLICATION",
        "DIRECTORY_FSYNCED",
    )

    def __init__(self) -> None:
        self.published: dict[str, bytes] = {}
        self.events: list[str] = []

    def publish_once(self, name: str, normalized: bytes, digest: str) -> bool:
        if (
            name in self.published
            or not name.isascii()
            or not normalized.endswith(b"\n")
            or hashlib.sha256(normalized).hexdigest() != digest
        ):
            return False
        payload = normalized + f"BOUNDED_EVIDENCE_SHA256|{digest}\n".encode("ascii")
        self.events.extend(self.REQUIRED_EVENTS)
        self.published[name] = payload
        return True

    def durable_exact(self, name: str, normalized: bytes, digest: str) -> bool:
        expected = normalized + f"BOUNDED_EVIDENCE_SHA256|{digest}\n".encode("ascii")
        return self.events == list(self.REQUIRED_EVENTS) and self.published.get(name) == expected


class ProtectedRecoveryEligibilityModel:
    """Fabricated protected pending-request state; not an OS implementation."""

    def __init__(self) -> None:
        self.states: dict[str, tuple[str, str, str, str]] = {}

    def start(
        self,
        request_id_value: str,
        assertion_sha256: str,
        nonce_sha256: str,
        binding_sha256: str,
    ) -> None:
        if request_id_value in self.states:
            raise CorpusFailure
        self.states[request_id_value] = (
            "PENDING",
            assertion_sha256,
            nonce_sha256,
            binding_sha256,
        )

    def _matches(
        self,
        request_id_value: str,
        assertion_sha256: str,
        nonce_sha256: str,
        binding_sha256: str,
        states: frozenset[str],
    ) -> bool:
        record = self.states.get(request_id_value)
        return (
            record is not None
            and record[0] in states
            and record[1:] == (assertion_sha256, nonce_sha256, binding_sha256)
        )

    def mark_ambiguous(
        self,
        request_id_value: str,
        assertion_sha256: str,
        nonce_sha256: str,
        binding_sha256: str,
    ) -> None:
        if not self._matches(
            request_id_value,
            assertion_sha256,
            nonce_sha256,
            binding_sha256,
            frozenset({"PENDING"}),
        ):
            raise CorpusFailure
        self.states[request_id_value] = (
            "AMBIGUOUS",
            assertion_sha256,
            nonce_sha256,
            binding_sha256,
        )

    def mark_definitive(
        self,
        request_id_value: str,
        assertion_sha256: str,
        nonce_sha256: str,
        binding_sha256: str,
    ) -> None:
        if not self._matches(
            request_id_value,
            assertion_sha256,
            nonce_sha256,
            binding_sha256,
            frozenset({"PENDING", "AMBIGUOUS"}),
        ):
            raise CorpusFailure
        self.states[request_id_value] = (
            "DEFINITIVE",
            assertion_sha256,
            nonce_sha256,
            binding_sha256,
        )

    def can_recover(
        self,
        request_id_value: str,
        assertion_sha256: str,
        nonce_sha256: str,
        binding_sha256: str,
    ) -> bool:
        return self._matches(
            request_id_value,
            assertion_sha256,
            nonce_sha256,
            binding_sha256,
            frozenset({"AMBIGUOUS"}),
        )


def load_fixtures() -> dict[str, object]:
    value = strict_json(FIXTURES_PATH.read_bytes())
    if not isinstance(value, dict):
        raise CorpusFailure
    cases = value.get("cases")
    if not isinstance(cases, list) or len(cases) != len(EXPECTED_CASES):
        raise CorpusFailure
    observed = tuple((item.get("id"), item.get("kind"), item.get("expected")) for item in cases)
    if observed != EXPECTED_CASES:
        raise CorpusFailure
    if value.get("fixture_version") != 3 or value.get("phase") != "PHASE_27RO_27RZ_OPTION_A_STATIC_REPAIR_FULL_LOAD_CORRECTION":
        raise CorpusFailure
    if value.get("deterministic_adapter_label") != PUBLIC_ADAPTER_LABEL.decode("ascii"):
        raise CorpusFailure
    if value.get("private_key_present") is not False or value.get("network_required") is not False:
        raise CorpusFailure
    if value.get("service_material_present") is not False:
        raise CorpusFailure
    return value


def sign_assertion(
    verifier: ModuleType,
    adapter: DeterministicProtectedVerifier,
    envelope: dict[str, object],
) -> bytes:
    protected = envelope["protected"]
    payload = envelope["payload"]
    if not isinstance(protected, dict) or not isinstance(payload, dict):
        raise CorpusFailure
    signature = adapter.sign(
        "ASSERTION_ISSUER",
        str(protected["issuer"]),
        str(protected["key_id"]),
        str(protected["algorithm"]),
        verifier.assertion_signature_input(protected, payload),
    )
    envelope["signature"] = b64url(signature)
    return verifier.canonical_json_bytes(envelope)


def expected_bindings(fixtures: dict[str, object], verifier: ModuleType) -> dict[str, object]:
    assertion = fixtures["base_assertion"]
    if not isinstance(assertion, dict) or not isinstance(assertion.get("payload"), dict):
        raise CorpusFailure
    payload = assertion["payload"]
    result: dict[str, object] = {
        "activation_client_sha256": payload["activation_client_sha256"],
        "activation_manifest_sha256": payload["activation_manifest_sha256"],
        "connection_profile_identity_sha256": payload["connection_profile_identity_sha256"],
        "environment_classification": payload["environment_classification"],
        "output_contract_sha256": payload["output_contract_sha256"],
        "output_directory_identity_sha256": payload["output_directory_identity_sha256"],
        "phase": payload["phase"],
        "psql_sha256": payload["psql_sha256"],
        "repository_baseline": payload["repository_baseline"],
        "sql_sha256": payload["sql_sha256"],
        "validator_sha256": payload["validator_sha256"],
    }
    expected_keys = set(getattr(verifier, "EXPECTED_ASSERTION_BINDING_KEYS"))
    if "authoritative_epoch" in expected_keys:
        result["authoritative_epoch"] = fixtures["service_epoch"]
    if set(result) != expected_keys:
        raise CorpusFailure
    return result


def base_verification(
    fixtures: dict[str, object], verifier: ModuleType, adapter: DeterministicProtectedVerifier
) -> tuple[bytes, object]:
    envelope = copy.deepcopy(fixtures["base_assertion"])
    raw = sign_assertion(verifier, adapter, envelope)
    result = verifier.verify_assertion(raw, expected_bindings(fixtures, verifier), adapter)
    if result.category != "PASS_STATIC_MODEL":
        raise CorpusFailure
    return raw, result


def receipt_expected(verification: object, request_id_value: str) -> dict[str, object]:
    payload = getattr(verification, "payload")
    if not isinstance(payload, dict):
        raise CorpusFailure
    return {
        "assertion_expiry_epoch": payload["expiry_epoch"],
        "assertion_sha256": getattr(verification, "assertion_sha256"),
        "consume_request_id": request_id_value,
        "nonce_sha256": getattr(verification, "nonce_sha256"),
    }


def make_transport(
    fixtures: dict[str, object],
    verifier: ModuleType,
    adapter: DeterministicProtectedVerifier,
    *,
    mode: str = "NORMAL",
    service_epoch: Optional[int] = None,
) -> InMemoryReplayTransport:
    payload = fixtures["base_assertion"]["payload"]
    return InMemoryReplayTransport(
        verifier,
        adapter,
        assertion_issued_at_epoch=int(payload["issued_at_epoch"]),
        assertion_expiry_epoch=int(payload["expiry_epoch"]),
        service_epoch=int(fixtures["service_epoch"] if service_epoch is None else service_epoch),
        consumed_at_epoch=int(fixtures["service_epoch"]),
        mode=mode,
    )


def consume_once(
    fixtures: dict[str, object],
    verifier: ModuleType,
    replay: ModuleType,
    adapter: DeterministicProtectedVerifier,
    transport: InMemoryReplayTransport,
    request_id_value: Optional[str] = None,
) -> tuple[object, object, bytes]:
    raw, verification = base_verification(fixtures, verifier, adapter)
    del raw
    request_id_value = request_id_value or str(fixtures["consume_request_id"])
    request = replay.build_consume_request(
        getattr(verification, "assertion_sha256"),
        getattr(verification, "nonce_sha256"),
        getattr(verification, "binding_sha256"),
        request_id_value,
    )
    result = replay.consume(request, transport)
    return verification, result, request


def valid_receipt(
    fixtures: dict[str, object],
    verifier: ModuleType,
    replay: ModuleType,
    adapter: DeterministicProtectedVerifier,
) -> tuple[object, bytes]:
    transport = make_transport(fixtures, verifier, adapter)
    verification, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
    receipt = getattr(result, "receipt")
    if getattr(result, "category") != "PASS_STATIC_MODEL" or not isinstance(receipt, bytes):
        raise CorpusFailure
    return verification, receipt


def protected_binding_values(verification: object) -> tuple[str, str, str]:
    return (
        str(getattr(verification, "assertion_sha256")),
        str(getattr(verification, "nonce_sha256")),
        str(getattr(verification, "binding_sha256")),
    )


def allocate_fd(fd: int, minimum: int) -> int:
    duplicated = int(fcntl.fcntl(fd, fcntl.F_DUPFD, minimum))
    os.close(fd)
    if duplicated < minimum or duplicated > 1023:
        raise CorpusFailure
    return duplicated


def read_pipe_bounded(fd: int, maximum: int = 8192) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = os.read(fd, min(4096, maximum + 1 - total))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
        if total > maximum:
            raise CorpusFailure
    return b"".join(chunks)


def launch_expected_values(
    fixtures: dict[str, object], operation: str, fds: dict[str, int]
) -> dict[str, object]:
    payload = fixtures["base_assertion"]["payload"]
    return {
        "activation_client_sha256": payload["activation_client_sha256"],
        "activation_manifest_fd": fds["activation_manifest"],
        "activation_manifest_sha256": payload["activation_manifest_sha256"],
        "assertion_fd": fds["assertion"],
        "assertion_sha256": hashlib.sha256(b"fabricated-assertion").hexdigest(),
        "connection_profile_identity_sha256": payload["connection_profile_identity_sha256"],
        "consume_request_id": fixtures["consume_request_id"],
        "environment_classification": payload["environment_classification"],
        "operation": operation,
        "output_contract_sha256": payload["output_contract_sha256"],
        "output_directory_fd": fds["output_directory"],
        "output_directory_identity_sha256": payload["output_directory_identity_sha256"],
        "phase": CLIENT_PHASE,
        "psql_fd": fds["psql"],
        "psql_sha256": payload["psql_sha256"],
        "repository_baseline": BASELINE,
        "sql_fd": fds["sql"],
        "sql_sha256": payload["sql_sha256"],
        "type": "AIFINDER_PROTECTED_LAUNCH_REQUEST",
        "validator_fd": fds["validator"],
        "validator_sha256": payload["validator_sha256"],
        "version": 1,
    }


def validate_launch_schema(operation: str, expected: dict[str, object]) -> None:
    schema = strict_json(LAUNCH_SCHEMA_PATH.read_bytes())
    if not isinstance(schema, dict) or not isinstance(schema.get("oneOf"), list):
        raise CorpusFailure
    selected = []
    for branch in schema["oneOf"]:
        if isinstance(branch, dict) and branch.get("properties", {}).get("operation", {}).get("const") == operation:
            selected.append(branch)
    if len(selected) != 1:
        raise CorpusFailure
    branch = selected[0]
    if branch.get("additionalProperties") is not False:
        raise CorpusFailure
    if set(branch.get("required", [])) != set(expected):
        raise CorpusFailure
    properties = branch.get("properties")
    if not isinstance(properties, dict) or set(properties) != set(expected):
        raise CorpusFailure
    psql = properties.get("psql_fd")
    if psql != {"type": "integer", "minimum": 3, "maximum": 1023}:
        raise CorpusFailure
    metadata = schema.get("x-aifinder-static-contract")
    if not isinstance(metadata, dict):
        raise CorpusFailure
    if metadata.get("recovery_receipt_source") != "PROTECTED_LAUNCHER_QUERIES_REPLAY_AUTHORITY":
        raise CorpusFailure
    if metadata.get("caller_supplied_receipt_accepted") is not False:
        raise CorpusFailure
    if metadata.get("psql_identity_source") != "PROTECTED_PARENT_PREOPENED_INHERITED_DESCRIPTOR":
        raise CorpusFailure


def exact_schema_contracts_hold() -> bool:
    canonical_identifier = "^(?![\\s\\S]*[^A-Za-z0-9._-])[A-Za-z0-9._-]{1,64}$"
    canonical_32 = "^(?![\\s\\S]*[^A-Za-z0-9_-])[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$"
    canonical_64 = "^(?![\\s\\S]*[^A-Za-z0-9_-])[A-Za-z0-9_-]{85}[AQgw]$"
    hex_40 = "^(?![\\s\\S]*[^0-9a-f])[0-9a-f]{40}$"
    hex_64 = "^(?![\\s\\S]*[^0-9a-f])[0-9a-f]{64}$"
    try:
        assertion_schema = strict_json(ASSERTION_SCHEMA_PATH.read_bytes())
        launch_schema = strict_json(LAUNCH_SCHEMA_PATH.read_bytes())
        if not isinstance(assertion_schema, dict) or not isinstance(launch_schema, dict):
            return False
        assertion_properties = assertion_schema["properties"]
        protected = assertion_properties["protected"]["properties"]
        payload = assertion_properties["payload"]["properties"]
        receipt_properties = assertion_schema["$defs"]["consume_receipt"]["properties"]
        receipt_protected = receipt_properties["protected"]["properties"]
        receipt_payload = receipt_properties["payload"]["properties"]
        assertion_payload_keys = {
            "phase", "assertion_id", "issued_at_epoch", "expiry_epoch", "nonce",
            "environment_classification", "repository_baseline", "activation_client_sha256",
            "sql_sha256", "activation_manifest_sha256", "validator_sha256",
            "output_contract_sha256", "psql_sha256", "output_directory_identity_sha256",
            "connection_profile_identity_sha256", "execution_scope", "read_only_requirement",
            "exactly_one_run_requirement", "mutation_authorization",
            "migration_execution_authorization", "type_generation_authorization",
            "deployment_authorization", "publishing_authorization",
            "operational_reactivation_authorization",
        }
        protected_keys = {"type", "version", "issuer", "key_id", "algorithm"}
        receipt_payload_keys = {
            "assertion_sha256", "nonce_sha256", "consume_request_id", "terminal_state",
            "consumed_at_epoch", "assertion_expiry_epoch", "result_category",
        }
        if not exact_object_schema(assertion_schema, {"protected", "payload", "signature"}):
            return False
        if set(assertion_schema.get("$defs", {})) != {"consume_receipt"}:
            return False
        if not exact_object_schema(assertion_properties["protected"], protected_keys):
            return False
        if not exact_object_schema(assertion_properties["payload"], assertion_payload_keys):
            return False
        receipt_schema = assertion_schema["$defs"]["consume_receipt"]
        if not exact_object_schema(receipt_schema, {"protected", "payload", "signature"}):
            return False
        if not exact_object_schema(receipt_properties["protected"], protected_keys):
            return False
        if not exact_object_schema(receipt_properties["payload"], receipt_payload_keys):
            return False
        if protected["version"] != {"type": "integer", "const": 1}:
            return False
        if receipt_protected["version"] != {"type": "integer", "const": 1}:
            return False
        for identity_properties in (protected, receipt_protected):
            if identity_properties["issuer"].get("pattern") != canonical_identifier:
                return False
            if identity_properties["key_id"].get("pattern") != canonical_identifier:
                return False
        if payload["assertion_id"].get("pattern") != canonical_32:
            return False
        if payload["nonce"].get("pattern") != canonical_32:
            return False
        if assertion_properties["signature"].get("pattern") != canonical_64:
            return False
        if receipt_payload["consume_request_id"].get("pattern") != canonical_32:
            return False
        if receipt_properties["signature"].get("pattern") != canonical_64:
            return False
        if payload["repository_baseline"].get("pattern") != hex_40:
            return False
        assertion_epoch_contract = {"type": "integer", "minimum": 0, "maximum": 9999999999}
        if payload["issued_at_epoch"] != assertion_epoch_contract:
            return False
        if payload["expiry_epoch"] != assertion_epoch_contract:
            return False
        for field in (
            "activation_client_sha256", "sql_sha256", "activation_manifest_sha256",
            "validator_sha256", "output_contract_sha256", "psql_sha256",
            "output_directory_identity_sha256", "connection_profile_identity_sha256",
        ):
            if payload[field].get("pattern") != hex_64:
                return False
        for field in ("assertion_sha256", "nonce_sha256"):
            if receipt_payload[field].get("pattern") != hex_64:
                return False
        epoch_contract = {"type": "integer", "minimum": 0, "maximum": 9999999999}
        if receipt_payload["consumed_at_epoch"] != epoch_contract:
            return False
        if receipt_payload["assertion_expiry_epoch"] != epoch_contract:
            return False
        if receipt_payload["terminal_state"] != {"const": "CONSUMED"}:
            return False
        if receipt_payload["result_category"] != {"const": "AUTHORIZED_CONSUMED"}:
            return False
        if not schema_phase_controls_hold(assertion_schema, assertion_schema=True):
            return False
        metadata = assertion_schema.get("x-aifinder-static-contract")
        if not isinstance(metadata, dict) or metadata.get("maximum_lifetime_seconds") != 300:
            return False
        for flag in (
            "mutation_authorization",
            "migration_execution_authorization",
            "type_generation_authorization",
            "deployment_authorization",
            "publishing_authorization",
            "operational_reactivation_authorization",
        ):
            if payload[flag] != {"const": False}:
                return False
        if payload["execution_scope"] != {"const": "SINGLE_READ_ONLY_LIVE_PREFLIGHT"}:
            return False
        if payload["read_only_requirement"] != {"const": True}:
            return False
        if payload["exactly_one_run_requirement"] != {"const": True}:
            return False
        branches = launch_schema.get("oneOf")
        if not isinstance(branches, list) or len(branches) != 2:
            return False
        operations = set()
        for branch in branches:
            properties = branch["properties"]
            operations.add(properties["operation"]["const"])
            if branch.get("additionalProperties") is not False:
                return False
            if set(branch.get("required", [])) != set(properties):
                return False
            if properties["version"] != {"type": "integer", "const": 1}:
                return False
            if properties["consume_request_id"].get("pattern") != canonical_32:
                return False
            if properties["repository_baseline"].get("pattern") != hex_40:
                return False
            for field in (
                "activation_client_sha256", "assertion_sha256", "sql_sha256",
                "activation_manifest_sha256", "validator_sha256", "output_contract_sha256",
                "psql_sha256", "output_directory_identity_sha256",
                "connection_profile_identity_sha256",
            ):
                if properties[field].get("pattern") != hex_64:
                    return False
            for descriptor in (
                "assertion_fd",
                "sql_fd",
                "activation_manifest_fd",
                "validator_fd",
                "psql_fd",
                "output_directory_fd",
            ):
                if properties[descriptor] != {"type": "integer", "minimum": 3, "maximum": 1023}:
                    return False
        if operations != {"CONSUME_AND_CLAIM", "RECOVER_AND_CLAIM"}:
            return False
        if not schema_phase_controls_hold(launch_schema, assertion_schema=False):
            return False
        if not schema_terminal_controls_hold(assertion_schema, launch_schema):
            return False
        return True
    except (KeyError, OSError, TypeError, ValueError):
        return False


def exact_object_schema(schema: object, expected_keys: set[str]) -> bool:
    if not isinstance(schema, dict) or schema.get("type") != "object":
        return False
    properties = schema.get("properties")
    required = schema.get("required")
    return (
        schema.get("additionalProperties") is False
        and isinstance(properties, dict)
        and set(properties) == expected_keys
        and isinstance(required, list)
        and set(required) == expected_keys
        and len(required) == len(expected_keys)
    )


def pattern_rejects_terminal_control(pattern: object, valid: str) -> bool:
    if not isinstance(pattern, str):
        return False
    try:
        compiled = re.compile(pattern)
    except re.error:
        return False
    return compiled.search(valid) is not None and compiled.search(valid + "\n") is None


def schema_terminal_controls_hold(
    assertion_schema: dict[str, object], launch_schema: dict[str, object]
) -> bool:
    try:
        ap = assertion_schema["properties"]
        protected = ap["protected"]["properties"]
        payload = ap["payload"]["properties"]
        receipt = assertion_schema["$defs"]["consume_receipt"]["properties"]
        receipt_protected = receipt["protected"]["properties"]
        receipt_payload = receipt["payload"]["properties"]
        checks = [
            (protected["issuer"]["pattern"], "issuer-v1"),
            (protected["key_id"]["pattern"], "key-v1"),
            (payload["phase"]["pattern"], "STATIC PHASE"),
            (payload["assertion_id"]["pattern"], "A" * 43),
            (payload["nonce"]["pattern"], "A" * 43),
            (payload["repository_baseline"]["pattern"], "a" * 40),
            (ap["signature"]["pattern"], "A" * 86),
            (receipt_protected["issuer"]["pattern"], "issuer-v1"),
            (receipt_protected["key_id"]["pattern"], "key-v1"),
            (receipt_payload["assertion_sha256"]["pattern"], "a" * 64),
            (receipt_payload["nonce_sha256"]["pattern"], "a" * 64),
            (receipt_payload["consume_request_id"]["pattern"], "A" * 43),
            (receipt["signature"]["pattern"], "A" * 86),
        ]
        for field in (
            "activation_client_sha256", "sql_sha256", "activation_manifest_sha256",
            "validator_sha256", "output_contract_sha256", "psql_sha256",
            "output_directory_identity_sha256", "connection_profile_identity_sha256",
        ):
            checks.append((payload[field]["pattern"], "a" * 64))
        for branch in launch_schema["oneOf"]:
            properties = branch["properties"]
            checks.extend(
                (
                    (properties["phase"]["pattern"], "STATIC PHASE"),
                    (properties["repository_baseline"]["pattern"], "a" * 40),
                    (properties["consume_request_id"]["pattern"], "A" * 43),
                )
            )
            for field in (
                "activation_client_sha256", "assertion_sha256", "sql_sha256",
                "activation_manifest_sha256", "validator_sha256", "output_contract_sha256",
                "psql_sha256", "output_directory_identity_sha256",
                "connection_profile_identity_sha256",
            ):
                checks.append((properties[field]["pattern"], "a" * 64))
        return all(pattern_rejects_terminal_control(pattern, valid) for pattern, valid in checks)
    except (KeyError, TypeError):
        return False


def schema_phase_controls_hold(schema: dict[str, object], assertion_schema: bool) -> bool:
    try:
        if assertion_schema:
            patterns = [schema["properties"]["payload"]["properties"]["phase"]["pattern"]]
        else:
            patterns = [branch["properties"]["phase"]["pattern"] for branch in schema["oneOf"]]
        rejected = ("STATIC\n", "STATIC\t", "STATIC\x01", "STATIC\x7f")
        for pattern in patterns:
            if not isinstance(pattern, str):
                return False
            compiled = re.compile(pattern)
            if compiled.search("STATIC PHASE") is None:
                return False
            if any(compiled.search(value) is not None for value in rejected):
                return False
        return True
    except (KeyError, TypeError, re.error):
        return False


def protected_output_contract_holds() -> bool:
    try:
        architecture = ARCHITECTURE_GATE_PATH.read_text(encoding="utf-8")
        recovery = RECOVERY_CONTRACT_PATH.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False
    return (
        "PROTECTED_VALIDATOR_DESCRIPTOR_PIPELINE" in architecture
        and "DESCRIPTOR_RELATIVE_ATOMIC_EVIDENCE_PUBLICATION" in architecture
        and "FILE_AND_DIRECTORY_FSYNC_BEFORE_SUCCESS" in architecture
        and "OUTPUT_FAILURE_AFTER_JOURNAL_CLAIM_REQUIRES_FRESH_ASSERTION" in recovery
        and "ProtectedEvidencePublicationModel" in globals()
    )


def migration_gate_rebound() -> bool:
    try:
        text = MIGRATION_GATE_PATH.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False
    boundary = text.split("## Next decision boundary", 1)[-1]
    return (
        "HISTORICAL_PHASE_27NM_27OL_BOUNDARY_SUPERSEDED" in boundary
        and "REQUIRES_FULL_REDESIGN" not in boundary
        and "committed SQL and manifest also require separately scoped targeted repair" not in boundary
    )


def launch_args(
    fixtures: dict[str, object],
    operation: str,
    fds: dict[str, int],
    *,
    include_psql: bool,
) -> list[str]:
    payload = fixtures["base_assertion"]["payload"]
    args = [
        "/bin/bash",
        str(CLIENT_PATH),
        "--request-channel-fd", str(fds["request_channel"]),
        "--operation", operation,
        "--repository-baseline", BASELINE,
        "--environment", str(payload["environment_classification"]),
        "--assertion-fd", str(fds["assertion"]),
        "--sql-fd", str(fds["sql"]),
        "--activation-manifest-fd", str(fds["activation_manifest"]),
        "--validator-fd", str(fds["validator"]),
    ]
    if include_psql:
        args.extend(("--psql-fd", str(fds["psql"])))
    args.extend(
        (
            "--output-directory-fd", str(fds["output_directory"]),
            "--activation-client-sha256", str(payload["activation_client_sha256"]),
            "--assertion-sha256", hashlib.sha256(b"fabricated-assertion").hexdigest(),
            "--sql-sha256", str(payload["sql_sha256"]),
            "--activation-manifest-sha256", str(payload["activation_manifest_sha256"]),
            "--validator-sha256", str(payload["validator_sha256"]),
            "--output-contract-sha256", str(payload["output_contract_sha256"]),
            "--psql-sha256", str(payload["psql_sha256"]),
            "--output-directory-identity-sha256", str(payload["output_directory_identity_sha256"]),
            "--connection-profile-identity-sha256", str(payload["connection_profile_identity_sha256"]),
            "--consume-request-id", str(fixtures["consume_request_id"]),
        )
    )
    return args


def run_launch_case(kind: str, fixtures: dict[str, object]) -> str:
    if not CLIENT_PATH.is_file() or CLIENT_PATH.is_symlink():
        raise CorpusFailure
    supports_psql = b"--psql-fd" in CLIENT_PATH.read_bytes()
    descriptors: list[int] = []
    read_fd = -1
    request_channel = -1
    try:
        with tempfile.TemporaryDirectory(prefix="aifinder-option-a-repair-") as temporary:
            root = Path(temporary)
            minimum = 10
            fds: dict[str, int] = {}
            for name in ("assertion", "sql", "activation_manifest", "validator", "psql", "receipt"):
                path = root / name
                path.write_bytes(("fabricated-" + name).encode("ascii"))
                fd = allocate_fd(os.open(str(path), os.O_RDONLY), minimum)
                minimum = fd + 1
                fds[name] = fd
                descriptors.append(fd)
            output_directory = root / "output"
            output_directory.mkdir(mode=0o700)
            fd = allocate_fd(os.open(str(output_directory), os.O_RDONLY), minimum)
            minimum = fd + 1
            fds["output_directory"] = fd
            descriptors.append(fd)
            read_fd, original_write = os.pipe()
            request_channel = allocate_fd(original_write, minimum)
            fds["request_channel"] = request_channel

            operation = "RECOVER_AND_CLAIM" if kind in {"VALID_RECOVER_LAUNCH_REQUEST", "CALLER_RECEIPT_ARGUMENTS"} else "CONSUME_AND_CLAIM"
            include_psql = kind in {"VALID_CONSUME_LAUNCH_REQUEST", "VALID_RECOVER_LAUNCH_REQUEST"}
            if kind in {"LEADING_ZERO_DESCRIPTOR", "NORMALIZED_DUPLICATE_DESCRIPTOR", "CALLER_RECEIPT_ARGUMENTS"}:
                include_psql = supports_psql
            if kind == "MISSING_PSQL_DESCRIPTOR":
                include_psql = False
            args = launch_args(fixtures, operation, fds, include_psql=include_psql)

            if kind == "LEADING_ZERO_DESCRIPTOR":
                index = args.index("--assertion-fd") + 1
                args[index] = "0" + args[index]
            elif kind == "NORMALIZED_DUPLICATE_DESCRIPTOR":
                assertion_text = args[args.index("--assertion-fd") + 1]
                args[args.index("--sql-fd") + 1] = assertion_text
            elif kind == "CALLER_RECEIPT_ARGUMENTS":
                args.extend(
                    (
                        "--consume-receipt-fd", str(fds["receipt"]),
                        "--consume-receipt-sha256", hashlib.sha256(b"fabricated-receipt").hexdigest(),
                    )
                )

            passed_fds = tuple(sorted(set(descriptors + [request_channel])))
            completed = subprocess.run(
                args,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={"PATH": "/usr/bin:/bin", "HOME": "/nonexistent", "LC_ALL": "C"},
                close_fds=True,
                pass_fds=passed_fds,
                check=False,
                timeout=10,
            )
            os.close(request_channel)
            request_channel = -1
            request_raw = read_pipe_bounded(read_fd)
            os.close(read_fd)
            read_fd = -1

            success_expected = kind in {"VALID_CONSUME_LAUNCH_REQUEST", "VALID_RECOVER_LAUNCH_REQUEST"}
            if not success_expected:
                if (
                    completed.returncode == 1
                    and completed.stdout == b""
                    and completed.stderr == CLIENT_FAILURE_LINE
                    and request_raw == b""
                ):
                    return (
                        "PROTECTED_LAUNCH_FAILED"
                        if kind
                        in {
                            "LEADING_ZERO_DESCRIPTOR",
                            "NORMALIZED_DUPLICATE_DESCRIPTOR",
                            "MISSING_PSQL_DESCRIPTOR",
                        }
                        else "AUTH_SCHEMA_FAILED"
                    )
                return "INTERNAL_FAILED"

            if completed.returncode != 0 or completed.stdout or completed.stderr or not request_raw:
                return "AUTH_SCHEMA_FAILED"
            try:
                parsed = strict_json(request_raw)
            except Exception:
                return "INTERNAL_FAILED"
            if not isinstance(parsed, dict) or canonical(parsed) != request_raw:
                return "INTERNAL_FAILED"
            expected = launch_expected_values(fixtures, operation, fds)
            if parsed != expected:
                return "INTERNAL_FAILED"
            validate_launch_schema(operation, expected)
            return "PASS_STATIC_MODEL"
    finally:
        if request_channel >= 0:
            try:
                os.close(request_channel)
            except OSError:
                pass
        if read_fd >= 0:
            try:
                os.close(read_fd)
            except OSError:
                pass
        for fd in descriptors:
            try:
                os.close(fd)
            except OSError:
                pass


def run_lifetime_case(
    kind: str,
    fixtures: dict[str, object],
    verifier: ModuleType,
    replay: ModuleType,
    adapter: DeterministicProtectedVerifier,
) -> str:
    payload = fixtures["base_assertion"]["payload"]
    service_epoch = (
        int(payload["expiry_epoch"]) + 1
        if kind == "EXPIRED_ASSERTION"
        else int(payload["issued_at_epoch"]) - 1
    )
    transport = make_transport(
        fixtures, verifier, adapter, service_epoch=service_epoch
    )
    verification, first, request = consume_once(
        fixtures, verifier, replay, adapter, transport
    )
    if first.category != "AUTH_EXPIRED":
        return first.category
    same = replay.consume(request, transport)
    recovered = replay.recover_same_request(request, transport)
    alternate = replay.build_consume_request(
        getattr(verification, "assertion_sha256"),
        getattr(verification, "nonce_sha256"),
        getattr(verification, "binding_sha256"),
        str(fixtures["alternate_consume_request_id"]),
    )
    different = replay.consume(alternate, transport)
    if (
        same.category == "AUTH_EXPIRED"
        and recovered.category == "AUTH_EXPIRED"
        and different.category == "AUTH_REPLAY_FAILED"
        and first.receipt is None
        and same.receipt is None
        and recovered.receipt is None
    ):
        return "AUTH_EXPIRED"
    return "INTERNAL_FAILED"


def run_case(
    kind: str,
    fixtures: dict[str, object],
    verifier: ModuleType,
    replay: ModuleType,
    adapter: DeterministicProtectedVerifier,
) -> str:
    if kind in {
        "VALID_CONSUME_LAUNCH_REQUEST",
        "VALID_RECOVER_LAUNCH_REQUEST",
        "LEADING_ZERO_DESCRIPTOR",
        "NORMALIZED_DUPLICATE_DESCRIPTOR",
        "MISSING_PSQL_DESCRIPTOR",
        "CALLER_RECEIPT_ARGUMENTS",
    }:
        return run_launch_case(kind, fixtures)

    if kind == "EXACT_SCHEMA_CONTRACTS":
        return "PASS_STATIC_MODEL" if exact_schema_contracts_hold() else "INTERNAL_FAILED"
    if kind == "ASSERTION_SCHEMA_PHASE_CONTROLS":
        schema = strict_json(ASSERTION_SCHEMA_PATH.read_bytes())
        return "PASS_STATIC_MODEL" if isinstance(schema, dict) and schema_phase_controls_hold(schema, True) else "INTERNAL_FAILED"
    if kind == "LAUNCH_SCHEMA_PHASE_CONTROLS":
        schema = strict_json(LAUNCH_SCHEMA_PATH.read_bytes())
        return "PASS_STATIC_MODEL" if isinstance(schema, dict) and schema_phase_controls_hold(schema, False) else "INTERNAL_FAILED"
    if kind == "SCHEMA_TERMINAL_CONTROLS":
        assertion_schema = strict_json(ASSERTION_SCHEMA_PATH.read_bytes())
        launch_schema = strict_json(LAUNCH_SCHEMA_PATH.read_bytes())
        return (
            "PASS_STATIC_MODEL"
            if isinstance(assertion_schema, dict)
            and isinstance(launch_schema, dict)
            and schema_terminal_controls_hold(assertion_schema, launch_schema)
            else "INTERNAL_FAILED"
        )
    if kind == "PROTECTED_OUTPUT_CONTRACT":
        return "PASS_STATIC_MODEL" if protected_output_contract_holds() else "INTERNAL_FAILED"
    if kind == "MIGRATION_GATE_REBOUND":
        return "PASS_STATIC_MODEL" if migration_gate_rebound() else "INTERNAL_FAILED"

    envelope = copy.deepcopy(fixtures["base_assertion"])
    expected = expected_bindings(fixtures, verifier)

    if kind == "VALID_ASSERTION":
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "ASSERTION_BOOLEAN_VERSION":
        envelope["protected"]["version"] = True
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind in {"ASSERTION_INVALID_LIFETIME_ORDER", "ASSERTION_LIFETIME_TOO_LONG"}:
        issued_at = int(envelope["payload"]["issued_at_epoch"])
        envelope["payload"]["expiry_epoch"] = (
            issued_at if kind == "ASSERTION_INVALID_LIFETIME_ORDER" else issued_at + 301
        )
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "INVALID_SIGNATURE":
        raw = sign_assertion(verifier, adapter, envelope)
        parsed = strict_json(raw)
        if not isinstance(parsed, dict):
            raise CorpusFailure
        signature = str(parsed["signature"])
        parsed["signature"] = ("A" if signature[0] != "A" else "B") + signature[1:]
        return verifier.verify_assertion(canonical(parsed), expected, adapter).category
    if kind == "UNKNOWN_KEY_ID":
        envelope["protected"]["key_id"] = "unknown-key-v1"
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "REVOKED_KEY":
        envelope["protected"]["key_id"] = "assertion-key-revoked"
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind in {"EXPIRED_ASSERTION", "FUTURE_ASSERTION"}:
        return run_lifetime_case(kind, fixtures, verifier, replay, adapter)
    if kind in {"PHASE_NEWLINE_CONTROL", "PHASE_TAB_CONTROL", "PHASE_C0_CONTROL", "PHASE_DEL_CONTROL"}:
        suffix = {
            "PHASE_NEWLINE_CONTROL": "\n",
            "PHASE_TAB_CONTROL": "\t",
            "PHASE_C0_CONTROL": "\x01",
            "PHASE_DEL_CONTROL": "\x7f",
        }[kind]
        altered = "STATIC" + suffix + "PHASE"
        envelope["payload"]["phase"] = altered
        expected["phase"] = altered
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind in {
        "WRONG_BASELINE",
        "WRONG_ACTIVATION_CLIENT",
        "WRONG_SQL",
        "WRONG_ACTIVATION_MANIFEST",
        "WRONG_VALIDATOR",
        "WRONG_ENVIRONMENT",
        "WRONG_OUTPUT_DIRECTORY",
        "WRONG_CONNECTION_PROFILE",
    }:
        field = {
            "WRONG_BASELINE": "repository_baseline",
            "WRONG_ACTIVATION_CLIENT": "activation_client_sha256",
            "WRONG_SQL": "sql_sha256",
            "WRONG_ACTIVATION_MANIFEST": "activation_manifest_sha256",
            "WRONG_VALIDATOR": "validator_sha256",
            "WRONG_ENVIRONMENT": "environment_classification",
            "WRONG_OUTPUT_DIRECTORY": "output_directory_identity_sha256",
            "WRONG_CONNECTION_PROFILE": "connection_profile_identity_sha256",
        }[kind]
        if field == "repository_baseline":
            envelope["payload"][field] = "0" * 40
        elif field == "environment_classification":
            envelope["payload"][field] = "PRODUCTION"
        else:
            envelope["payload"][field] = hashlib.sha256((kind + "-changed").encode("ascii")).hexdigest()
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "POST_OPEN_MUTATION":
        expected["sql_sha256"] = hashlib.sha256(b"post-open-mutated-sql").hexdigest()
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind in {
        "MUTATION_TRUE",
        "MIGRATION_TRUE",
        "TYPEGEN_TRUE",
        "DEPLOYMENT_TRUE",
        "PUBLISHING_TRUE",
        "REACTIVATION_TRUE",
    }:
        field = {
            "MUTATION_TRUE": "mutation_authorization",
            "MIGRATION_TRUE": "migration_execution_authorization",
            "TYPEGEN_TRUE": "type_generation_authorization",
            "DEPLOYMENT_TRUE": "deployment_authorization",
            "PUBLISHING_TRUE": "publishing_authorization",
            "REACTIVATION_TRUE": "operational_reactivation_authorization",
        }[kind]
        envelope["payload"][field] = True
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind in {"WRONG_EXECUTION_SCOPE", "READ_ONLY_FALSE", "EXACTLY_ONE_RUN_FALSE"}:
        field, value = {
            "WRONG_EXECUTION_SCOPE": ("execution_scope", "UNBOUNDED_EXECUTION"),
            "READ_ONLY_FALSE": ("read_only_requirement", False),
            "EXACTLY_ONE_RUN_FALSE": ("exactly_one_run_requirement", False),
        }[kind]
        envelope["payload"][field] = value
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "NONCANONICAL":
        raw = sign_assertion(verifier, adapter, envelope)
        parsed = strict_json(raw)
        noncanonical = json.dumps(parsed, sort_keys=True, separators=(", ", ": ")).encode("ascii")
        return verifier.verify_assertion(noncanonical, expected, adapter).category
    if kind == "DUPLICATE_FIELDS":
        raw = sign_assertion(verifier, adapter, envelope)
        text = raw.decode("ascii")
        needle = '"phase":"' + str(envelope["payload"]["phase"]) + '"'
        if text.count(needle) != 1:
            raise CorpusFailure
        raw = text.replace(needle, needle + "," + needle, 1).encode("ascii")
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "EXTRA_FIELDS":
        envelope["payload"]["unexpected_field"] = "rejected"
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category
    if kind == "KEY_SUBSTITUTION":
        envelope["protected"]["issuer"] = "aifinder-static-replay"
        envelope["protected"]["key_id"] = "receipt-key-v1"
        raw = sign_assertion(verifier, adapter, envelope)
        return verifier.verify_assertion(raw, expected, adapter).category

    if kind in {
        "RECEIPT_BOOLEAN_VERSION",
        "INVALID_RECEIPT_SIGNATURE",
        "RECEIPT_ROLE_SUBSTITUTION",
        "RECEIPT_ASSERTION_BINDING_MISMATCH",
        "RECEIPT_NONCE_BINDING_MISMATCH",
        "RECEIPT_REQUEST_ID_MISMATCH",
        "RECEIPT_EXPIRY_BINDING_MISMATCH",
        "RECEIPT_TERMINAL_STATE_INVALID",
        "RECEIPT_RESULT_CATEGORY_INVALID",
        "RECEIPT_CONSUMED_AFTER_EXPIRY",
    }:
        verification, receipt_raw = valid_receipt(fixtures, verifier, replay, adapter)
        receipt = strict_json(receipt_raw)
        if not isinstance(receipt, dict):
            return "INTERNAL_FAILED"
        receipt_expected_values = receipt_expected(
            verification, str(fixtures["consume_request_id"])
        )
        if kind == "RECEIPT_BOOLEAN_VERSION":
            receipt["protected"]["version"] = True
            protected = receipt["protected"]
            payload = receipt["payload"]
            signature = adapter.sign(
                "REPLAY_RECEIPT_ISSUER",
                str(protected["issuer"]),
                str(protected["key_id"]),
                str(protected["algorithm"]),
                verifier.receipt_signature_input(protected, payload),
            )
            receipt["signature"] = b64url(signature)
            receipt_raw = canonical(receipt)
        elif kind == "INVALID_RECEIPT_SIGNATURE":
            signature_text = str(receipt["signature"])
            receipt["signature"] = ("A" if signature_text[0] != "A" else "B") + signature_text[1:]
            receipt_raw = canonical(receipt)
        elif kind == "RECEIPT_ROLE_SUBSTITUTION":
            receipt["protected"]["issuer"] = "aifinder-static-issuer"
            receipt["protected"]["key_id"] = "assertion-key-v1"
            protected = receipt["protected"]
            payload = receipt["payload"]
            signature = adapter.sign(
                "ASSERTION_ISSUER",
                str(protected["issuer"]),
                str(protected["key_id"]),
                str(protected["algorithm"]),
                verifier.receipt_signature_input(protected, payload),
            )
            receipt["signature"] = b64url(signature)
            receipt_raw = canonical(receipt)
        elif kind == "RECEIPT_ASSERTION_BINDING_MISMATCH":
            receipt_expected_values["assertion_sha256"] = hashlib.sha256(b"other-assertion").hexdigest()
        elif kind == "RECEIPT_NONCE_BINDING_MISMATCH":
            receipt_expected_values["nonce_sha256"] = hashlib.sha256(b"other-nonce").hexdigest()
        elif kind == "RECEIPT_REQUEST_ID_MISMATCH":
            receipt_expected_values["consume_request_id"] = str(fixtures["alternate_consume_request_id"])
        elif kind == "RECEIPT_EXPIRY_BINDING_MISMATCH":
            receipt_expected_values["assertion_expiry_epoch"] = int(
                receipt_expected_values["assertion_expiry_epoch"]
            ) + 1
        elif kind in {
            "RECEIPT_TERMINAL_STATE_INVALID",
            "RECEIPT_RESULT_CATEGORY_INVALID",
            "RECEIPT_CONSUMED_AFTER_EXPIRY",
        }:
            payload = receipt["payload"]
            if kind == "RECEIPT_TERMINAL_STATE_INVALID":
                payload["terminal_state"] = "PENDING"
            elif kind == "RECEIPT_RESULT_CATEGORY_INVALID":
                payload["result_category"] = "UNAUTHORIZED"
            else:
                payload["consumed_at_epoch"] = int(payload["assertion_expiry_epoch"]) + 1
            protected = receipt["protected"]
            signature = adapter.sign(
                "REPLAY_RECEIPT_ISSUER",
                str(protected["issuer"]),
                str(protected["key_id"]),
                str(protected["algorithm"]),
                verifier.receipt_signature_input(protected, payload),
            )
            receipt["signature"] = b64url(signature)
            receipt_raw = canonical(receipt)
        return verifier.verify_consume_receipt(
            receipt_raw, receipt_expected_values, adapter
        ).category

    mode = {
        "AUTHORITY_UNAVAILABLE": "UNAVAILABLE",
        "AUTHORITY_AMBIGUOUS": "AMBIGUOUS_AFTER_COMMIT",
        "SAME_REQUEST_RECOVERY": "AMBIGUOUS_AFTER_COMMIT",
    }.get(kind, "NORMAL")
    transport = make_transport(fixtures, verifier, adapter, mode=mode)

    if kind in {"REPLAY_REQUEST_BOOLEAN_VERSION", "REPLAY_RESPONSE_BOOLEAN_VERSION"}:
        _, verification = base_verification(fixtures, verifier, adapter)
        request = replay.build_consume_request(
            getattr(verification, "assertion_sha256"),
            getattr(verification, "nonce_sha256"),
            getattr(verification, "binding_sha256"),
            str(fixtures["consume_request_id"]),
        )
        if kind == "REPLAY_REQUEST_BOOLEAN_VERSION":
            parsed_request = strict_json(request)
            if not isinstance(parsed_request, dict):
                return "INTERNAL_FAILED"
            parsed_request["version"] = True
            return replay.consume(canonical(parsed_request), transport).category

        class BooleanVersionResponseTransport:
            def exchange(
                self, request_raw: bytes, timeout_ms: int, maximum_response_bytes: int
            ) -> bytes:
                response = strict_json(
                    transport.exchange(request_raw, timeout_ms, maximum_response_bytes)
                )
                if not isinstance(response, dict):
                    raise CorpusFailure
                response["version"] = True
                return canonical(response)

        return replay.consume(request, BooleanVersionResponseTransport()).category

    if kind in {"NONCANONICAL_REQUEST_ID", "NONCANONICAL_REQUEST_ID_INTERNAL"}:
        _, verification = base_verification(fixtures, verifier, adapter)
        canonical_request_id = str(fixtures["consume_request_id"])
        noncanonical_request_id = canonical_request_id[:-1] + (
            "J" if canonical_request_id[-1] != "J" else "B"
        )
        build_consume_request = replay.build_consume_request
        if kind == "NONCANONICAL_REQUEST_ID_INTERNAL":
            def build_consume_request(*args: object) -> bytes:
                del args
                raise TypeError("fabricated internal failure")
        try:
            request = build_consume_request(
                getattr(verification, "assertion_sha256"),
                getattr(verification, "nonce_sha256"),
                getattr(verification, "binding_sha256"),
                noncanonical_request_id,
            )
        except replay.ClientFailure as failure:
            return (
                "AUTH_SCHEMA_FAILED"
                if getattr(failure, "category", None) == "AUTH_SCHEMA_FAILED"
                else "INTERNAL_FAILED"
            )
        except Exception:
            return "INTERNAL_FAILED"
        return replay.consume(request, transport).category

    if kind == "RECOVERY_BINDING_SUBSTITUTION":
        _, verification = base_verification(fixtures, verifier, adapter)
        eligibility = ProtectedRecoveryEligibilityModel()
        rid = str(fixtures["consume_request_id"])
        assertion_sha256 = str(getattr(verification, "assertion_sha256"))
        nonce_sha256 = str(getattr(verification, "nonce_sha256"))
        binding_sha256 = str(getattr(verification, "binding_sha256"))
        try:
            eligibility.start(rid, assertion_sha256, nonce_sha256, binding_sha256)
            eligibility.mark_ambiguous(rid, assertion_sha256, nonce_sha256, binding_sha256)
            accepted = eligibility.can_recover(
                rid,
                assertion_sha256,
                nonce_sha256,
                hashlib.sha256(b"substituted-binding").hexdigest(),
            )
        except (TypeError, CorpusFailure):
            return "INTERNAL_FAILED"
        return "PROTECTED_LAUNCH_FAILED" if not accepted else "INTERNAL_FAILED"

    if kind == "AUTHORITY_UNAVAILABLE":
        _, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        return result.category
    if kind == "AUTHORITY_AMBIGUOUS":
        _, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        return result.category
    if kind == "NONCE_REPLAY":
        verification, first, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if first.category != "PASS_STATIC_MODEL":
            return "INTERNAL_FAILED"
        second_request = replay.build_consume_request(
            getattr(verification, "assertion_sha256"),
            getattr(verification, "nonce_sha256"),
            getattr(verification, "binding_sha256"),
            str(fixtures["alternate_consume_request_id"]),
        )
        return replay.consume(second_request, transport).category
    if kind == "CONCURRENT_CONSUME_RACE":
        _, verification = base_verification(fixtures, verifier, adapter)
        if not hasattr(transport, "_lock") or not hasattr(transport, "enable_concurrency_probe"):
            return "INTERNAL_FAILED"
        transport.enable_concurrency_probe(8)
        requests = []
        for index in range(8):
            requests.append(
                replay.build_consume_request(
                    getattr(verification, "assertion_sha256"),
                    getattr(verification, "nonce_sha256"),
                    getattr(verification, "binding_sha256"),
                    request_id(64 + index),
                )
            )
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            categories = list(
                executor.map(lambda request: replay.consume(request, transport).category, requests)
            )
        if (
            categories.count("PASS_STATIC_MODEL") == 1
            and categories.count("AUTH_REPLAY_FAILED") == 7
            and transport.concurrency_rendezvous_count == 8
            and transport.concurrency_peak_callers == 8
            and transport.concurrency_probe_failed is False
        ):
            return "PASS_STATIC_MODEL"
        return "INTERNAL_FAILED"
    if kind == "COPIED_RECEIPT":
        verification, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if result.receipt is None:
            return "INTERNAL_FAILED"
        receipt_result = verifier.verify_consume_receipt(
            result.receipt,
            receipt_expected(verification, str(fixtures["consume_request_id"])),
            adapter,
        )
        if receipt_result.category != "PASS_STATIC_MODEL":
            return receipt_result.category
        journal = ProtectedJournalModel()
        if not journal.claim(result.receipt):
            return "INTERNAL_FAILED"
        return "AUTH_REPLAY_FAILED" if not journal.claim(result.receipt) else "INTERNAL_FAILED"
    if kind == "RESTORED_LOCAL_UNUSED":
        verification, first, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if first.category != "PASS_STATIC_MODEL":
            return "INTERNAL_FAILED"
        second = replay.build_consume_request(
            getattr(verification, "assertion_sha256"),
            getattr(verification, "nonce_sha256"),
            getattr(verification, "binding_sha256"),
            str(fixtures["alternate_consume_request_id"]),
        )
        return replay.consume(second, transport).category
    if kind == "CRASH_AFTER_CONSUME":
        eligibility = ProtectedRecoveryEligibilityModel()
        rid = str(fixtures["consume_request_id"])
        _, prepared = base_verification(fixtures, verifier, adapter)
        bindings = protected_binding_values(prepared)
        eligibility.start(rid, *bindings)
        verification, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if protected_binding_values(verification) != bindings:
            return "INTERNAL_FAILED"
        if result.category != "PASS_STATIC_MODEL":
            return result.category
        eligibility.mark_definitive(rid, *bindings)
        return (
            "PROTECTED_LAUNCH_FAILED"
            if not eligibility.can_recover(rid, *bindings)
            else "INTERNAL_FAILED"
        )
    if kind == "CRASH_AFTER_PUBLICATION":
        verification, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if result.receipt is None:
            return "INTERNAL_FAILED"
        receipt_result = verifier.verify_consume_receipt(
            result.receipt,
            receipt_expected(verification, str(fixtures["consume_request_id"])),
            adapter,
        )
        if receipt_result.category != "PASS_STATIC_MODEL":
            return receipt_result.category
        journal = ProtectedJournalModel()
        if not journal.claim(result.receipt):
            return "INTERNAL_FAILED"
        normalized = b"TARGET_ENVIRONMENT_CLASSIFICATION|LOCAL\n"
        digest = hashlib.sha256(normalized).hexdigest()
        publication = ProtectedEvidencePublicationModel()
        name = "aifinder-protected-evidence.txt"
        if not publication.publish_once(name, normalized, digest):
            return "INTERNAL_FAILED"
        if not publication.durable_exact(name, normalized, digest):
            return "INTERNAL_FAILED"
        return "OUTPUT_FAILED" if not journal.claim(result.receipt) else "INTERNAL_FAILED"
    if kind == "SAME_REQUEST_RECOVERY":
        eligibility = ProtectedRecoveryEligibilityModel()
        rid = str(fixtures["consume_request_id"])
        _, prepared = base_verification(fixtures, verifier, adapter)
        bindings = protected_binding_values(prepared)
        eligibility.start(rid, *bindings)
        verification, first, request = consume_once(fixtures, verifier, replay, adapter, transport)
        if protected_binding_values(verification) != bindings:
            return "INTERNAL_FAILED"
        if first.category != "AUTHORITY_AMBIGUOUS":
            return "INTERNAL_FAILED"
        eligibility.mark_ambiguous(rid, *bindings)
        if not eligibility.can_recover(rid, *bindings):
            return "INTERNAL_FAILED"
        recovered = replay.recover_same_request(request, transport)
        eligibility.mark_definitive(rid, *bindings)
        if recovered.receipt is None:
            return recovered.category
        verified = verifier.verify_consume_receipt(
            recovered.receipt,
            receipt_expected(verification, rid),
            adapter,
        )
        if verified.category != "PASS_STATIC_MODEL":
            return verified.category
        record = transport.records[getattr(verification, "nonce_sha256")]
        stored = record[2]
        if stored is None:
            return "INTERNAL_FAILED"
        return (
            "PASS_STATIC_MODEL"
            if recovered.receipt == canonical(stored)
            and not eligibility.can_recover(rid, *bindings)
            else "AUTHORITY_AMBIGUOUS"
        )
    if kind == "DIFFERENT_REQUEST_REPLAY":
        verification, first, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if first.category != "PASS_STATIC_MODEL":
            return "INTERNAL_FAILED"
        second = replay.build_consume_request(
            getattr(verification, "assertion_sha256"),
            getattr(verification, "nonce_sha256"),
            getattr(verification, "binding_sha256"),
            str(fixtures["alternate_consume_request_id"]),
        )
        return replay.consume(second, transport).category
    if kind == "SECOND_JOURNAL_CLAIM":
        verification, result, _ = consume_once(fixtures, verifier, replay, adapter, transport)
        if result.receipt is None:
            return "INTERNAL_FAILED"
        verified = verifier.verify_consume_receipt(
            result.receipt,
            receipt_expected(verification, str(fixtures["consume_request_id"])),
            adapter,
        )
        if verified.category != "PASS_STATIC_MODEL":
            return verified.category
        journal = ProtectedJournalModel()
        first_claim = journal.claim(result.receipt)
        second_claim = journal.claim(result.receipt)
        return "AUTH_REPLAY_FAILED" if first_claim and not second_claim else "INTERNAL_FAILED"
    return "INTERNAL_FAILED"


def main(argv: Sequence[str]) -> int:
    if argv:
        return 2
    try:
        fixtures = load_fixtures()
        verifier = load_module("aifinder_static_verifier", VERIFIER_PATH)
        replay = load_module("aifinder_static_replay", REPLAY_PATH)
        adapter = DeterministicProtectedVerifier()
        failed = 0
        for case in fixtures["cases"]:
            actual = run_case(case["kind"], fixtures, verifier, replay, adapter)
            status = "PASS" if actual == case["expected"] else "FAIL"
            if status == "FAIL":
                failed += 1
            print(case["id"], case["expected"], actual, status)
        return 0 if failed == 0 else 1
    except Exception:
        print("STATIC_RUNNER_DEPENDENCY_OR_INTERNAL_FAILURE", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
