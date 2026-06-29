"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

import {
  CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE,
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_LIVE_STAGING_ROUTE,
  CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE,
  buildCandidateExtractionLiveStagingRequestBody,
  getCandidateExtractionLiveStagingFailureMessage,
  hasCandidateExtractionLiveStagingContext,
  normalizeCandidateExtractionLiveStagingPreview,
  normalizeCandidateExtractionLiveStagingResponseSummary,
  type CandidateExtractionLiveStagingPreview,
  type CandidateExtractionLiveStagingResponseSummary,
} from "@/components/admin/discovery/discovery-candidate-extraction-live-staging-utils";

type DiscoveryCandidateExtractionLiveStagingPanelProps = {
  discoveryRunId: string;
  discoverySourceId: string | null;
  candidatePreview?: CandidateExtractionLiveStagingPreview | null;
  isLiveStagingAvailable?: boolean;
};

type LiveStagingPanelState =
  | "idle"
  | "confirming"
  | "submitting"
  | "succeeded"
  | "failed"
  | "csrf_failed";

function StatusPill({
  children,
  tone = "warning",
}: {
  children: string;
  tone?: "warning" | "ready" | "success" | "error";
}) {
  const toneClass =
    tone === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "success"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${toneClass}`}
    >
      {children}
    </span>
  );
}

function BoundaryItem({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
      {children}
    </li>
  );
}

function SummaryGrid({
  summary,
}: {
  summary: CandidateExtractionLiveStagingResponseSummary;
}) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <dt className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Candidate status
        </dt>
        <dd className="mt-1 text-sm font-black text-slate-950">
          {summary.candidateStatus || "staged"}
        </dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <dt className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Staged count
        </dt>
        <dd className="mt-1 text-sm font-black text-slate-950">
          {summary.candidatesStagedCount ?? 0}
        </dd>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <dt className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Public write
        </dt>
        <dd className="mt-1 text-sm font-black text-slate-950">
          {summary.noPublicWriteConfirmed ? "Not performed" : "Unconfirmed"}
        </dd>
      </div>
    </dl>
  );
}

async function fetchCsrfToken() {
  const response = await fetch("/api/admin/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || typeof payload?.csrfToken !== "string") {
    throw new Error("csrf_failed");
  }

  return payload.csrfToken as string;
}

export function DiscoveryCandidateExtractionLiveStagingPanel({
  discoveryRunId,
  discoverySourceId,
  candidatePreview = null,
  isLiveStagingAvailable = false,
}: DiscoveryCandidateExtractionLiveStagingPanelProps) {
  const [panelState, setPanelState] = useState<LiveStagingPanelState>("idle");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState("");
  const [message, setMessage] = useState("");
  const [summary, setSummary] =
    useState<CandidateExtractionLiveStagingResponseSummary | null>(null);

  const trustedContext = useMemo(
    () => ({
      discoveryRunId: discoveryRunId.trim(),
      discoverySourceId: discoverySourceId?.trim() || "",
    }),
    [discoveryRunId, discoverySourceId],
  );

  const safePreview = normalizeCandidateExtractionLiveStagingPreview(
    candidatePreview,
  );
  const hasTrustedContext = hasCandidateExtractionLiveStagingContext({
    ...trustedContext,
    candidatePreview: safePreview,
  });
  const canRequestStaging = Boolean(isLiveStagingAvailable && hasTrustedContext);
  const phraseMatches =
    confirmationPhrase.trim() ===
    CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE;
  const canConfirm =
    canRequestStaging &&
    confirmationChecked &&
    phraseMatches &&
    panelState !== "submitting";
  const disabledDescriptionId = `candidate-live-staging-state-${
    trustedContext.discoveryRunId || "missing-run"
  }`;
  const requestBody = buildCandidateExtractionLiveStagingRequestBody({
    ...trustedContext,
    candidatePreview: safePreview,
  });

  const disabledReason = !trustedContext.discoverySourceId
    ? "Trusted source context is required before this action can become available."
    : !safePreview
      ? "Trusted reviewable candidate preview is required before staging."
      : !hasTrustedContext
        ? "Preview lineage must match this exact source and run before staging."
        : "Ready for server-revalidated staging.";

  async function submitConfirmedStaging() {
    if (!requestBody || !canConfirm) return;

    setPanelState("submitting");
    setMessage("");
    setSummary(null);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(CANDIDATE_EXTRACTION_LIVE_STAGING_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(requestBody),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.accepted) {
        setPanelState(response.status === 403 ? "csrf_failed" : "failed");
        setMessage(
          getCandidateExtractionLiveStagingFailureMessage(
            payload,
            response.status,
          ),
        );
        return;
      }

      const normalized =
        normalizeCandidateExtractionLiveStagingResponseSummary(payload);

      setSummary(normalized);
      setPanelState("succeeded");
      setConfirmationChecked(false);
      setConfirmationPhrase("");
      setMessage(
        "Candidate staged for admin review. It was not published and no public tools write was performed.",
      );
    } catch (error) {
      if (error instanceof Error && error.message === "csrf_failed") {
        setPanelState("csrf_failed");
        setMessage("Security token missing or expired. Please refresh and try again.");
        return;
      }

      setPanelState("failed");
      setMessage("Candidate staging failed safely. No public write was performed.");
    }
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-4">
      <div className="rounded-2xl border border-amber-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Candidate Live Staging
              </p>
              {canRequestStaging ? (
                <StatusPill tone="ready">Preview ready</StatusPill>
              ) : (
                <StatusPill>Staging unavailable</StatusPill>
              )}
              {panelState === "succeeded" ? (
                <StatusPill tone="success">Candidate staged</StatusPill>
              ) : null}
              {panelState === "failed" || panelState === "csrf_failed" ? (
                <StatusPill tone="error">Blocked safely</StatusPill>
              ) : null}
            </div>
            <h3 className="mt-2 text-base font-black text-slate-950">
              Stage one candidate
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This action stages one server-revalidated candidate for admin
              review. It does not publish the tool and does not write to public
              tools.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-600">
            <p>max_candidates: {CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES}</p>
            <p>source_scope: {CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Candidate destination
            </p>
            <p className="mt-2 break-words text-sm font-black text-slate-950">
              {safePreview?.candidateName || "No reviewable candidate preview"}
            </p>
            <p className="mt-1 break-words text-xs font-bold text-slate-600">
              {safePreview?.candidateWebsiteUrl || "Candidate website unavailable"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Trusted source snapshot
            </p>
            <p className="mt-2 break-words text-xs font-bold text-slate-700">
              {safePreview?.sourceUrlSnapshot || "Trusted source unavailable"}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Source provenance stays separate from the candidate website.
            </p>
          </div>
        </div>

        {safePreview?.evidenceSummary ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Evidence summary
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {safePreview.evidenceSummary}
            </p>
          </div>
        ) : null}

        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <BoundaryItem>One candidate only</BoundaryItem>
          <BoundaryItem>Server revalidates preview before staging</BoundaryItem>
          <BoundaryItem>Trusted source snapshot is used as source URL</BoundaryItem>
          <BoundaryItem>Candidate website remains separate</BoundaryItem>
          <BoundaryItem>No public tools write</BoundaryItem>
          <BoundaryItem>No discovered tools write</BoundaryItem>
        </ul>

        <div
          id={disabledDescriptionId}
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600"
          aria-live="polite"
        >
          {panelState === "succeeded"
            ? "Candidate staged. No public tools write was performed."
            : message || disabledReason}
        </div>

        {summary ? (
          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="mb-3 text-sm font-black text-sky-950">
              Candidate staged
            </p>
            <SummaryGrid summary={summary} />
          </div>
        ) : null}

        {panelState === "confirming" || panelState === "submitting" ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${disabledDescriptionId}-title`}
            className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 shadow-sm"
          >
            <h4
              id={`${disabledDescriptionId}-title`}
              className="text-base font-black text-slate-950"
            >
              Stage this candidate?
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will stage one candidate for admin review using the
              server-revalidated preview. It will not publish the tool and will
              not write to public tools.
            </p>

            <label className="mt-4 flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={confirmationChecked}
                onChange={(event) =>
                  setConfirmationChecked(event.currentTarget.checked)
                }
                disabled={panelState === "submitting"}
                className="mt-1"
              />
              <span>
                I understand this stages one candidate only and does not publish
                to public tools.
              </span>
            </label>

            <label className="mt-3 block text-sm font-bold text-slate-700">
              Type {CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE} to
              confirm.
              <input
                value={confirmationPhrase}
                onChange={(event) => setConfirmationPhrase(event.target.value)}
                disabled={panelState === "submitting"}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                autoComplete="off"
              />
            </label>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPanelState("idle");
                  setConfirmationChecked(false);
                  setConfirmationPhrase("");
                }}
                disabled={panelState === "submitting"}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitConfirmedStaging}
                disabled={!canConfirm}
                className="rounded-xl"
              >
                {panelState === "submitting" ? "Staging..." : "Stage candidate"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={() => setPanelState("confirming")}
              disabled={!canRequestStaging || panelState === "succeeded"}
              aria-describedby={disabledDescriptionId}
              className="rounded-xl"
            >
              Stage candidate
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
