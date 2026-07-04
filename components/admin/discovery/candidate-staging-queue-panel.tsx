"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getCandidateQueueFailClosedPresentation } from "../../../lib/discovery/discovery-candidate-queue-fail-closed-presentation";

import { CandidateStagingQueueDetailDrawer } from "./candidate-staging-queue-detail-drawer";

const CANDIDATE_STAGING_QUEUE_API_PATH =
  "/api/admin/discovery/candidate-staging-queue";

const ACTIVE_STATUSES = [
  "staged",
  "needs_review",
  "duplicate_suspected",
] as const;

const STATUS_LABELS: Record<CandidateStatus, string> = {
  staged: "Staged",
  needs_review: "Needs review",
  duplicate_suspected: "Duplicate suspected",
};

const LIMIT_OPTIONS = [10, 25, 50] as const;
const SORT_KEYS = ["created_at", "updated_at", "confidence_bucket"] as const;
const SORT_DIRECTIONS = ["desc", "asc"] as const;

const SAFE_ERROR_CODES = new Set([
  "invalid_status_filter",
  "invalid_limit",
  "candidate_queue_invalid_cursor",
  "candidate_queue_cursor_mismatch",
  "candidate_queue_cursor_version_unsupported",
  "invalid_sort_key",
  "invalid_sort_direction",
  "invalid_uuid_filter",
  "candidate_queue_read_failed",
  "unauthorized",
  "forbidden",
]);

export type CandidateStatus = (typeof ACTIVE_STATUSES)[number];
type QueueSortKey = (typeof SORT_KEYS)[number];
type QueueSortDirection = (typeof SORT_DIRECTIONS)[number];

export type CandidateStagingQueueItem = {
  candidateId: string;
  candidateName: string;
  candidateStatus: CandidateStatus;
  candidateWebsiteUrl: string;
  candidateCategoryHint: string | null;
  candidatePricingHint: string | null;
  candidateDescription: string | null;
  confidenceBucket: string | null;
  duplicateCheckStatus: string | null;
  duplicateSignalTypes: string[];
  riskFlags: string[];
  discoverySourceId: string | null;
  discoveryRunId: string;
  auditCorrelationId: string;
  sourceUrl: string;
  sourceDomain: string | null;
  sourceEvidenceKind: string;
  sourceEvidenceLocator: string;
  createdAt: string;
  updatedAt: string;
};

type CandidateQueueSuccessResponse = {
  ok: true;
  items: CandidateStagingQueueItem[];
  appliedStatuses: CandidateStatus[];
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
  sortKey: QueueSortKey;
  sortDirection: QueueSortDirection;
  totalCount?: number;
};

type CandidateQueueErrorResponse = {
  ok: false;
  error?: {
    code?: string;
  };
};

type CandidateQueueResponse =
  | CandidateQueueSuccessResponse
  | CandidateQueueErrorResponse;

function formatValue(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed || "Not provided";
}

function formatStatusLabel(status: CandidateStatus) {
  return STATUS_LABELS[status] || status;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Date unavailable";
  }
}

function formatOptionLabel(value: string) {
  return value
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

function getSafeHostname(value: string | null | undefined) {
  const safeUrl = getSafeHttpsUrl(value);

  if (!safeUrl) return "Link unavailable";

  try {
    return new URL(safeUrl).hostname;
  } catch {
    return "Link unavailable";
  }
}

function SafeExternalLink({
  value,
  label,
}: {
  value: string | null | undefined;
  label: string;
}) {
  const safeUrl = getSafeHttpsUrl(value);

  if (!safeUrl) {
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
        HTTPS link unavailable
      </span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 transition hover:bg-cyan-100"
    >
      {label}
    </a>
  );
}

function StatusBadge({ item }: { item: CandidateStagingQueueItem }) {
  const presentation = getCandidateQueueFailClosedPresentation({
    candidate_status: item.candidateStatus,
  });

  const badgeClass =
    presentation.statusPresentationSeverity === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : presentation.statusPresentationSeverity === "blocked"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div
      className="max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700"
      data-phase="22ao-e-fail-closed-status-presentation"
    >
      <span
        className={`inline-flex w-fit rounded-full border px-2.5 py-1 font-bold ${badgeClass}`}
        aria-label={`Candidate queue status: ${presentation.statusPresentationLabel}`}
      >
        {presentation.statusPresentationLabel}
      </span>
      <p className="mt-2 font-semibold text-slate-700">
        {presentation.statusPresentationHelperText}
      </p>
      <p className="mt-2 font-bold text-slate-800" role="note">
        {presentation.operatorWarningText}
      </p>
      <p className="mt-1 text-slate-600">
        Disabled reason: {formatOptionLabel(presentation.disabledReason)}
      </p>
    </div>
  );
}

