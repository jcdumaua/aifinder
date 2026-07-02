const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DISCOVERY_CANDIDATE_DECISION_ACTIONS = [
  "approve_for_draft",
  "reject",
  "duplicate",
  "needs_more_evidence",
  "archive",
] as const;

const DISCOVERY_CANDIDATE_DECISION_ACTION_SET = new Set<string>(
  DISCOVERY_CANDIDATE_DECISION_ACTIONS,
);

const ALLOWED_DECISION_BODY_FIELDS = new Set([
  "action",
  "decision_action",
  "reason",
  "decision_reason",
  "notes",
  "decision_notes",
  "duplicate_of_candidate_id",
  "duplicateOfCandidateId",
  "duplicate_of_tool_id",
  "duplicateOfToolId",
  "request_correlation_id",
  "requestCorrelationId",
]);

const CLIENT_ADMIN_IDENTITY_FIELDS = new Set([
  "actor_label",
  "actorLabel",
  "admin_user_id",
  "adminUserId",
  "decided_by",
  "decidedBy",
]);

const MAX_DECISION_REASON_LENGTH = 200;
const MIN_DECISION_REASON_LENGTH = 3;
const MAX_DECISION_NOTES_LENGTH = 1000;
const MAX_REQUEST_CORRELATION_ID_LENGTH = 200;

export type DiscoveryCandidateDecisionAction =
  (typeof DISCOVERY_CANDIDATE_DECISION_ACTIONS)[number];

export type DiscoveryCandidateDecisionValidationErrorCode =
  | "invalid_candidate_id"
  | "unsupported_request_field"
  | "client_admin_identity_not_allowed"
  | "ambiguous_request_field"
  | "invalid_action"
  | "invalid_reason"
  | "invalid_notes"
  | "invalid_duplicate_target"
  | "duplicate_tool_target_not_supported"
  | "invalid_request_correlation_id";

export type DiscoveryCandidateDecisionValidationInput = {
  candidateId: string;
  body: Record<string, unknown>;
};

export type ValidatedDiscoveryCandidateDecisionInput = {
  candidateId: string;
  action: DiscoveryCandidateDecisionAction;
  decisionReason: string;
  decisionNotes?: string;
  duplicateOfCandidateId?: string;
  requestCorrelationId?: string;
};

export class DiscoveryCandidateDecisionValidationError extends Error {
  readonly code: DiscoveryCandidateDecisionValidationErrorCode;

  constructor(code: DiscoveryCandidateDecisionValidationErrorCode, message: string) {
    super(message);
    this.name = "DiscoveryCandidateDecisionValidationError";
    this.code = code;
  }
}

function fail(
  code: DiscoveryCandidateDecisionValidationErrorCode,
  message: string,
): never {
  throw new DiscoveryCandidateDecisionValidationError(code, message);
}

export function isValidDiscoveryCandidateDecisionUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function isDiscoveryCandidateDecisionAction(
  value: unknown,
): value is DiscoveryCandidateDecisionAction {
  return (
    typeof value === "string" &&
    DISCOVERY_CANDIDATE_DECISION_ACTION_SET.has(value)
  );
}

export function hasUnsupportedCandidateDecisionBodyField(
  body: Record<string, unknown>,
) {
  return Object.keys(body).some(
    (key) =>
      !ALLOWED_DECISION_BODY_FIELDS.has(key) &&
      !CLIENT_ADMIN_IDENTITY_FIELDS.has(key),
  );
}

export function hasClientAdminIdentityCandidateDecisionField(
  body: Record<string, unknown>,
) {
  return Object.keys(body).some((key) => CLIENT_ADMIN_IDENTITY_FIELDS.has(key));
}

function getBodyValue(
  body: Record<string, unknown>,
  primaryKey: string,
  alternateKey: string,
) {
  const primaryPresent = Object.prototype.hasOwnProperty.call(body, primaryKey);
  const alternatePresent = Object.prototype.hasOwnProperty.call(body, alternateKey);

  if (primaryPresent && alternatePresent) {
    fail(
      "ambiguous_request_field",
      `Use either ${primaryKey} or ${alternateKey}, not both.`,
    );
  }

  if (primaryPresent) return body[primaryKey];

  if (alternatePresent) return body[alternateKey];

  return undefined;
}

function getOptionalTrimmedString(
  value: unknown,
  code: DiscoveryCandidateDecisionValidationErrorCode,
  message: string,
) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    fail(code, message);
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function getRequiredTrimmedString(
  value: unknown,
  code: DiscoveryCandidateDecisionValidationErrorCode,
  message: string,
) {
  if (typeof value !== "string") {
    fail(code, message);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    fail(code, message);
  }

  return trimmed;
}

function hasControlCharacter(value: string) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function resolveDecisionReason(value: unknown) {
  const reason = getRequiredTrimmedString(
    value,
    "invalid_reason",
    "Decision reason is required.",
  );

  if (
    reason.length < MIN_DECISION_REASON_LENGTH ||
    reason.length > MAX_DECISION_REASON_LENGTH
  ) {
    fail(
      "invalid_reason",
      `Decision reason must be ${MIN_DECISION_REASON_LENGTH}-${MAX_DECISION_REASON_LENGTH} characters.`,
    );
  }

  return reason;
}

