"use client";

import { useEffect, useMemo, useState } from "react";
import { ManualMetadataFetchResultsReview } from "@/components/admin/discovery/manual-metadata-fetch-results-review";
import { ManualStaticHtmlEvidenceResultsReview } from "@/components/admin/discovery/manual-static-html-evidence-results-review";
import { Button } from "@/components/ui/button";
import { normalizeManualMetadataFetchStats } from "@/lib/discovery-run-results-review";
import { normalizeManualStaticHtmlEvidenceStats } from "@/lib/discovery-static-html-evidence-results-review";

type DiscoveryRunStatus = "pending" | "running" | "completed" | "failed";

type DiscoveryRun = {
  id: string;
  source_id: string | null;
  status: DiscoveryRunStatus;
  stats: {
    tools_found?: number;
    tools_new?: number;
    tools_duplicates?: number;
    errors?: number;
    [key: string]: unknown;
  } | null;
  error_log: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  audit_events?: unknown;
  audit_warning?: unknown;
};

type PaginationState = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusStyle(status: DiscoveryRunStatus) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "running") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatValue(run: DiscoveryRun, key: string) {
  const value = run.stats?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function DiscoveryRunsTable({ refreshKey = 0 }: { refreshKey?: number }) {
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
    });

    if (status !== "all") {
      params.set("status", status);
    }

    return params.toString();
  }, [pagination.page, pagination.limit, status]);

  async function fetchRuns() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/discovery/runs?${queryString}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to load Discovery Engine runs."
        );
      }

      setRuns(Array.isArray(result?.data) ? result.data : []);
      setExpandedRunId(null);
      setPagination((current) => ({
        ...current,
        total: result?.pagination?.total || 0,
        totalPages: result?.pagination?.totalPages || 0,
      }));
    } catch (error) {
      setRuns([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load Discovery Engine runs."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchRuns();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, refreshKey]);

  function updateStatus(nextStatus: string) {
    setStatus(nextStatus);
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }

  function goToPreviousPage() {
    setPagination((current) => ({
      ...current,
      page: Math.max(1, current.page - 1),
    }));
  }

  function goToNextPage() {
    setPagination((current) => ({
      ...current,
      page:
        current.totalPages > 0
          ? Math.min(current.totalPages, current.page + 1)
          : current.page + 1,
    }));
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Discovery Runs
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            Run history
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Track future crawler jobs and intake runs. This is read-only until
            automated discovery starts creating run records.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={status}
            onChange={(event) => updateStatus(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            onClick={fetchRuns}
            disabled={isLoading}
            className="rounded-xl"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[1fr_110px_1fr_1fr_110px_128px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 xl:grid">
          <span>Run</span>
          <span>Status</span>
          <span>Stats</span>
          <span>Time</span>
          <span>Errors</span>
          <span>Review</span>
        </div>

        {isLoading ? (
          <div className="px-4 py-12 text-center text-sm font-bold text-slate-500">
            Loading discovery runs...
          </div>
        ) : errorMessage ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-bold text-red-700">{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              onClick={fetchRuns}
              className="mt-4 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        ) : runs.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-bold text-slate-600">
              No discovery runs found for this filter.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This is expected before the real crawler or run creation workflow
              is connected.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {runs.map((run) => {
              const manualMetadataFetchReview = normalizeManualMetadataFetchStats(
                run.stats
              );
              const manualStaticHtmlEvidenceReview = normalizeManualStaticHtmlEvidenceStats(
                run.stats
              );
              const manualMetadataFetchPanelId = `manual-metadata-fetch-review-${run.id}`;
              const manualStaticHtmlEvidencePanelId = `manual-static-html-evidence-review-${run.id}`;
              const reviewPanelId = manualMetadataFetchReview
                ? manualMetadataFetchPanelId
                : manualStaticHtmlEvidenceReview
                  ? manualStaticHtmlEvidencePanelId
                  : null;
              const isExpanded = expandedRunId === run.id;

              return (
                <div key={run.id}>
                  <div className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1fr_110px_1fr_1fr_110px_128px] xl:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">
                        {run.id}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Source: {run.source_id || "Manual / unknown"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getStatusStyle(
                        run.status
                      )}`}
                    >
                      {run.status}
                    </span>

                    {manualMetadataFetchReview ? (
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4 xl:grid-cols-2">
                        <span>Total: {manualMetadataFetchReview.counts.totalUrls}</span>
                        <span>Fetched: {manualMetadataFetchReview.counts.fetchedUrls}</span>
                        <span>Failed: {manualMetadataFetchReview.counts.failedUrls}</span>
                        <span>Skipped: {manualMetadataFetchReview.counts.skippedUrls}</span>
                      </div>
                    ) : manualStaticHtmlEvidenceReview ? (
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4 xl:grid-cols-2">
                        <span>Total: {manualStaticHtmlEvidenceReview.counts.totalUrls}</span>
                        <span>Derived: {manualStaticHtmlEvidenceReview.counts.evidenceProducedUrls}</span>
                        <span>Failed: {manualStaticHtmlEvidenceReview.counts.failedUrls}</span>
                        <span>Skipped: {manualStaticHtmlEvidenceReview.counts.skippedUrls}</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4 xl:grid-cols-2">
                        <span>Found: {getStatValue(run, "tools_found")}</span>
                        <span>New: {getStatValue(run, "tools_new")}</span>
                        <span>Dupes: {getStatValue(run, "tools_duplicates")}</span>
                        <span>Errors: {getStatValue(run, "errors")}</span>
                      </div>
                    )}

                    <div className="text-xs leading-5 text-slate-600">
                      <p>Started: {formatDate(run.started_at)}</p>
                      <p>Finished: {formatDate(run.finished_at)}</p>
                    </div>

                    <p className="line-clamp-3 text-xs leading-5 text-slate-500">
                      {manualMetadataFetchReview
                        ? manualMetadataFetchReview.counts.failedUrls > 0
                          ? "Metadata fetch failure recorded."
                          : "—"
                        : manualStaticHtmlEvidenceReview
                          ? manualStaticHtmlEvidenceReview.counts.allFailed
                            ? "Completed with safe all-failed results."
                            : manualStaticHtmlEvidenceReview.counts.failedUrls > 0
                              ? "Static evidence failure recorded safely."
                              : "—"
                        : run.error_log || "—"}
                    </p>

                    {reviewPanelId ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setExpandedRunId((current) =>
                            current === run.id ? null : run.id
                          )
                        }
                        aria-expanded={isExpanded}
                        aria-controls={reviewPanelId}
                        className="w-full rounded-xl"
                      >
                        {isExpanded ? "Hide results" : "Review results"}
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">—</span>
                    )}
                  </div>

                  {manualMetadataFetchReview && isExpanded ? (
                    <ManualMetadataFetchResultsReview
                      panelId={manualMetadataFetchPanelId}
                      run={run}
                      review={manualMetadataFetchReview}
                    />
                  ) : manualStaticHtmlEvidenceReview && isExpanded ? (
                    <ManualStaticHtmlEvidenceResultsReview
                      panelId={manualStaticHtmlEvidencePanelId}
                      run={run}
                      review={manualStaticHtmlEvidenceReview}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-slate-500">
          Showing {runs.length} of {pagination.total} runs
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousPage}
            disabled={pagination.page <= 1 || isLoading}
            className="rounded-xl"
          >
            Previous
          </Button>
          <span className="text-xs font-bold text-slate-500">
            Page {pagination.page}
            {pagination.totalPages ? ` of ${pagination.totalPages}` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={goToNextPage}
            disabled={
              isLoading ||
              pagination.totalPages === 0 ||
              pagination.page >= pagination.totalPages
            }
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
