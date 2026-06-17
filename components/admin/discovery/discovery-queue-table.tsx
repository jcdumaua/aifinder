"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";

type DiscoveredTool = {
  id: string;
  name: string | null;
  website: string | null;
  category: string | null;
  status: string | null;
  discovery_score: number | null;
  created_at: string | null;
};

type PaginationData = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "pending_review", label: "Pending Review" },
  { value: "rejected", label: "Rejected" },
  { value: "ignored", label: "Ignored" },
  { value: "duplicate", label: "Duplicate" },
];

function formatDate(value: string | null) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString();
}

function formatScore(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  const normalized = value <= 1 ? value * 100 : value;

  return `${Math.round(normalized)}%`;
}

function getStatusStyle(status: string | null) {
  const styles: Record<string, string> = {
    new: "border-cyan-200 bg-cyan-50 text-cyan-700",
    pending_review: "border-amber-200 bg-amber-50 text-amber-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
    ignored: "border-slate-200 bg-slate-50 text-slate-600",
    duplicate: "border-violet-200 bg-violet-50 text-violet-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return styles[status || "new"] || styles.new;
}

export function DiscoveryQueueTable() {
  const [tools, setTools] = useState<DiscoveredTool[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/admin/discovery/discovered-tools?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load discovery queue.");
      }

      const result = await response.json();

      setTools(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load discovery queue."
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTools();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTools]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Discovered Tools Queue
          </h2>
          <p className="text-sm text-slate-500">
            Review candidates found by the Discovery Engine.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-cyan-500"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {pagination && (
        <p className="mb-3 text-xs font-semibold text-slate-500">
          Showing {tools.length} of {pagination.total} candidates
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[1.2fr_1fr_90px_140px_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 xl:grid">
          <span>Name / Website</span>
          <span>Category</span>
          <span>Score</span>
          <span>Status</span>
          <span>Found</span>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center text-red-600">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchTools}
              className="text-xs font-black uppercase tracking-widest underline"
            >
              Retry
            </button>
          </div>
        ) : tools.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">
            No discovered tools found for this filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tools.map((tool) => (
              <article
                key={tool.id}
                className="grid gap-3 px-5 py-4 text-sm xl:grid-cols-[1.2fr_1fr_90px_140px_120px] xl:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/discovery/tools/${tool.id}`}
                    className="truncate font-black text-slate-950 hover:text-cyan-700"
                  >
                    {tool.name || "Unnamed candidate"}
                  </Link>

                  {tool.website ? (
                    <a
                      href={tool.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex max-w-fit items-center gap-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                    >
                      <span className="max-w-[220px] truncate">
                        {tool.website}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No website</p>
                  )}
                </div>

                <div>
                  <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                    {tool.category || "Uncategorized"}
                  </span>
                </div>

                <div className="font-mono text-xs font-bold text-slate-600">
                  {formatScore(tool.discovery_score)}
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${getStatusStyle(
                      tool.status
                    )}`}
                  >
                    {(tool.status || "new").replace("_", " ")}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-500">
                  {formatDate(tool.created_at)}
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-950 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <span className="text-xs font-bold text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(pagination.totalPages, currentPage + 1)
                )
              }
              disabled={page >= pagination.totalPages || loading}
              className="flex items-center gap-1 text-xs font-black text-slate-600 hover:text-slate-950 disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
