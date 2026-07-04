export type DiscoveryQueueFailClosedStatusInput = {
  candidate_status?: unknown;
  decision_action?: unknown;
  cleanup_status?: unknown;
};

export type DiscoveryQueueFailClosedPresentation = {
  statusPresentationLabel: string;
  statusPresentationHelperText: string;
  statusPresentationSeverity: "neutral" | "warning" | "blocked";
  allActionsDisabled: true;
  disabledReason:
    | "evidence_insufficient"
    | "unclassified_not_actionable"
    | "cleanup_not_authorized"
    | "no_safe_action"
    | "fail_closed_parse_or_unknown_state";
  operatorWarningText: string;
};

const BLOCKED_STATE_WARNING =
  "This queue state is informational only. Actions are disabled until a future approved gate authorizes the next operation.";

const NEEDS_MORE_EVIDENCE_LABEL = "Needs more evidence";
const NEEDS_MORE_EVIDENCE_HELPER =
  "This candidate cannot be reviewed until more evidence is available.";

const UNCLASSIFIED_LABEL = "Unclassified";
const UNCLASSIFIED_HELPER =
  "This candidate is not classified enough for review or action.";

const CLEANUP_LABEL = "Cleanup flagged";
const CLEANUP_HELPER =
  "Cleanup grouping is diagnostic only. Cleanup is not authorized from this view.";

const ACTION_UNAVAILABLE_LABEL = "Action unavailable";
const ACTION_UNAVAILABLE_HELPER = "No safe decision action is available.";

const REVIEW_BLOCKED_LABEL = "Review blocked";
const REVIEW_BLOCKED_HELPER =
  "This queue state could not be safely interpreted. Actions are disabled.";

function normalizeQueueValue(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createPresentation(
  statusPresentationLabel: string,
  statusPresentationHelperText: string,
  statusPresentationSeverity: DiscoveryQueueFailClosedPresentation["statusPresentationSeverity"],
  disabledReason: DiscoveryQueueFailClosedPresentation["disabledReason"],
): DiscoveryQueueFailClosedPresentation {
  return {
    statusPresentationLabel,
    statusPresentationHelperText,
    statusPresentationSeverity,
    allActionsDisabled: true,
    disabledReason,
    operatorWarningText: BLOCKED_STATE_WARNING,
  };
}

export function getCandidateQueueFailClosedPresentation(
  input: DiscoveryQueueFailClosedStatusInput,
): DiscoveryQueueFailClosedPresentation {
  const candidateStatus = normalizeQueueValue(input.candidate_status);
  const decisionAction = normalizeQueueValue(input.decision_action);
  const cleanupStatus = normalizeQueueValue(input.cleanup_status);

  if (cleanupStatus === "cleanup" || cleanupStatus === "cleanup_flagged") {
    return createPresentation(
      CLEANUP_LABEL,
      CLEANUP_HELPER,
      "warning",
      "cleanup_not_authorized",
    );
  }

  if (
    candidateStatus === "needs_more_evidence" ||
    candidateStatus === "needs-more-evidence" ||
    decisionAction === "needs_more_evidence" ||
    decisionAction === "needs-more-evidence"
  ) {
    return createPresentation(
      NEEDS_MORE_EVIDENCE_LABEL,
      NEEDS_MORE_EVIDENCE_HELPER,
      "blocked",
      "evidence_insufficient",
    );
  }

  if (
    candidateStatus === "other" ||
    candidateStatus === "unclassified" ||
    candidateStatus === "active_unclassified"
  ) {
    return createPresentation(
      UNCLASSIFIED_LABEL,
      UNCLASSIFIED_HELPER,
      "neutral",
      "unclassified_not_actionable",
    );
  }

  if (decisionAction === "missing" || decisionAction === "none") {
    return createPresentation(
      ACTION_UNAVAILABLE_LABEL,
      ACTION_UNAVAILABLE_HELPER,
      "blocked",
      "no_safe_action",
    );
  }

  return createPresentation(
    REVIEW_BLOCKED_LABEL,
    REVIEW_BLOCKED_HELPER,
    "blocked",
    "fail_closed_parse_or_unknown_state",
  );
}
