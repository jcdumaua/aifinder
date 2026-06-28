"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildCandidateExtractionDryRunRequestBody,
  CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_DRY_RUN_ROUTE,
  CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION,
  hasCandidateExtractionDryRunContext,
  normalizeCandidateExtractionDryRunResponse,
  type CandidateExtractionDryRunSafeSummary,
} from "@/components/admin/discovery/discovery-candidate-extraction-dry-run-utils";

type PanelState =
  | "idle"
  | "missing_context"
  | "confirmation_required"
  | "submitting"
  | "success"
  | "rejected_validation"
  | "unauthorized"
  | "csrf_failed"
  | "rate_limited"
  | "failed_internal_error";

type DiscoveryCandidateExtractionDryRunPanelProps = {
  discoveryRunId: string;
  discoverySourceId: string | null;
};

const DEFAULT_INVOCATION_REASON =
  "Admin UI dry-run candidate extraction invocation.";

function createAuditCorrelationId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    return "";
  }

  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function fetchCsrfToken() {
  const response = await fetch("/api/admin/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (!response.ok || typeof payload?.csrfToken !== "string") {
    throw new Error("csrf_failed");
  }

  return payload.csrfToken as string;
}

function getStatusCopy(state: PanelState) {
  if (state === "missing_context") {
    return "Trusted source and run context are required before a dry-run request can be sent.";
  }

  if (state === "confirmation_required") {
    return "Confirm this dry-run check. It will not stage candidates or write to public tables.";
  }

  if (state === "submitting") {
    return "Submitting the dry-run request...";
  }

  if (state === "success") {
    return "Dry-run invocation accepted. No production writes were performed.";
  }

  if (state === "rejected_validation") {
    return "Dry-run invocation was rejected by validation.";
  }

  if (state === "unauthorized") {
    return "Your admin session is unavailable or expired. Please log in again.";
  }

  if (state === "csrf_failed") {
    return "Security token validation failed. Refresh and try again.";
  }

  if (state === "rate_limited") {
    return "Too many admin requests. Wait before trying again.";
  }

  if (state === "failed_internal_error") {
    return "The dry-run request failed safely. No production writes were performed.";
  }

  return "Ready to run a bounded dry-run invocation.";
}

