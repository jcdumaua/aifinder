"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CandidateStagingQueueItem } from "./candidate-staging-queue-panel";

export type CandidateStagingQueueDetailDrawerProps = {
  candidate: CandidateStagingQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatValue(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed || "Not provided";
}

function formatArray(values: string[] | null | undefined) {
  if (!Array.isArray(values) || values.length === 0) {
    return "None reported";
  }

  const safeValues = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return safeValues.length > 0 ? safeValues.join(", ") : "None reported";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not provided";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Not provided";
  }
}

function formatLabel(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) return "Not provided";

  return trimmed
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSafeHttpsUrl(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") return "";
    if (url.username || url.password) return "";

    url.hash = "";

    return url.toString();
  } catch {
    return "";
  }
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
        {formatValue(value)}
      </dd>
    </div>
  );
}

function ArrayField({
  label,
  values,
}: {
  label: string;
  values: string[] | null | undefined;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
        {formatArray(values)}
      </dd>
    </div>
  );
}

function SafeUrlField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const safeUrl = getSafeHttpsUrl(value);

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm font-semibold leading-6 text-slate-900">
        {safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-800 underline decoration-cyan-300 underline-offset-4"
          >
            {safeUrl}
          </a>
        ) : (
          "Not provided"
        )}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black text-slate-950">{title}</h3>
      <dl className="mt-3 grid gap-3 md:grid-cols-2">{children}</dl>
    </section>
  );
}

export function CandidateStagingQueueDetailDrawer({
  candidate,
  open,
  onOpenChange,
}: CandidateStagingQueueDetailDrawerProps) {
  return (
    <Dialog open={open && candidate !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl p-4 sm:max-w-3xl sm:p-6 lg:max-w-4xl">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-xl font-black text-slate-950">
            Candidate staging details
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-600">
            Read-only metadata from the already-loaded Candidate Staging Queue.
            No queue changes are available from this drawer.
          </DialogDescription>
        </DialogHeader>

        {candidate ? (
          <div className="grid gap-4">
            <DetailSection title="Candidate Summary">
              <ReadOnlyField label="Candidate name" value={candidate.candidateName} />
              <ReadOnlyField
                label="Candidate status"
                value={formatLabel(candidate.candidateStatus)}
              />
              <ReadOnlyField
                label="Description"
                value={candidate.candidateDescription}
              />
              <ReadOnlyField
                label="Category hint"
                value={candidate.candidateCategoryHint}
              />
              <ReadOnlyField
                label="Pricing hint"
                value={candidate.candidatePricingHint}
              />
              <ReadOnlyField
                label="Confidence bucket"
                value={formatLabel(candidate.confidenceBucket)}
              />
            </DetailSection>

            <DetailSection title="URLs">
              <SafeUrlField
                label="Candidate website URL"
                value={candidate.candidateWebsiteUrl}
              />
              <SafeUrlField label="Source URL" value={candidate.sourceUrl} />
              <ReadOnlyField label="Source domain" value={candidate.sourceDomain} />
            </DetailSection>

            <DetailSection title="Duplicate and Risk Signals">
              <ReadOnlyField
                label="Duplicate check status"
                value={formatLabel(candidate.duplicateCheckStatus)}
              />
              <ArrayField
                label="Duplicate signal types"
                values={candidate.duplicateSignalTypes}
              />
              <ArrayField label="Risk flags" values={candidate.riskFlags} />
            </DetailSection>

            <DetailSection title="Discovery Metadata">
              <ReadOnlyField label="Candidate ID" value={candidate.candidateId} />
              <ReadOnlyField
                label="Discovery source ID"
                value={candidate.discoverySourceId}
              />
              <ReadOnlyField
                label="Discovery run ID"
                value={candidate.discoveryRunId}
              />
              <ReadOnlyField
                label="Audit correlation ID"
                value={candidate.auditCorrelationId}
              />
              <ReadOnlyField
                label="Source evidence kind"
                value={formatLabel(candidate.sourceEvidenceKind)}
              />
              <ReadOnlyField
                label="Source evidence locator"
                value={candidate.sourceEvidenceLocator}
              />
            </DetailSection>

            <DetailSection title="Timestamps">
              <ReadOnlyField label="Created at" value={formatDate(candidate.createdAt)} />
              <ReadOnlyField label="Updated at" value={formatDate(candidate.updatedAt)} />
            </DetailSection>
          </div>
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
            Candidate details are not available.
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              Close details
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