function MetadataPill({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <span className="inline-flex max-w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
      <span className="shrink-0 text-slate-500">{label}:&nbsp;</span>
      <span className="truncate">{formatValue(value)}</span>
    </span>
  );
}

export function CandidateStagingQueuePanel() {
  const [items, setItems] = useState<CandidateStagingQueueItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateStagingQueueItem | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<CandidateStatus[]>([
    ...ACTIVE_STATUSES,
  ]);
  const [search, setSearch] = useState("");
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState("");
  const [confidenceBucket, setConfidenceBucket] = useState("");
  const [discoverySourceId, setDiscoverySourceId] = useState("");
  const [discoveryRunId, setDiscoveryRunId] = useState("");
  const [auditCorrelationId, setAuditCorrelationId] = useState("");
  const [limit, setLimit] = useState<(typeof LIMIT_OPTIONS)[number]>(25);
  const [sortKey, setSortKey] = useState<QueueSortKey>("created_at");
  const [sortDirection, setSortDirection] =
    useState<QueueSortDirection>("desc");
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const selectedStatusSet = useMemo(
    () => new Set<CandidateStatus>(selectedStatuses),
    [selectedStatuses],
  );

  const buildQueueUrl = useCallback((cursorOverride?: string | null) => {
    const params = new URLSearchParams();

    params.set("statuses", selectedStatuses.join(","));
    params.set("limit", String(limit));
    params.set("sortKey", sortKey);
    params.set("sortDirection", sortDirection);

    const trimmedSearch = search.trim();
    const trimmedDuplicateCheckStatus = duplicateCheckStatus.trim();
    const trimmedConfidenceBucket = confidenceBucket.trim();
    const trimmedDiscoverySourceId = discoverySourceId.trim();
    const trimmedDiscoveryRunId = discoveryRunId.trim();
    const trimmedAuditCorrelationId = auditCorrelationId.trim();

    if (trimmedSearch) params.set("search", trimmedSearch);
    if (trimmedDuplicateCheckStatus) {
      params.set("duplicateCheckStatus", trimmedDuplicateCheckStatus);
    }
    if (trimmedConfidenceBucket) {
      params.set("confidenceBucket", trimmedConfidenceBucket);
    }
    if (trimmedDiscoverySourceId) {
      params.set("discoverySourceId", trimmedDiscoverySourceId);
    }
    if (trimmedDiscoveryRunId) {
      params.set("discoveryRunId", trimmedDiscoveryRunId);
    }
    if (trimmedAuditCorrelationId) {
      params.set("auditCorrelationId", trimmedAuditCorrelationId);
    }
    const cursor = cursorOverride === undefined ? currentCursor : cursorOverride;

    if (cursor) {
      params.set("cursor", cursor);
    }

    return `${CANDIDATE_STAGING_QUEUE_API_PATH}?${params.toString()}`;
  }, [
    auditCorrelationId,
    confidenceBucket,
    currentCursor,
    discoveryRunId,
    discoverySourceId,
    duplicateCheckStatus,
    limit,
    search,
    selectedStatuses,
    sortDirection,
    sortKey,
  ]);

  const loadQueue = useCallback(async (useFirstPage = false) => {
    setIsLoading(true);
    setErrorCode(null);

    try {
      const response = await fetch(buildQueueUrl(useFirstPage ? null : undefined), {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | CandidateQueueResponse
        | null;

      if (!response.ok || !payload?.ok) {
        const nextErrorCode = payload?.ok === false ? payload.error?.code : null;
        setErrorCode(
          nextErrorCode && SAFE_ERROR_CODES.has(nextErrorCode)
            ? nextErrorCode
            : "candidate_queue_read_failed",
        );
        setItems([]);
        setTotalCount(null);
        setNextCursor(null);
        setHasNextPage(false);
        return;
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
      setNextCursor(
        typeof payload.nextCursor === "string" && payload.nextCursor.length > 0
          ? payload.nextCursor
          : null,
      );
      setHasNextPage(Boolean(payload.hasNextPage && payload.nextCursor));
      setTotalCount(
        typeof payload.totalCount === "number" ? payload.totalCount : null,
      );
    } catch {
      setItems([]);
      setTotalCount(null);
      setNextCursor(null);
      setHasNextPage(false);
      setErrorCode("candidate_queue_read_failed");
    } finally {
      setIsLoading(false);
    }
  }, [buildQueueUrl]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadQueue();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadQueue]);

  function resetPagination() {
    setCurrentCursor(null);
    setNextCursor(null);
    setHasNextPage(false);
    setPageIndex(0);
  }

  function toggleStatus(status: CandidateStatus, checked: boolean) {
    resetPagination();
    setSelectedStatuses((current) => {
      if (checked) {
        return current.includes(status) ? current : [...current, status];
      }

      if (current.length === 1) {
        return current;
      }

      return current.filter((item) => item !== status);
    });
  }

  function resetFilters() {
    resetPagination();
    setSelectedStatuses([...ACTIVE_STATUSES]);
    setSearch("");
    setDuplicateCheckStatus("");
    setConfidenceBucket("");
    setDiscoverySourceId("");
    setDiscoveryRunId("");
    setAuditCorrelationId("");
    setLimit(25);
    setSortKey("created_at");
    setSortDirection("desc");
  }

  function closeDetailDrawer() {
    setSelectedCandidate(null);
  }

  function openDetailDrawer(candidate: CandidateStagingQueueItem) {
    setSelectedCandidate(candidate);
  }

  function goToNextPage() {
    if (isLoading || !hasNextPage || !nextCursor) {
      return;
    }

    setCurrentCursor(nextCursor);
    setNextCursor(null);
    setHasNextPage(false);
    setPageIndex((current) => current + 1);
  }

  function goBackToFirstPage() {
    if (isLoading || pageIndex === 0) {
      return;
    }

    resetPagination();
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
            Candidate Staging Queue
          </p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            Active staged candidates
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Candidate decisions are available only for staged rows and use a
            guarded review dialog.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQueue()}
          disabled={isLoading}
          className="inline-flex w-full justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-black text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-900">Search</span>
          <input
            value={search}
            onChange={(event) => {
              resetPagination();
              setSearch(event.target.value);
            }}
            maxLength={120}
            placeholder="Name, URL, or source domain"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-900">
            Duplicate check
          </span>
          <input
            value={duplicateCheckStatus}
            onChange={(event) => {
              resetPagination();
              setDuplicateCheckStatus(event.target.value);
            }}
            maxLength={120}
            placeholder="Optional status"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-900">
            Confidence bucket
          </span>
          <input
            value={confidenceBucket}
            onChange={(event) => {
              resetPagination();
              setConfidenceBucket(event.target.value);
            }}
            maxLength={120}
            placeholder="Optional bucket"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-900">Limit</span>
          <select
            value={limit}
            onChange={(event) => {
              resetPagination();
              setLimit(Number(event.target.value) as typeof limit);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500"
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_180px] xl:items-end">
        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <legend className="px-1 text-sm font-bold text-slate-900">
            Active statuses
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACTIVE_STATUSES.map((status) => (
              <label
                key={status}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={selectedStatusSet.has(status)}
                  onChange={(event) =>
                    toggleStatus(status, event.target.checked)
                  }
                  className="h-3.5 w-3.5"
                />
                {formatStatusLabel(status)}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            At least one active status remains selected.
          </p>
        </fieldset>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-900">Sort key</span>
          <select
            value={sortKey}
            onChange={(event) => {
              resetPagination();
              setSortKey(event.target.value as QueueSortKey);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500"
          >
            {SORT_KEYS.map((option) => (
              <option key={option} value={option}>
                {formatOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-900">
            Sort direction
          </span>
          <select
            value={sortDirection}
            onChange={(event) => {
              resetPagination();
              setSortDirection(event.target.value as QueueSortDirection);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500"
          >
            {SORT_DIRECTIONS.map((option) => (
              <option key={option} value={option}>
                {formatOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-black text-slate-950">
          Advanced read filters
        </summary>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-900">
              Discovery source ID
            </span>
            <input
              value={discoverySourceId}
              onChange={(event) => {
                resetPagination();
                setDiscoverySourceId(event.target.value);
              }}
              maxLength={120}
              placeholder="UUID"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-900">
              Discovery run ID
            </span>
            <input
              value={discoveryRunId}
              onChange={(event) => {
                resetPagination();
                setDiscoveryRunId(event.target.value);
              }}
              maxLength={120}
              placeholder="UUID"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-bold text-slate-900">
              Audit correlation ID
            </span>
            <input
              value={auditCorrelationId}
              onChange={(event) => {
                resetPagination();
                setAuditCorrelationId(event.target.value);
              }}
              maxLength={120}
              placeholder="UUID"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500"
            />
          </label>
        </div>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Reset filters
        </button>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
          Showing {items.length}
          {totalCount !== null ? ` of ${totalCount}` : ""} candidates
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
          Page {pageIndex + 1}
        </span>
        <button
          type="button"
          onClick={goBackToFirstPage}
          disabled={isLoading || pageIndex === 0}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Back to first page
        </button>
        <button
          type="button"
          onClick={goToNextPage}
          disabled={isLoading || !hasNextPage || !nextCursor}
          className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-black text-cyan-800 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Next page
        </button>
      </div>

      {isLoading ? (
        <p
          className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-800"
          aria-live="polite"
        >
          Loading candidate staging queue...
        </p>
      ) : errorCode ? (
        <div
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <p className="text-sm font-black text-red-800">
            Candidate staging queue could not be loaded.
          </p>
          <p className="mt-2 text-xs leading-5 text-red-700">
            Safe error code: {errorCode}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">
            No active staged candidates found.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Try refreshing or adjusting the active read filters.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <article
              key={item.candidateId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-black text-slate-950">
                        {item.candidateName}
                      </h3>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {getSafeHostname(item.candidateWebsiteUrl)}
                      </p>
                    </div>
                    <StatusBadge item={item} />
                  </div>

                  {item.candidateDescription && (
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.candidateDescription}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <SafeExternalLink
                      value={item.candidateWebsiteUrl}
                      label="Open website"
                    />
                    <SafeExternalLink value={item.sourceUrl} label="Open source" />
                    <button
                      type="button"
                      onClick={() => openDetailDrawer(item)}
                      className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      View details
                    </button>
                    <span
                      className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600"
                      aria-label="Candidate decision actions disabled"
                    >
                      Decision actions disabled by fail-closed presentation.
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:block lg:space-y-2">
                  <MetadataPill
                    label="Category"
                    value={item.candidateCategoryHint}
                  />
                  <MetadataPill
                    label="Pricing"
                    value={item.candidatePricingHint}
                  />
                  <MetadataPill
                    label="Confidence"
                    value={item.confidenceBucket}
                  />
                </div>

                <div className="flex flex-wrap gap-2 lg:block lg:space-y-2">
                  <MetadataPill
                    label="Duplicate check"
                    value={item.duplicateCheckStatus}
                  />
                  <MetadataPill label="Source" value={item.sourceDomain} />
                  <MetadataPill
                    label="Updated"
                    value={formatDate(item.updatedAt)}
                  />
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-sm font-black text-slate-950">
                  Read-only metadata
                </summary>

                <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Candidate ID:</span>{" "}
                    {item.candidateId}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Discovery source ID:</span>{" "}
                    {formatValue(item.discoverySourceId)}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Discovery run ID:</span>{" "}
                    {item.discoveryRunId}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Audit correlation ID:</span>{" "}
                    {item.auditCorrelationId}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Evidence kind:</span>{" "}
                    {item.sourceEvidenceKind}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Evidence locator:</span>{" "}
                    {item.sourceEvidenceLocator}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Created:</span>{" "}
                    {formatDate(item.createdAt)}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">
                      Duplicate signals:
                    </span>{" "}
                    {item.duplicateSignalTypes.length > 0
                      ? item.duplicateSignalTypes.join(", ")
                      : "None"}
                  </p>
                  <p className="break-all">
                    <span className="font-bold text-slate-800">Risk flags:</span>{" "}
                    {item.riskFlags.length > 0 ? item.riskFlags.join(", ") : "None"}
                  </p>
                </div>
              </details>
            </article>
          ))}
        </div>
      )}

      <CandidateStagingQueueDetailDrawer
        candidate={selectedCandidate}
        open={selectedCandidate !== null}
        onOpenChange={(open) => {
          if (!open) closeDetailDrawer();
        }}
      />
    </section>
  );
}
