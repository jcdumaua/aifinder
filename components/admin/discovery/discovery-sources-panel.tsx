"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DiscoverySourceType = "rss" | "api" | "scraper" | "manual" | "webhook";
type SourceTypeFilter = "all" | DiscoverySourceType;
type ActiveFilter = "all" | "active" | "inactive";

type DiscoverySource = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  url: string | null;
  source_type: DiscoverySourceType;
  config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

type SourcesResponse = {
  data: DiscoverySource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const SOURCE_TYPE_OPTIONS: { value: DiscoverySourceType; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "rss", label: "RSS" },
  { value: "api", label: "API" },
  { value: "scraper", label: "Scraper" },
  { value: "webhook", label: "Webhook" },
];

function formatDateTime(value: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

async function getCsrfToken() {
  const response = await fetch("/api/admin/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || typeof payload.csrfToken !== "string") {
    throw new Error("Security token missing or expired. Please log in again.");
  }

  return payload.csrfToken as string;
}

function getConfigObject(configText: string) {
  const trimmed = configText.trim();

  if (!trimmed) {
    return {};
  }

  const parsed = JSON.parse(trimmed) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Config must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export function DiscoverySourcesPanel() {
  const [sources, setSources] = useState<DiscoverySource[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingSourceId, setUpdatingSourceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<DiscoverySourceType>("manual");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [configText, setConfigText] = useState('{\n  "source": "admin-ui"\n}');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pagination.limit),
    });

    if (sourceTypeFilter !== "all") {
      params.set("source_type", sourceTypeFilter);
    }

    if (activeFilter === "active") {
      params.set("is_active", "true");
    }

    if (activeFilter === "inactive") {
      params.set("is_active", "false");
    }

    return params.toString();
  }, [activeFilter, page, pagination.limit, sourceTypeFilter]);

  const fetchSources = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/discovery/sources?${queryString}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      const payload = (await response.json().catch(() => ({}))) as Partial<
        SourcesResponse & { error: string }
      >;

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load discovery sources.");
      }

      setSources(Array.isArray(payload.data) ? payload.data : []);
      setPagination(
        payload.pagination || {
          total: 0,
          page,
          limit: 10,
          totalPages: 0,
        }
      );
    } catch (error) {
      setSources([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load discovery sources."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, queryString]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSources();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSources]);

  function resetForm() {
    setName("");
    setSourceType("manual");
    setUrl("");
    setDescription("");
    setIsActive(true);
    setConfigText('{\n  "source": "admin-ui"\n}');
  }

  async function createSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const config = getConfigObject(configText);
      const csrfToken = await getCsrfToken();

      const response = await fetch("/api/admin/discovery/sources", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          name,
          source_type: sourceType,
          url: url.trim() || null,
          description,
          is_active: isActive,
          config,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to create discovery source.");
      }

      setSuccessMessage("Discovery source created.");
      resetForm();
      setPage(1);
      await fetchSources();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create discovery source."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleSource(source: DiscoverySource) {
    setUpdatingSourceId(source.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(`/api/admin/discovery/sources/${source.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          is_active: !source.is_active,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to update discovery source.");
      }

      setSuccessMessage(
        !source.is_active
          ? "Discovery source activated."
          : "Discovery source deactivated."
      );
      await fetchSources();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update discovery source."
      );
    } finally {
      setUpdatingSourceId(null);
    }
  }

  function changeSourceTypeFilter(value: SourceTypeFilter) {
    setSourceTypeFilter(value);
    setPage(1);
  }

  function changeActiveFilter(value: ActiveFilter) {
    setActiveFilter(value);
    setPage(1);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            Discovery Sources
          </p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-950">
            Source registry
          </h3>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Manage where discovery candidates come from before automated crawler
            jobs are enabled.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sourceTypeFilter}
            onChange={(event) =>
              changeSourceTypeFilter(event.target.value as SourceTypeFilter)
            }
            className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="all">All types</option>
            {SOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(event) =>
              changeActiveFilter(event.target.value as ActiveFilter)
            }
            className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          >
            <option value="all">All states</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <button
            type="button"
            onClick={() => void fetchSources()}
            disabled={isLoading}
            className="h-10 rounded-2xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      <form onSubmit={createSource} className="grid gap-4 py-5 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800">Source name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Manual Source"
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800">Source URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/feed"
            className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-800">Source type</span>
          <select
            value={sourceType}
            onChange={(event) =>
              setSourceType(event.target.value as DiscoverySourceType)
            }
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          >
            {SOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-end gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="mb-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">
              Active source
            </span>
            <span className="block text-xs text-slate-500">
              Active sources can be used by future crawler jobs.
            </span>
          </span>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-bold text-slate-800">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short admin-only source note."
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-bold text-slate-800">
            Config JSON
          </span>
          <textarea
            value={configText}
            onChange={(event) => setConfigText(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
          />
        </label>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            {errorMessage ? (
              <p className="text-sm font-semibold text-red-600">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="text-sm font-semibold text-emerald-700">
                {successMessage}
              </p>
            ) : null}
            <p className="text-xs text-slate-500">
              URLs must be HTTPS. Localhost, private IPs, and unsafe URLs are
              blocked by the API.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Creating..." : "Create Source"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.-cols-[1.4fr_0.8fr_0.7fr_0.9fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
          <span>Source</span>
          <span>Type</span>
          <span>Status</span>
          <span>Last Run</span>
          <span>Action</span>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Loading discovery sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No discovery sources found for this filter.
          </div>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="grid grid-cols-[1.4fr_0.8fr_0.7fr_0.9fr_0.8fr] gap-3 border-t border-slate-100 px-4 py-4 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-950">
                  {source.name}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {source.url || "No URL"}
                </p>
                {source.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {source.description}
                  </p>
                ) : null}
              </div>

              <div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-600">
                  {source.source_type}
                </span>
              </div>

              <div>
                <span
                  className={
                    source.is_active
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700"
                      : "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-500"
                  }
                >
                  {source.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-500">
                {formatDateTime(source.last_run_at)}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => void toggleSource(source)}
                  disabled={updatingSourceId === source.id}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-extrabold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingSourceId === source.id
                    ? "Updating..."
                    : source.is_active
                      ? "Deactivate"
                      : "Activate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {sources.length} of {pagination.total} sources
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-2xl border border-slate-200 px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="font-bold text-slate-600">
            Page {pagination.page || page} of {pagination.totalPages || 1}
          </span>
          <button
            type="button"
            disabled={
              isLoading ||
              pagination.totalPages === 0 ||
              page >= pagination.totalPages
            }
            onClick={() => setPage((current) => current + 1)}
            className="rounded-2xl border border-slate-200 px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
