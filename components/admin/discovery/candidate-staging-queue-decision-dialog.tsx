"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CandidateStagingQueueItem } from "./candidate-staging-queue-panel";

const ADMIN_CSRF_API_PATH = "/api/admin/csrf";
const CANDIDATE_DECISION_API_PREFIX =
  "/api/admin/discovery/candidate-staging-queue/";

const DISCOVERY_CANDIDATE_DECISION_ACTIONS = [
  "approve_for_draft",
  "reject",
  "duplicate",
  "needs_more_evidence",
  "archive",
] as const;

const MIN_DECISION_REASON_LENGTH = 3;
const MAX_DECISION_REASON_LENGTH = 200;
const MAX_DECISION_NOTES_LENGTH = 1000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAFE_DECISION_ERROR_CODES = new Set([
  "unauthorized",
  "forbidden",
  "invalid_request_body",
  "invalid_candidate_id",
  "unsupported_request_field",
  "client_admin_identity_not_allowed",
  "ambiguous_request_field",
  "invalid_action",
  "invalid_reason",
  "invalid_notes",
  "invalid_duplicate_target",
  "duplicate_tool_target_not_supported",
  "invalid_request_correlation_id",
  "candidate_not_found",
  "decision_conflict",
  "candidate_decision_rpc_failed",
]);

type CandidateDecisionAction =
  (typeof DISCOVERY_CANDIDATE_DECISION_ACTIONS)[number];

type SubmitPhase = "idle" | "initializing" | "applying";

type AdminCsrfResponse = {
  success?: boolean;
  csrfToken?: unknown;
};

type CandidateDecisionApiResponse =
  | {
      ok: true;
      candidate?: unknown;
    }
  | {
      ok: false;
      error?: {
        code?: string;
      };
    };

type CandidateDecisionRequestBody = {
  action: CandidateDecisionAction;
  reason: string;
  notes?: string;
  duplicate_of_candidate_id?: string;
  request_correlation_id: string;
};

export type CandidateStagingQueueDecisionDialogProps = {
  candidate: CandidateStagingQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionApplied: () => void | Promise<void>;
};

const DECISION_ACTION_LABELS: Record<CandidateDecisionAction, string> = {
  approve_for_draft: "Approve for draft",
  reject: "Reject candidate",
  duplicate: "Mark duplicate",
  needs_more_evidence: "Request more evidence",
  archive: "Archive candidate",
};

function formatValue(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed || "Not provided";
}

function getSafeHostname(value: string | null | undefined) {
  if (!value) return "Link unavailable";

  try {
    return new URL(value).hostname;
  } catch {
    return "Link unavailable";
  }
}

function createRequestCorrelationId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `candidate-decision-ui:${globalThis.crypto.randomUUID()}`;
  }

  const fallbackSuffix = Math.random().toString(36).slice(2, 12);

  return `candidate-decision-ui:${Date.now()}-${fallbackSuffix}`;
}

function getSafeDecisionErrorCode(value: string | null | undefined) {
  if (!value) return "candidate_decision_rpc_failed";

  return SAFE_DECISION_ERROR_CODES.has(value)
    ? value
    : "candidate_decision_rpc_failed";
}

function getDecisionErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "forbidden":
      return "Security token missing or expired. Please refresh and try again.";
    case "invalid_reason":
      return "Decision reason must be 3-200 characters.";
    case "invalid_notes":
      return "Decision notes must be 1000 characters or fewer.";
    case "invalid_duplicate_target":
      return "Check the duplicate candidate ID.";
    case "decision_conflict":
      return "This candidate can no longer be decisioned. Refresh the queue.";
    case "candidate_decision_rpc_failed":
      return "Candidate decision could not be applied.";
    default:
      return "Candidate decision could not be applied.";
  }
}

