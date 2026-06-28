"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE,
  CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES,
  CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE,
  hasCandidateExtractionLiveStagingContext,
  normalizeCandidateExtractionLiveStagingPreview,
  type CandidateExtractionLiveStagingPreview,
} from "@/components/admin/discovery/discovery-candidate-extraction-live-staging-utils";

type DiscoveryCandidateExtractionLiveStagingPanelProps = {
  discoveryRunId: string;
  discoverySourceId: string | null;
  candidatePreview?: CandidateExtractionLiveStagingPreview | null;
  isLiveStagingAvailable?: boolean;
};

function StatusPill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-amber-700">
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

export function DiscoveryCandidateExtractionLiveStagingPanel({
  discoveryRunId,
  discoverySourceId,
  candidatePreview = null,
  isLiveStagingAvailable = false,
}: DiscoveryCandidateExtractionLiveStagingPanelProps) {
  const trustedContext = {
    discoveryRunId: discoveryRunId.trim(),
    discoverySourceId: discoverySourceId?.trim() || "",
  };
  const safePreview = normalizeCandidateExtractionLiveStagingPreview(
    candidatePreview,
  );
  const hasTrustedContext = hasCandidateExtractionLiveStagingContext({
    ...trustedContext,
    candidatePreview: safePreview,
  });
  const disabledReason = !trustedContext.discoverySourceId
    ? "Trusted source context is required before this action can become available."
    : !safePreview
      ? "Trusted candidate preview is required before this action can become available."
      : "Future server live gate activation is required before this action can become available.";
  const canStage = Boolean(isLiveStagingAvailable && hasTrustedContext);
  const disabledDescriptionId = `candidate-live-staging-disabled-${trustedContext.discoveryRunId || "missing-run"}`;

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-4">
      <div className="rounded-2xl border border-amber-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Candidate Live Staging Scaffold
              </p>
              <StatusPill>Live staging unavailable</StatusPill>
            </div>
            <h3 className="mt-2 text-base font-black text-slate-950">
              Stage one candidate
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              This is an inert admin scaffold for a future high-friction staging
              flow. It is visible for review only and cannot execute staging,
              network requests, public catalog publishing, or crawler and model
              work.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
            Disabled scaffold
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

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-black uppercase tracking-widest text-amber-800">
            Candidate preview
          </p>
          {safePreview ? (
            <div className="mt-2 grid gap-2 text-xs text-amber-900 sm:grid-cols-2">
              <p>
                <span className="font-bold">Name:</span>{" "}
                {safePreview.candidateName || "Unavailable"}
              </p>
              <p>
                <span className="font-bold">Website:</span>{" "}
                {safePreview.candidateWebsiteUrl || "Unavailable"}
              </p>
              <p>
                <span className="font-bold">Category:</span>{" "}
                {safePreview.categoryHint || "Unavailable"}
              </p>
              <p>
                <span className="font-bold">Confidence:</span>{" "}
                {safePreview.confidenceBucket || "Unavailable"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm font-bold text-amber-900">
              Trusted candidate preview is not available yet, so staging remains
              disabled.
            </p>
          )}
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <BoundaryItem>
            Max candidates: {CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES}
          </BoundaryItem>
          <BoundaryItem>
            Source scope: {CANDIDATE_EXTRACTION_LIVE_STAGING_SOURCE_SCOPE}
          </BoundaryItem>
          <BoundaryItem>No public catalog publishing</BoundaryItem>
          <BoundaryItem>No discovered-tools write</BoundaryItem>
          <BoundaryItem>No crawler or model work</BoundaryItem>
          <BoundaryItem>Future server approval still required</BoundaryItem>
        </ul>

        <div
          id={disabledDescriptionId}
          role="status"
          aria-live="polite"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800"
        >
          {disabledReason}
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
          <p>
            Required future phrase:{" "}
            <span className="font-black">
              {CANDIDATE_EXTRACTION_LIVE_STAGING_CONFIRMATION_PHRASE}
            </span>
          </p>
          <p>
            The phrase is UI friction only. It is not a backend authorization
            token.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            This scaffold intentionally performs no request and has no enabled
            destructive action.
          </p>
          <Button
            type="button"
            disabled={!canStage}
            aria-describedby={disabledDescriptionId}
            className="rounded-xl"
          >
            Stage one candidate
          </Button>
        </div>
      </div>
    </section>
  );
}
