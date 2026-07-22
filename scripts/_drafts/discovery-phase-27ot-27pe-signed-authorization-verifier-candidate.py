#!/usr/bin/env python3
"""Static, untrusted verifier model for AiFinder Option A authorization.

This module owns no trust anchor, private key, revocation database, replay state,
connection profile, protected journal, or launch capability. Production signature
acceptance is available only through a caller-supplied protected verifier adapter.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import re
from dataclasses import dataclass
from typing import Any, Final, Mapping, Optional, Protocol

ASSERTION_TYPE: Final[str] = "AIFINDER_LIVE_PREFLIGHT_AUTHORIZATION"
RECEIPT_TYPE: Final[str] = "AIFINDER_LIVE_PREFLIGHT_CONSUME_RECEIPT"
ASSERTION_DOMAIN: Final[bytes] = b"AIFINDER-LIVE-PREFLIGHT-AUTHORIZATION-V1"
RECEIPT_DOMAIN: Final[bytes] = b"AIFINDER-LIVE-PREFLIGHT-CONSUME-RECEIPT-V1"
BINDING_DOMAIN: Final[bytes] = b"AIFINDER-LIVE-PREFLIGHT-BINDING-V1"
ALGORITHM: Final[str] = "Ed25519"
ASSERTION_ROLE: Final[str] = "ASSERTION_ISSUER"
RECEIPT_ROLE: Final[str] = "REPLAY_RECEIPT_ISSUER"
MAX_ASSERTION_BYTES: Final[int] = 16_384
MAX_RECEIPT_BYTES: Final[int] = 8_192
MAX_IDENTIFIER_BYTES: Final[int] = 64
MAX_EPOCH: Final[int] = 9_999_999_999
MAX_ASSERTION_LIFETIME_SECONDS: Final[int] = 300

CATEGORY_PASS: Final[str] = "PASS_STATIC_MODEL"
CATEGORY_SCHEMA: Final[str] = "AUTH_SCHEMA_FAILED"
CATEGORY_SIGNATURE: Final[str] = "AUTH_SIGNATURE_FAILED"
CATEGORY_EXPIRED: Final[str] = "AUTH_EXPIRED"
CATEGORY_REPLAY: Final[str] = "AUTH_REPLAY_FAILED"
CATEGORY_AUTHORITY_UNAVAILABLE: Final[str] = "AUTHORITY_UNAVAILABLE"
CATEGORY_AUTHORITY_AMBIGUOUS: Final[str] = "AUTHORITY_AMBIGUOUS"
CATEGORY_BINDING: Final[str] = "BINDING_FAILED"
CATEGORY_PROTECTED_LAUNCH: Final[str] = "PROTECTED_LAUNCH_FAILED"
CATEGORY_OUTPUT: Final[str] = "OUTPUT_FAILED"
CATEGORY_INTERNAL: Final[str] = "INTERNAL_FAILED"

BROAD_CATEGORIES: Final[frozenset[str]] = frozenset(
    {
        CATEGORY_PASS,
        CATEGORY_SCHEMA,
        CATEGORY_SIGNATURE,
        CATEGORY_EXPIRED,
        CATEGORY_REPLAY,
        CATEGORY_AUTHORITY_UNAVAILABLE,
        CATEGORY_AUTHORITY_AMBIGUOUS,
        CATEGORY_BINDING,
        CATEGORY_PROTECTED_LAUNCH,
        CATEGORY_OUTPUT,
        CATEGORY_INTERNAL,
    }
)

ENVIRONMENTS: Final[frozenset[str]] = frozenset(
    {"LOCAL", "PREVIEW", "STAGING", "PRODUCTION"}
)
RECEIPT_RESULT_CATEGORIES: Final[frozenset[str]] = frozenset(
    {"AUTHORIZED_CONSUMED"}
)

HEX_64_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
HEX_40_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{40}$")
OPAQUE_ID_RE: Final[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
B64URL_32_RE: Final[re.Pattern[str]] = re.compile(
    r"^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$"
)
B64URL_64_RE: Final[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9_-]{85}[AQgw]$")
PRINTABLE_PHASE_RE: Final[re.Pattern[str]] = re.compile(r"^[ -~]{1,128}$")

ASSERTION_PROTECTED_KEYS: Final[frozenset[str]] = frozenset(
    {"algorithm", "issuer", "key_id", "type", "version"}
)
ASSERTION_PAYLOAD_KEYS: Final[frozenset[str]] = frozenset(
    {
        "activation_client_sha256",
        "activation_manifest_sha256",
        "assertion_id",
        "connection_profile_identity_sha256",
        "deployment_authorization",
        "environment_classification",
        "exactly_one_run_requirement",
        "execution_scope",
        "expiry_epoch",
        "issued_at_epoch",
        "migration_execution_authorization",
        "mutation_authorization",
        "nonce",
        "operational_reactivation_authorization",
        "output_contract_sha256",
        "output_directory_identity_sha256",
        "phase",
        "psql_sha256",
        "publishing_authorization",
        "read_only_requirement",
        "repository_baseline",
        "sql_sha256",
        "type_generation_authorization",
        "validator_sha256",
    }
)
RECEIPT_PROTECTED_KEYS: Final[frozenset[str]] = frozenset(
    {"algorithm", "issuer", "key_id", "type", "version"}
)
RECEIPT_PAYLOAD_KEYS: Final[frozenset[str]] = frozenset(
    {
        "assertion_expiry_epoch",
        "assertion_sha256",
        "consume_request_id",
        "consumed_at_epoch",
        "nonce_sha256",
        "result_category",
        "terminal_state",
    }
)
ENVELOPE_KEYS: Final[frozenset[str]] = frozenset(
    {"payload", "protected", "signature"}
)
EXPECTED_ASSERTION_BINDING_KEYS: Final[frozenset[str]] = frozenset(
    {
        "activation_client_sha256",
        "activation_manifest_sha256",
        "connection_profile_identity_sha256",
        "environment_classification",
        "output_contract_sha256",
        "output_directory_identity_sha256",
        "phase",
        "psql_sha256",
        "repository_baseline",
        "sql_sha256",
        "validator_sha256",
    }
)
EXPECTED_RECEIPT_KEYS: Final[frozenset[str]] = frozenset(
    {
        "assertion_expiry_epoch",
        "assertion_sha256",
        "consume_request_id",
        "nonce_sha256",
    }
)
BINDING_PAYLOAD_KEYS: Final[tuple[str, ...]] = (
    "activation_client_sha256",
    "activation_manifest_sha256",
    "connection_profile_identity_sha256",
    "deployment_authorization",
    "environment_classification",
    "exactly_one_run_requirement",
    "execution_scope",
    "migration_execution_authorization",
    "mutation_authorization",
    "operational_reactivation_authorization",
    "output_contract_sha256",
    "output_directory_identity_sha256",
    "phase",
    "psql_sha256",
    "publishing_authorization",
    "read_only_requirement",
    "repository_baseline",
    "sql_sha256",
    "type_generation_authorization",
    "validator_sha256",
)


class ProtectedVerifierAdapter(Protocol):
    """Protected signature acceptance boundary supplied outside this repository."""

    def verify(
        self,
        role: str,
        issuer: str,
        key_id: str,
        algorithm: str,
        message: bytes,
        signature: bytes,
    ) -> bool:
        ...


@dataclass(frozen=True)
class VerificationResult:
    ok: bool
    category: str
    assertion_sha256: Optional[str] = None
    nonce_sha256: Optional[str] = None
    binding_sha256: Optional[str] = None
    payload: Optional[dict[str, object]] = None


class VerificationFailure(Exception):
    def __init__(self, category: str) -> None:
        super().__init__(category)
        self.category = category if category in BROAD_CATEGORIES else CATEGORY_INTERNAL


def _fail(category: str) -> None:
    raise VerificationFailure(category)


def _reject_float(value: str) -> None:
    del value
    _fail(CATEGORY_SCHEMA)


def _reject_constant(value: str) -> None:
    del value
    _fail(CATEGORY_SCHEMA)


def _walk_exact_json(value: object) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str) or not key or not key.isascii():
                _fail(CATEGORY_SCHEMA)
            _walk_exact_json(child)
        return
    if isinstance(value, str):
        if not value.isascii():
            _fail(CATEGORY_SCHEMA)
        return
    if isinstance(value, bool):
        return
    if isinstance(value, int):
        return
    _fail(CATEGORY_SCHEMA)


def load_exact_json(raw: bytes, *, maximum_bytes: int) -> dict[str, object]:
    """Load one bounded canonical ASCII JSON object with duplicate rejection."""

    if not isinstance(raw, bytes) or maximum_bytes <= 0 or not raw or len(raw) > maximum_bytes:
        _fail(CATEGORY_SCHEMA)
    if raw.startswith(b"\xef\xbb\xbf") or b"\x00" in raw or b"\r" in raw or raw.endswith(b"\n"):
        _fail(CATEGORY_SCHEMA)
    duplicate = False

    def pairs_hook(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        nonlocal duplicate
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)):
            duplicate = True
        return dict(pairs)

    try:
        text = raw.decode("ascii", "strict")
        value = json.loads(
            text,
            object_pairs_hook=pairs_hook,
            parse_float=_reject_float,
            parse_constant=_reject_constant,
        )
    except VerificationFailure:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError, TypeError, ValueError):
        _fail(CATEGORY_SCHEMA)
    if duplicate or not isinstance(value, dict):
        _fail(CATEGORY_SCHEMA)
    _walk_exact_json(value)
    if canonical_json_bytes(value) != raw:
        _fail(CATEGORY_SCHEMA)
    return value


def canonical_json_bytes(value: object) -> bytes:
    """Serialize the restricted JSON model as compact, sorted, ASCII bytes."""

    _walk_exact_json(value)
    try:
        return json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False,
        ).encode("ascii", "strict")
    except (TypeError, ValueError, UnicodeEncodeError):
        _fail(CATEGORY_SCHEMA)


def assertion_signature_input(
    protected: dict[str, object], payload: dict[str, object]
) -> bytes:
    return b"\n".join(
        (ASSERTION_DOMAIN, canonical_json_bytes(protected), canonical_json_bytes(payload))
    )


def receipt_signature_input(
    protected: dict[str, object], payload: dict[str, object]
) -> bytes:
    return b"\n".join(
        (RECEIPT_DOMAIN, canonical_json_bytes(protected), canonical_json_bytes(payload))
    )


def binding_digest(payload: Mapping[str, object]) -> str:
    """Hash the exact execution-binding subset with an explicit domain."""

    if any(key not in payload for key in BINDING_PAYLOAD_KEYS):
        _fail(CATEGORY_SCHEMA)
    binding = {key: payload[key] for key in BINDING_PAYLOAD_KEYS}
    return hashlib.sha256(BINDING_DOMAIN + b"\n" + canonical_json_bytes(binding)).hexdigest()


def _require_exact_keys(value: object, keys: frozenset[str]) -> dict[str, object]:
    if not isinstance(value, dict) or set(value) != keys:
        _fail(CATEGORY_SCHEMA)
    return value


def _require_ascii_identifier(value: object) -> str:
    if not isinstance(value, str) or OPAQUE_ID_RE.fullmatch(value) is None:
        _fail(CATEGORY_SCHEMA)
    return value


def _require_sha256(value: object) -> str:
    if not isinstance(value, str) or HEX_64_RE.fullmatch(value) is None:
        _fail(CATEGORY_SCHEMA)
    return value


def _require_epoch(value: object) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or value < 0 or value > MAX_EPOCH:
        _fail(CATEGORY_SCHEMA)
    return value


def _require_version(value: object) -> None:
    if not isinstance(value, int) or isinstance(value, bool) or value != 1:
        _fail(CATEGORY_SCHEMA)


def _decode_base64url(value: object, pattern: re.Pattern[str], decoded_bytes: int) -> bytes:
    if not isinstance(value, str) or pattern.fullmatch(value) is None or "=" in value:
        _fail(CATEGORY_SCHEMA)
    try:
        decoded = base64.urlsafe_b64decode(value + ("=" * ((4 - len(value) % 4) % 4)))
    except (ValueError, TypeError):
        _fail(CATEGORY_SCHEMA)
    if len(decoded) != decoded_bytes:
        _fail(CATEGORY_SCHEMA)
    if base64.urlsafe_b64encode(decoded).decode("ascii").rstrip("=") != value:
        _fail(CATEGORY_SCHEMA)
    return decoded


def _validate_protected(
    value: object, *, expected_type: str, expected_keys: frozenset[str]
) -> tuple[dict[str, object], str, str]:
    protected = _require_exact_keys(value, expected_keys)
    if protected.get("type") != expected_type:
        _fail(CATEGORY_SCHEMA)
    _require_version(protected.get("version"))
    issuer = _require_ascii_identifier(protected.get("issuer"))
    key_id = _require_ascii_identifier(protected.get("key_id"))
    if protected.get("algorithm") != ALGORITHM:
        _fail(CATEGORY_SCHEMA)
    return protected, issuer, key_id


def _validate_assertion_payload(value: object) -> dict[str, object]:
    payload = _require_exact_keys(value, ASSERTION_PAYLOAD_KEYS)
    phase = payload.get("phase")
    if not isinstance(phase, str) or PRINTABLE_PHASE_RE.fullmatch(phase) is None:
        _fail(CATEGORY_SCHEMA)
    _decode_base64url(payload.get("assertion_id"), B64URL_32_RE, 32)
    nonce = _decode_base64url(payload.get("nonce"), B64URL_32_RE, 32)
    del nonce
    issued = _require_epoch(payload.get("issued_at_epoch"))
    expiry = _require_epoch(payload.get("expiry_epoch"))
    if expiry <= issued or expiry - issued > MAX_ASSERTION_LIFETIME_SECONDS:
        _fail(CATEGORY_SCHEMA)
    if payload.get("environment_classification") not in ENVIRONMENTS:
        _fail(CATEGORY_SCHEMA)
    if not isinstance(payload.get("repository_baseline"), str) or HEX_40_RE.fullmatch(
        payload["repository_baseline"]
    ) is None:
        _fail(CATEGORY_SCHEMA)
    for key in (
        "activation_client_sha256",
        "activation_manifest_sha256",
        "connection_profile_identity_sha256",
        "output_contract_sha256",
        "output_directory_identity_sha256",
        "psql_sha256",
        "sql_sha256",
        "validator_sha256",
    ):
        _require_sha256(payload.get(key))
    if payload.get("execution_scope") != "SINGLE_READ_ONLY_LIVE_PREFLIGHT":
        _fail(CATEGORY_SCHEMA)
    if payload.get("read_only_requirement") is not True:
        _fail(CATEGORY_SCHEMA)
    if payload.get("exactly_one_run_requirement") is not True:
        _fail(CATEGORY_SCHEMA)
    for key in (
        "deployment_authorization",
        "migration_execution_authorization",
        "mutation_authorization",
        "operational_reactivation_authorization",
        "publishing_authorization",
        "type_generation_authorization",
    ):
        if payload.get(key) is not False:
            _fail(CATEGORY_SCHEMA)
    return payload


def _validate_receipt_payload(value: object) -> dict[str, object]:
    payload = _require_exact_keys(value, RECEIPT_PAYLOAD_KEYS)
    _require_sha256(payload.get("assertion_sha256"))
    _require_sha256(payload.get("nonce_sha256"))
    _decode_base64url(payload.get("consume_request_id"), B64URL_32_RE, 32)
    consumed = _require_epoch(payload.get("consumed_at_epoch"))
    expiry = _require_epoch(payload.get("assertion_expiry_epoch"))
    if consumed > expiry:
        _fail(CATEGORY_SCHEMA)
    if payload.get("terminal_state") != "CONSUMED":
        _fail(CATEGORY_SCHEMA)
    if payload.get("result_category") not in RECEIPT_RESULT_CATEGORIES:
        _fail(CATEGORY_SCHEMA)
    return payload


def _verify_signature(
    *,
    adapter: ProtectedVerifierAdapter,
    role: str,
    issuer: str,
    key_id: str,
    message: bytes,
    signature_text: object,
) -> None:
    signature = _decode_base64url(signature_text, B64URL_64_RE, 64)
    try:
        accepted = adapter.verify(role, issuer, key_id, ALGORITHM, message, signature)
    except Exception:
        _fail(CATEGORY_SIGNATURE)
    if accepted is not True:
        _fail(CATEGORY_SIGNATURE)


def verify_assertion(
    raw: bytes,
    expected_bindings: dict[str, object],
    adapter: ProtectedVerifierAdapter,
) -> VerificationResult:
    try:
        if set(expected_bindings) != EXPECTED_ASSERTION_BINDING_KEYS:
            _fail(CATEGORY_INTERNAL)
        envelope = load_exact_json(raw, maximum_bytes=MAX_ASSERTION_BYTES)
        envelope = _require_exact_keys(envelope, ENVELOPE_KEYS)
        protected, issuer, key_id = _validate_protected(
            envelope.get("protected"),
            expected_type=ASSERTION_TYPE,
            expected_keys=ASSERTION_PROTECTED_KEYS,
        )
        payload = _validate_assertion_payload(envelope.get("payload"))
        _verify_signature(
            adapter=adapter,
            role=ASSERTION_ROLE,
            issuer=issuer,
            key_id=key_id,
            message=assertion_signature_input(protected, payload),
            signature_text=envelope.get("signature"),
        )
        for key in EXPECTED_ASSERTION_BINDING_KEYS:
            expected = expected_bindings[key]
            if payload.get(key) != expected:
                _fail(CATEGORY_BINDING)
        nonce_bytes = _decode_base64url(payload["nonce"], B64URL_32_RE, 32)
        assertion_sha256 = hashlib.sha256(raw).hexdigest()
        nonce_sha256 = hashlib.sha256(nonce_bytes).hexdigest()
        computed_binding = binding_digest(payload)
        return VerificationResult(
            ok=True,
            category=CATEGORY_PASS,
            assertion_sha256=assertion_sha256,
            nonce_sha256=nonce_sha256,
            binding_sha256=computed_binding,
            payload=dict(payload),
        )
    except VerificationFailure as failure:
        return VerificationResult(ok=False, category=failure.category)
    except Exception:
        return VerificationResult(ok=False, category=CATEGORY_INTERNAL)


def verify_consume_receipt(
    raw: bytes,
    expected: dict[str, object],
    adapter: ProtectedVerifierAdapter,
) -> VerificationResult:
    try:
        if set(expected) != EXPECTED_RECEIPT_KEYS:
            _fail(CATEGORY_INTERNAL)
        envelope = load_exact_json(raw, maximum_bytes=MAX_RECEIPT_BYTES)
        envelope = _require_exact_keys(envelope, ENVELOPE_KEYS)
        protected, issuer, key_id = _validate_protected(
            envelope.get("protected"),
            expected_type=RECEIPT_TYPE,
            expected_keys=RECEIPT_PROTECTED_KEYS,
        )
        payload = _validate_receipt_payload(envelope.get("payload"))
        _verify_signature(
            adapter=adapter,
            role=RECEIPT_ROLE,
            issuer=issuer,
            key_id=key_id,
            message=receipt_signature_input(protected, payload),
            signature_text=envelope.get("signature"),
        )
        for key in EXPECTED_RECEIPT_KEYS:
            if payload.get(key) != expected[key]:
                _fail(CATEGORY_REPLAY)
        return VerificationResult(ok=True, category=CATEGORY_PASS, payload=dict(payload))
    except VerificationFailure as failure:
        return VerificationResult(ok=False, category=failure.category)
    except Exception:
        return VerificationResult(ok=False, category=CATEGORY_INTERNAL)
