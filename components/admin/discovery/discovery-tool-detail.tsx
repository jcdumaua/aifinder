"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

type DiscoveryToolDetailProps = {
  toolId: string;
};

type DetailPayload = {
  tool?: Record<string, unknown> | null;
  evidence?: Record<string, unknown>[];
  duplicateCandidates?: Record<string, unknown>[];
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function formatDate(value: unknown) {
  if (typeof value !== "string") return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function SafeJsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {formatValue(value)}
      </p>
    </div>
  );
}

export function DiscoveryToolDetail({ toolId }: DiscoveryToolDetailProps) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/discovery/discovered-tools/${encodeURIComponent(toolId)}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load discovered tool detail.");
      }

      const result = await response.json();
      setData(result.data || null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load discovered tool detail."
      );
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDetail();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDetail]);

  if (loading) {
    return (
      <section className="flex min-h-96 items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center gap-3 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-bold">{error}</p>
        <button
          type="button"
          onClick={fetchDetail}
          className="text-xs font-black uppercase tracking-widest underline"
        >
          Retry
        </button>
      </section>
    );
  }

  const tool = data?.tool || null;
  const evidence = Array.isArray(data?.evidence) ? data.evidence : [];
  const duplicateCandidates = Array.isArray(data?.duplicateCandidates)
    ? data.duplicateCandidates
    : [];

  if (!tool) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Discovered tool not found.
      </section>
    );
  }

  const website = typeof tool.website === "string" ? tool.website : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/discovery/tools"
          className="inline-flex w-fit items-center gap-2 text-sm font-black text-cyan-700 hover:text-cyan-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>

        <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-600">
          Read-only review
        </span>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
              Discovered Candidate
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {formatValue(tool.name)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {formatValue(tool.description)}
            </p>
          </div>

          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
            >
              Visit website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Status" value={tool.status} />
          <DetailRow label="Category" value={tool.category} />
          <DetailRow label="Pricing" value={tool.pricing} />
          <DetailRow label="Discovery Score" value={tool.discovery_score} />
          <DetailRow label="Website" value={tool.website} />
          <DetailRow label="Canonical URL" value={tool.canonical_url} />
          <DetailRow label="Normalized Domain" value={tool.normalized_domain} />
          <DetailRow label="Slug" value={tool.slug} />
          <DetailRow label="Created" value={formatDate(tool.created_at)} />
          <DetailRow label="Updated" value={formatDate(tool.updated_at)} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-black text-slate-950">
          Duplicate Candidates
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Possible matches detected by the Discovery Engine.
        </p>

        <div className="mt-4 space-y-3">
          {duplicateCandidates.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              No duplicate candidates recorded.
            </p>
          ) : (
            duplicateCandidates.map((candidate, index) => (
              <SafeJsonBlock
                key={
                  typeof candidate.id === "string"
                    ? candidate.id
                    : `duplicate-${index}`
                }
                value={candidate}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-black text-slate-950">
          Discovery Evidence
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Evidence is rendered as escaped JSON only. No raw HTML is executed.
        </p>

        <div className="mt-4 space-y-3">
          {evidence.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              No evidence recorded.
            </p>
          ) : (
            evidence.map((item, index) => (
              <SafeJsonBlock
                key={
                  typeof item.id === "string" ? item.id : `evidence-${index}`
                }
                value={item}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
        <p className="font-black">Phase boundary</p>
        <p className="mt-1">
          This page is read-only for Phase 3C. Approve-to-tools and triage
          actions will be wired in a later controlled step.
        </p>
      </section>
    </div>
  );
}