function validateDecisionForm({
  action,
  candidateId,
  duplicateCandidateId,
  notes,
  reason,
}: {
  action: CandidateDecisionAction;
  candidateId: string;
  duplicateCandidateId: string;
  notes: string;
  reason: string;
}) {
  const trimmedReason = reason.trim();
  const trimmedNotes = notes.trim();
  const trimmedDuplicateCandidateId = duplicateCandidateId.trim();

  if (
    trimmedReason.length < MIN_DECISION_REASON_LENGTH ||
    trimmedReason.length > MAX_DECISION_REASON_LENGTH
  ) {
    return "invalid_reason";
  }

  if (trimmedNotes.length > MAX_DECISION_NOTES_LENGTH) {
    return "invalid_notes";
  }

  if (action === "duplicate") {
    if (!UUID_PATTERN.test(trimmedDuplicateCandidateId)) {
      return "invalid_duplicate_target";
    }

    if (trimmedDuplicateCandidateId === candidateId) {
      return "invalid_duplicate_target";
    }
  }

  return null;
}

export function CandidateStagingQueueDecisionDialog({
  candidate,
  open,
  onOpenChange,
  onDecisionApplied,
}: CandidateStagingQueueDecisionDialogProps) {
  const [action, setAction] =
    useState<CandidateDecisionAction>("approve_for_draft");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [duplicateCandidateId, setDuplicateCandidateId] = useState("");
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [safeErrorCode, setSafeErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSubmitting = submitPhase !== "idle";
  const trimmedReasonLength = reason.trim().length;
  const trimmedNotesLength = notes.trim().length;

  const submitButtonLabel = useMemo(() => {
    if (submitPhase === "initializing") return "Initializing decision...";
    if (submitPhase === "applying") return "Applying decision...";

    return DECISION_ACTION_LABELS[action];
  }, [action, submitPhase]);

  useEffect(() => {
    if (open) return;

    const timeoutId = window.setTimeout(() => {
      setAction("approve_for_draft");
      setReason("");
      setNotes("");
      setDuplicateCandidateId("");
      setSubmitPhase("idle");
      setSafeErrorCode(null);
      setSuccessMessage(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, candidate?.candidateId]);

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isSubmitting) return;

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!candidate || isSubmitting) return;

    setSafeErrorCode(null);
    setSuccessMessage(null);

    const validationError = validateDecisionForm({
      action,
      candidateId: candidate.candidateId,
      duplicateCandidateId,
      notes,
      reason,
    });

    if (validationError) {
      setSafeErrorCode(validationError);
      return;
    }

    const trimmedReason = reason.trim();
    const trimmedNotes = notes.trim();
    const trimmedDuplicateCandidateId = duplicateCandidateId.trim();

    try {
      setSubmitPhase("initializing");

      const csrfResponse = await fetch(ADMIN_CSRF_API_PATH, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      const csrfPayload = (await csrfResponse.json().catch(() => null)) as
        | AdminCsrfResponse
        | null;
      const csrfToken =
        typeof csrfPayload?.csrfToken === "string" ? csrfPayload.csrfToken : "";

      if (!csrfResponse.ok || csrfPayload?.success !== true || !csrfToken) {
        setSafeErrorCode("forbidden");
        return;
      }

      const requestBody: CandidateDecisionRequestBody = {
        action,
        reason: trimmedReason,
        request_correlation_id: createRequestCorrelationId(),
      };

      if (trimmedNotes) {
        requestBody.notes = trimmedNotes;
      }

      if (action === "duplicate") {
        requestBody.duplicate_of_candidate_id = trimmedDuplicateCandidateId;
      }

      setSubmitPhase("applying");

      const decisionResponse = await fetch(
        `${CANDIDATE_DECISION_API_PREFIX}${encodeURIComponent(
          candidate.candidateId,
        )}/decision`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify(requestBody),
        },
      );

      const decisionPayload = (await decisionResponse.json().catch(() => null)) as
        | CandidateDecisionApiResponse
        | null;

      if (!decisionResponse.ok || !decisionPayload?.ok) {
        const nextErrorCode =
          decisionPayload?.ok === false ? decisionPayload.error?.code : null;

        setSafeErrorCode(getSafeDecisionErrorCode(nextErrorCode));
        return;
      }

      setSuccessMessage("Candidate decision applied.");
      await onDecisionApplied();
    } catch {
      setSafeErrorCode("candidate_decision_rpc_failed");
    } finally {
      setSubmitPhase("idle");
    }
  }

  const safeErrorMessage = safeErrorCode
    ? getDecisionErrorMessage(safeErrorCode)
    : null;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review candidate decision</DialogTitle>
          <DialogDescription>
            Apply a staging decision. Approve for draft does not publish or
            write to public tools.
          </DialogDescription>
        </DialogHeader>

        {candidate ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-black text-slate-950">
                Candidate summary
              </h3>
              <dl className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-slate-800">Name</dt>
                  <dd className="break-words">{candidate.candidateName}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-800">Website</dt>
                  <dd className="break-all">
                    {getSafeHostname(candidate.candidateWebsiteUrl)}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-800">Current status</dt>
                  <dd>{candidate.candidateStatus}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-800">Category hint</dt>
                  <dd>{formatValue(candidate.candidateCategoryHint)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-800">Confidence</dt>
                  <dd>{formatValue(candidate.confidenceBucket)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-800">Duplicate check</dt>
                  <dd>{formatValue(candidate.duplicateCheckStatus)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-bold text-slate-800">Source domain</dt>
                  <dd>{formatValue(candidate.sourceDomain)}</dd>
                </div>
              </dl>
            </section>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-900">
                Decision action
              </span>
              <select
                value={action}
                onChange={(event) => {
                  setAction(event.target.value as CandidateDecisionAction);
                  setSafeErrorCode(null);
                  setSuccessMessage(null);
                }}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {DISCOVERY_CANDIDATE_DECISION_ACTIONS.map((item) => (
                  <option key={item} value={item}>
                    {DECISION_ACTION_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>

            {(action === "reject" || action === "archive") && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                {action === "archive"
                  ? "Archive is not delete. This records an admin staging decision only."
                  : "Reject is not delete. This records an admin staging decision only."}
              </p>
            )}

            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-900">
                Decision reason
              </span>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setSafeErrorCode(null);
                  setSuccessMessage(null);
                }}
                disabled={isSubmitting}
                maxLength={MAX_DECISION_REASON_LENGTH}
                rows={3}
                placeholder="Add a clear reason for this staging decision."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-xs text-slate-500">
                Reason must be 3-200 characters. Current: {trimmedReasonLength}.
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-900">
                Decision notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setSafeErrorCode(null);
                  setSuccessMessage(null);
                }}
                disabled={isSubmitting}
                maxLength={MAX_DECISION_NOTES_LENGTH}
                rows={4}
                placeholder="Optional admin-only note."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-xs text-slate-500">
                Notes must be 1000 characters or fewer. Current:{" "}
                {trimmedNotesLength}.
              </span>
            </label>

            {action === "duplicate" && (
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-900">
                  Duplicate candidate ID
                </span>
                <input
                  value={duplicateCandidateId}
                  onChange={(event) => {
                    setDuplicateCandidateId(event.target.value);
                    setSafeErrorCode(null);
                    setSuccessMessage(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Another staged candidate UUID"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="text-xs text-slate-500">
                  Enter another staged candidate ID. Duplicate-to-tool is
                  intentionally unavailable in this phase.
                </span>
              </label>
            )}

            {safeErrorMessage && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 p-3"
                role="alert"
              >
                <p className="text-sm font-black text-red-800">
                  {safeErrorMessage}
                </p>
                <p className="mt-1 text-xs text-red-700">
                  Safe error code: {safeErrorCode}
                </p>
              </div>
            )}

            {successMessage && (
              <p
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-800"
                aria-live="polite"
              >
                {successMessage}
              </p>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {submitButtonLabel}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No candidate selected.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