function resolveDecisionNotes(value: unknown) {
  const notes = getOptionalTrimmedString(
    value,
    "invalid_notes",
    "Decision notes must be text.",
  );

  if (notes === undefined) {
    return undefined;
  }

  if (notes.length > MAX_DECISION_NOTES_LENGTH) {
    fail(
      "invalid_notes",
      `Decision notes must be ${MAX_DECISION_NOTES_LENGTH} characters or fewer.`,
    );
  }

  return notes;
}

function resolveRequestCorrelationId(value: unknown) {
  const requestCorrelationId = getOptionalTrimmedString(
    value,
    "invalid_request_correlation_id",
    "Request correlation ID must be text.",
  );

  if (requestCorrelationId === undefined) {
    return undefined;
  }

  if (
    requestCorrelationId.length > MAX_REQUEST_CORRELATION_ID_LENGTH ||
    hasControlCharacter(requestCorrelationId)
  ) {
    fail(
      "invalid_request_correlation_id",
      "Request correlation ID is invalid.",
    );
  }

  return requestCorrelationId;
}

function resolveDuplicateOfCandidateId(
  value: unknown,
  candidateId: string,
  action: DiscoveryCandidateDecisionAction,
) {
  const duplicateOfCandidateId = getOptionalTrimmedString(
    value,
    "invalid_duplicate_target",
    "Duplicate candidate target must be a UUID.",
  );

  if (action !== "duplicate") {
    if (duplicateOfCandidateId !== undefined) {
      fail(
        "invalid_duplicate_target",
        "Duplicate candidate target is only allowed for duplicate decisions.",
      );
    }

    return undefined;
  }

  if (duplicateOfCandidateId === undefined) {
    fail(
      "invalid_duplicate_target",
      "Duplicate decisions require a duplicate candidate target.",
    );
  }

  if (!isValidDiscoveryCandidateDecisionUuid(duplicateOfCandidateId)) {
    fail("invalid_duplicate_target", "Duplicate candidate target must be a UUID.");
  }

  if (duplicateOfCandidateId.toLowerCase() === candidateId.toLowerCase()) {
    fail(
      "invalid_duplicate_target",
      "Candidate cannot be marked as a duplicate of itself.",
    );
  }

  return duplicateOfCandidateId;
}

function assertDuplicateToolTargetUnsupported(value: unknown) {
  const duplicateOfToolId = getOptionalTrimmedString(
    value,
    "duplicate_tool_target_not_supported",
    "Duplicate tool target is not supported yet.",
  );

  if (duplicateOfToolId !== undefined) {
    fail(
      "duplicate_tool_target_not_supported",
      "Duplicate tool target is not supported yet.",
    );
  }
}

export function parseDiscoveryCandidateDecisionRequest({
  candidateId,
  body,
}: DiscoveryCandidateDecisionValidationInput): ValidatedDiscoveryCandidateDecisionInput {
  const trimmedCandidateId = candidateId.trim();

  if (!isValidDiscoveryCandidateDecisionUuid(trimmedCandidateId)) {
    fail("invalid_candidate_id", "Invalid candidate ID.");
  }

  if (hasClientAdminIdentityCandidateDecisionField(body)) {
    fail(
      "client_admin_identity_not_allowed",
      "Client-supplied admin identity is not allowed.",
    );
  }

  if (hasUnsupportedCandidateDecisionBodyField(body)) {
    fail(
      "unsupported_request_field",
      "Unsupported candidate decision request field.",
    );
  }

  const actionValue = getBodyValue(body, "action", "decision_action");

  if (!isDiscoveryCandidateDecisionAction(actionValue)) {
    fail("invalid_action", "Invalid candidate decision action.");
  }

  const decisionReason = resolveDecisionReason(
    getBodyValue(body, "reason", "decision_reason"),
  );
  const decisionNotes = resolveDecisionNotes(
    getBodyValue(body, "notes", "decision_notes"),
  );
  const duplicateOfCandidateId = resolveDuplicateOfCandidateId(
    getBodyValue(body, "duplicate_of_candidate_id", "duplicateOfCandidateId"),
    trimmedCandidateId,
    actionValue,
  );

  assertDuplicateToolTargetUnsupported(
    getBodyValue(body, "duplicate_of_tool_id", "duplicateOfToolId"),
  );

  const requestCorrelationId = resolveRequestCorrelationId(
    getBodyValue(body, "request_correlation_id", "requestCorrelationId"),
  );

  return {
    candidateId: trimmedCandidateId,
    action: actionValue,
    decisionReason,
    ...(decisionNotes !== undefined ? { decisionNotes } : {}),
    ...(duplicateOfCandidateId !== undefined ? { duplicateOfCandidateId } : {}),
    ...(requestCorrelationId !== undefined ? { requestCorrelationId } : {}),
  };
}