function getStatusStyle(state: PanelState) {
  if (state === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (
    state === "rejected_validation" ||
    state === "unauthorized" ||
    state === "csrf_failed" ||
    state === "rate_limited" ||
    state === "failed_internal_error" ||
    state === "missing_context"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-cyan-200 bg-cyan-50 text-cyan-800";
}

function formatBoolean(value: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function SafeList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-slate-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SafeSummary({ summary }: { summary: CandidateExtractionDryRunSafeSummary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Accepted
          </p>
          <p className="mt-1 font-black text-slate-900">
            {formatBoolean(summary.accepted)}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Rejected
          </p>
          <p className="mt-1 font-black text-slate-900">
            {formatBoolean(summary.rejected)}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Dry run
          </p>
          <p className="mt-1 font-black text-slate-900">
            {formatBoolean(summary.dryRun)}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Staged
          </p>
          <p className="mt-1 font-black text-slate-900">
            {summary.candidatesStagedCount}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Skipped
          </p>
          <p className="mt-1 font-black text-slate-900">
            {summary.candidatesSkippedCount}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            No public write
          </p>
          <p className="mt-1 font-black text-slate-900">
            {formatBoolean(summary.noPublicWriteConfirmed)}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-slate-500">
            No discovered write
          </p>
          <p className="mt-1 font-black text-slate-900">
            {formatBoolean(summary.noDiscoveredWriteConfirmed)}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="font-bold uppercase tracking-wider text-slate-500">
            Audit correlation
          </p>
          <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-800">
            {summary.auditCorrelationId || "—"}
          </p>
        </div>
      </div>

      {summary.rejectionCode ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          Rejection: {summary.rejectionCode}
        </p>
      ) : null}

      {summary.errorSummary ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          {summary.errorSummary}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Safety flags
          </p>
          <SafeList items={summary.safetyFlags} emptyLabel="No flags returned." />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Validation
          </p>
          <SafeList
            items={summary.validationFailures}
            emptyLabel="No validation failures."
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Duplicate / eligibility
          </p>
          <SafeList
            items={summary.duplicateOrEligibilityRejections}
            emptyLabel="No duplicate or eligibility rejections."
          />
        </div>
      </div>
    </div>
  );
}

export function DiscoveryCandidateExtractionDryRunPanel({
  discoveryRunId,
  discoverySourceId,
}: DiscoveryCandidateExtractionDryRunPanelProps) {
  const [invocationReason, setInvocationReason] = useState(
    DEFAULT_INVOCATION_REASON,
  );
  const [panelState, setPanelState] = useState<PanelState>("idle");
  const [summary, setSummary] =
    useState<CandidateExtractionDryRunSafeSummary | null>(null);

  const trustedContext = useMemo(
    () => ({
      discoveryRunId: discoveryRunId.trim(),
      discoverySourceId: discoverySourceId?.trim() || "",
    }),
    [discoveryRunId, discoverySourceId],
  );
  const hasTrustedContext = hasCandidateExtractionDryRunContext(trustedContext);
  const isSubmitting = panelState === "submitting";
  const isConfirming = panelState === "confirmation_required";

  function beginConfirmation() {
    setSummary(null);

    if (!hasTrustedContext) {
      setPanelState("missing_context");
      return;
    }

    setPanelState("confirmation_required");
  }

  async function submitDryRun() {
    if (!hasTrustedContext || isSubmitting) return;

    setPanelState("submitting");
    setSummary(null);

    try {
      const auditCorrelationId = createAuditCorrelationId();

      if (!auditCorrelationId) {
        setPanelState("failed_internal_error");
        return;
      }

      const csrfToken = await fetchCsrfToken();
      const response = await fetch(CANDIDATE_EXTRACTION_DRY_RUN_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(
          buildCandidateExtractionDryRunRequestBody({
            discoverySourceId: trustedContext.discoverySourceId,
            discoveryRunId: trustedContext.discoveryRunId,
            auditCorrelationId,
            invocationReason:
              invocationReason.trim() || DEFAULT_INVOCATION_REASON,
          }),
        ),
      });

      const payload = await response.json().catch(() => null);
      const safeSummary = normalizeCandidateExtractionDryRunResponse(payload);
      setSummary(safeSummary);

      if (response.status === 401) {
        setPanelState("unauthorized");
        return;
      }

      if (response.status === 403) {
        setPanelState("csrf_failed");
        return;
      }

      if (response.status === 429) {
        setPanelState("rate_limited");
        return;
      }

      if (response.ok && safeSummary.accepted === true) {
        setPanelState("success");
        return;
      }

      if (response.status === 400 || safeSummary.rejected === true) {
        setPanelState("rejected_validation");
        return;
      }

      setPanelState("failed_internal_error");
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") {
        setPanelState("unauthorized");
        return;
      }

      if (error instanceof Error && error.message === "csrf_failed") {
        setPanelState("csrf_failed");
        return;
      }

      setPanelState("failed_internal_error");
    }
  }

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-4">
      <div className="rounded-2xl border border-cyan-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Candidate Extraction Invocation
              </p>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-cyan-700">
                Dry run only
              </span>
            </div>
            <h3 className="mt-2 text-base font-black text-slate-950">
              Admin invocation boundary check
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manually calls the verified admin route for this exact run/source
              context. No candidates are staged, no production writes occur, and
              live invocation is unavailable from this panel.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            Max candidates: {CANDIDATE_EXTRACTION_DRY_RUN_MAX_CANDIDATES}
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-xs text-slate-600 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-bold uppercase tracking-wider text-slate-500">
              Discovery run
            </p>
            <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-800">
              {trustedContext.discoveryRunId || "Missing trusted run ID"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-bold uppercase tracking-wider text-slate-500">
              Discovery source
            </p>
            <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-800">
              {trustedContext.discoverySourceId || "Missing trusted source ID"}
            </p>
          </div>
        </div>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Invocation reason
          <textarea
            value={invocationReason}
            onChange={(event) => setInvocationReason(event.target.value)}
            maxLength={180}
            rows={3}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100"
          />
        </label>

        <div
          role={panelState === "success" ? "status" : "alert"}
          aria-live="polite"
          className={`mt-4 rounded-xl border px-3 py-2 text-sm font-bold ${getStatusStyle(
            panelState,
          )}`}
        >
          {getStatusCopy(panelState)}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Schema: {CANDIDATE_EXTRACTION_DRY_RUN_SCHEMA_VERSION}. The request
            never sends client-supplied admin identity and cannot enable live
            invocation.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isConfirming ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPanelState("idle")}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitDryRun}
                  disabled={isSubmitting}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800"
                >
                  Confirm dry-run check
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={beginConfirmation}
                disabled={!hasTrustedContext || isSubmitting}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-disabled={!hasTrustedContext || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Prepare dry-run check"}
              </Button>
            )}
          </div>
        </div>

        {summary ? (
          <div className="mt-4">
            <SafeSummary summary={summary} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
