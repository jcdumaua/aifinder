#!/usr/bin/env python3
"""Static, transport-free replay-authority client model for AiFinder Option A.

The repository supplies request/response grammar only. Endpoint selection,
authentication, certificates, credentials, retries, and authoritative replay
state belong to an external protected transport adapter.
"""

from __future__ import annotations

import base64
import json
import re
from dataclasses import dataclass
from typing import Any, Final, Optional, Protocol

REQUEST_TYPE: Final[str] = "AIFINDER_LIVE_PREFLIGHT_CONSUME_REQUEST"
RESPONSE_TYPE: Final[str] = "AIFINDER_LIVE_PREFLIGHT_CONSUME_RESPONSE"
REQUEST_VERSION: Final[int] = 1
TIMEOUT_MS: Final[int] = 5_000
MAX_REQUEST_BYTES: Final[int] = 2_048
MAX_RESPONSE_BYTES: Final[int] = 16_384

CATEGORY_PASS: Final[str] = "PASS_STATIC_MODEL"
CATEGORY_SCHEMA: Final[str] = "AUTH_SCHEMA_FAILED"
CATEGORY_EXPIRED: Final[str] = "AUTH_EXPIRED"
CATEGORY_REPLAY: Final[str] = "AUTH_REPLAY_FAILED"
CATEGORY_UNAVAILABLE: Final[str] = "AUTHORITY_UNAVAILABLE"
CATEGORY_AMBIGUOUS: Final[str] = "AUTHORITY_AMBIGUOUS"
CATEGORY_INTERNAL: Final[str] = "INTERNAL_FAILED"

HEX_64_RE: Final[re.Pattern[str]] = re.compile(r"^[0-9a-f]{64}$")
B64URL_32_RE: Final[re.Pattern[str]] = re.compile(
    r"^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$"
)
REQUEST_KEYS: Final[frozenset[str]] = frozenset(
    {
        "assertion_sha256",
        "binding_sha256",
        "consume_request_id",
        "nonce_sha256",
        "operation",
        "type",
        "version",
    }
)
SUCCESS_RESPONSE_KEYS: Final[frozenset[str]] = frozenset(
    {"consume_request_id", "receipt", "status", "type", "version"}
)
FAILURE_RESPONSE_KEYS: Final[frozenset[str]] = frozenset(
    {"consume_request_id", "status", "type", "version"}
)
ENVELOPE_KEYS: Final[frozenset[str]] = frozenset(
    {"payload", "protected", "signature"}
)
OPERATIONS: Final[frozenset[str]] = frozenset({"CONSUME", "RECOVER_SAME_REQUEST"})
FAILURE_STATUSES: Final[frozenset[str]] = frozenset(
    {"AMBIGUOUS", "EXPIRED", "REPLAY_REJECTED", "UNAVAILABLE"}
)


class ProtectedTransportAdapter(Protocol):
    """External protected transport boundary; no implementation lives here."""

    def exchange(
        self, request: bytes, timeout_ms: int, maximum_response_bytes: int
    ) -> bytes:
        ...


@dataclass(frozen=True)
class ConsumeResult:
    ok: bool
    category: str
    receipt: Optional[bytes] = None
    consume_request_id: Optional[str] = None


class ClientFailure(Exception):
    def __init__(self, category: str) -> None:
        super().__init__(category)
        self.category = category


def _fail(category: str) -> None:
    raise ClientFailure(category)


def _reject_float(value: str) -> None:
    del value
    _fail(CATEGORY_SCHEMA)


def _reject_constant(value: str) -> None:
    del value
    _fail(CATEGORY_SCHEMA)


def _walk(value: object) -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str) or not key or not key.isascii():
                _fail(CATEGORY_SCHEMA)
            _walk(child)
        return
    if isinstance(value, str):
        if not value.isascii():
            _fail(CATEGORY_SCHEMA)
        return
    if isinstance(value, bool) or isinstance(value, int):
        return
    _fail(CATEGORY_SCHEMA)


def _canonical(value: object) -> bytes:
    _walk(value)
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


def _load_canonical(raw: bytes, maximum: int) -> dict[str, object]:
    if not isinstance(raw, bytes) or not raw or len(raw) > maximum:
        _fail(CATEGORY_SCHEMA)
    if raw.startswith(b"\xef\xbb\xbf") or b"\x00" in raw or b"\r" in raw or raw.endswith(b"\n"):
        _fail(CATEGORY_SCHEMA)
    duplicate = False

    def hook(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        nonlocal duplicate
        keys = [key for key, _ in pairs]
        if len(keys) != len(set(keys)):
            duplicate = True
        return dict(pairs)

    try:
        value = json.loads(
            raw.decode("ascii", "strict"),
            object_pairs_hook=hook,
            parse_float=_reject_float,
            parse_constant=_reject_constant,
        )
    except ClientFailure:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError, TypeError, ValueError):
        _fail(CATEGORY_SCHEMA)
    if duplicate or not isinstance(value, dict):
        _fail(CATEGORY_SCHEMA)
    _walk(value)
    if _canonical(value) != raw:
        _fail(CATEGORY_SCHEMA)
    return value


def _require_sha256(value: object) -> str:
    if not isinstance(value, str) or HEX_64_RE.fullmatch(value) is None:
        _fail(CATEGORY_SCHEMA)
    return value


def _require_request_id(value: object) -> str:
    if not isinstance(value, str) or B64URL_32_RE.fullmatch(value) is None:
        _fail(CATEGORY_SCHEMA)
    try:
        decoded = base64.urlsafe_b64decode(value + "=")
    except (ValueError, TypeError):
        _fail(CATEGORY_SCHEMA)
    if (
        len(decoded) != 32
        or base64.urlsafe_b64encode(decoded).decode("ascii").rstrip("=") != value
    ):
        _fail(CATEGORY_SCHEMA)
    return value


def _require_version(value: object) -> None:
    if not isinstance(value, int) or isinstance(value, bool) or value != REQUEST_VERSION:
        _fail(CATEGORY_SCHEMA)


def _parse_request(raw: bytes) -> dict[str, object]:
    value = _load_canonical(raw, MAX_REQUEST_BYTES)
    if set(value) != REQUEST_KEYS:
        _fail(CATEGORY_SCHEMA)
    if value.get("type") != REQUEST_TYPE:
        _fail(CATEGORY_SCHEMA)
    _require_version(value.get("version"))
    if value.get("operation") not in OPERATIONS:
        _fail(CATEGORY_SCHEMA)
    _require_sha256(value.get("assertion_sha256"))
    _require_sha256(value.get("nonce_sha256"))
    _require_sha256(value.get("binding_sha256"))
    _require_request_id(value.get("consume_request_id"))
    return value


def build_consume_request(
    assertion_sha256: str,
    nonce_sha256: str,
    binding_sha256: str,
    consume_request_id: str,
) -> bytes:
    request = {
        "assertion_sha256": _require_sha256(assertion_sha256),
        "binding_sha256": _require_sha256(binding_sha256),
        "consume_request_id": _require_request_id(consume_request_id),
        "nonce_sha256": _require_sha256(nonce_sha256),
        "operation": "CONSUME",
        "type": REQUEST_TYPE,
        "version": REQUEST_VERSION,
    }
    raw = _canonical(request)
    if len(raw) > MAX_REQUEST_BYTES:
        _fail(CATEGORY_SCHEMA)
    return raw


def _recovery_request(request: bytes) -> bytes:
    parsed = _parse_request(request)
    if parsed["operation"] != "CONSUME":
        _fail(CATEGORY_SCHEMA)
    recovered = dict(parsed)
    recovered["operation"] = "RECOVER_SAME_REQUEST"
    return _canonical(recovered)


def parse_bounded_response(raw: bytes, *, maximum_bytes: int) -> dict[str, object]:
    if maximum_bytes <= 0 or maximum_bytes > MAX_RESPONSE_BYTES:
        _fail(CATEGORY_SCHEMA)
    value = _load_canonical(raw, maximum_bytes)
    status = value.get("status")
    expected = SUCCESS_RESPONSE_KEYS if status == "CONSUMED" else FAILURE_RESPONSE_KEYS
    if set(value) != expected:
        _fail(CATEGORY_SCHEMA)
    if value.get("type") != RESPONSE_TYPE:
        _fail(CATEGORY_SCHEMA)
    _require_version(value.get("version"))
    _require_request_id(value.get("consume_request_id"))
    if status == "CONSUMED":
        receipt = value.get("receipt")
        if not isinstance(receipt, dict) or set(receipt) != ENVELOPE_KEYS:
            _fail(CATEGORY_SCHEMA)
        _walk(receipt)
    elif status not in FAILURE_STATUSES:
        _fail(CATEGORY_SCHEMA)
    return value


def _exchange(request: bytes, transport: ProtectedTransportAdapter) -> ConsumeResult:
    try:
        parsed_request = _parse_request(request)
        response_raw = transport.exchange(request, TIMEOUT_MS, MAX_RESPONSE_BYTES)
        response = parse_bounded_response(response_raw, maximum_bytes=MAX_RESPONSE_BYTES)
        request_id = parsed_request["consume_request_id"]
        if response["consume_request_id"] != request_id:
            return ConsumeResult(False, CATEGORY_REPLAY, consume_request_id=str(request_id))
        status = response["status"]
        if status == "CONSUMED":
            return ConsumeResult(
                True,
                CATEGORY_PASS,
                receipt=_canonical(response["receipt"]),
                consume_request_id=str(request_id),
            )
        if status == "EXPIRED":
            return ConsumeResult(False, CATEGORY_EXPIRED, consume_request_id=str(request_id))
        if status == "REPLAY_REJECTED":
            return ConsumeResult(False, CATEGORY_REPLAY, consume_request_id=str(request_id))
        if status == "UNAVAILABLE":
            return ConsumeResult(False, CATEGORY_UNAVAILABLE, consume_request_id=str(request_id))
        return ConsumeResult(False, CATEGORY_AMBIGUOUS, consume_request_id=str(request_id))
    except TimeoutError:
        try:
            request_id = _parse_request(request)["consume_request_id"]
        except Exception:
            request_id = None
        return ConsumeResult(False, CATEGORY_AMBIGUOUS, consume_request_id=request_id)
    except OSError:
        try:
            request_id = _parse_request(request)["consume_request_id"]
        except Exception:
            request_id = None
        return ConsumeResult(False, CATEGORY_UNAVAILABLE, consume_request_id=request_id)
    except ClientFailure as failure:
        return ConsumeResult(False, failure.category)
    except Exception:
        return ConsumeResult(False, CATEGORY_INTERNAL)


def consume(request: bytes, transport: ProtectedTransportAdapter) -> ConsumeResult:
    return _exchange(request, transport)


def recover_same_request(
    request: bytes, transport: ProtectedTransportAdapter
) -> ConsumeResult:
    try:
        return _exchange(_recovery_request(request), transport)
    except ClientFailure as failure:
        return ConsumeResult(False, failure.category)
    except Exception:
        return ConsumeResult(False, CATEGORY_INTERNAL)
