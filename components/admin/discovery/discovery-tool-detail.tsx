"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

type DiscoveryToolDetailProps = {
  toolId: string;
};

type DetailPayload = {
  tool?: Record<string, unknown> | null;
  source?: Record<string, unknown> | null;
  run?: Record<string, unknown> | null;
  evidence?: Record<string, unknown>[];
  duplicateCandidates?: Record<string, unknown>[];
};

type TriageStatus = "pending_review" | "ignored" | "rejected";
type DuplicateCandidateType = "tool" | "submission" | "discovered_tool";
type DuplicateMatchType =
  | "canonical_url"
  | "normalized_domain"
  | "slug"
  | "exact_name"
  | "fuzzy_name";
type DiscoveryAdminAction = TriageStatus | "approve" | "duplicate";

const duplicateCandidateTypes: DuplicateCandidateType[] = [
  "tool",
  "submission",
  "discovered_tool",
];

const duplicateMatchTypes: DuplicateMatchType[] = [
  "canonical_url",
  "normalized_domain",
  "slug",
  "exact_name",
  "fuzzy_name",
];

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1] || "") : null;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
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

function DetailRow({ label, value }: { label: string; value: unknown }) {
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
  const [actionLoading, setActionLoading] = useState<DiscoveryAdminAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [duplicateCandidateType, setDuplicateCandidateType] =
    useState<DuplicateCandidateType>("tool");
  const [duplicateCandidateId, setDuplicateCandidateId] = useState("");
  const [duplicateMatchType, setDuplicateMatchType] =
    useState<DuplicateMatchType>("normalized_domain");
  const [duplicateMatchScore, setDuplicateMatchScore] = useState("100");
  const [duplicateReason, setDuplicateReason] = useState("");

  const detailUrl = useMemo(
    () => `/api/admin/discovery/discovered-tools/${encodeURIComponent(toolId)}`,
    [toolId]
  );

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(detailUrl, {
        headers: {
          Accept: "application/json",
        },
      });

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
  }, [detailUrl]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchDetail();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchDetail]);

  async function updateStatus(status: TriageStatus) {
    setActionMessage(null);

    let reason: string | null = null;

    if (status === "rejected") {
      const enteredReason = window.prompt(
        "Reason for rejecting this discovered tool?"
      );

      if (enteredReason === null) {
        return;
      }

      reason = enteredReason.trim();

      if (!reason) {
        setActionMessage("Reject reason is required.");
        return;
      }

      if (reason.length > 500) {
        setActionMessage("Reject reason must be 500 characters or less.");
        return;
      }
    }

    const csrfToken = getCookieValue("aifinder_admin_csrf_token");

    if (!csrfToken) {
      setActionMessage("Security token missing. Please refresh or log in again.");
      return;
    }

    setActionLoading(status);

    try {
      const response = await fetch(detailUrl, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          status,
          reason,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || "Failed to update discovered tool status."
        );
      }

      setActionMessage(`Status updated to ${status.replace("_", " ")}.`);
      await fetchDetail();
    } catch (updateError) {
      setActionMessage(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update discovered tool status."
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function approveDiscoveredTool() {
    setActionMessage(null);

    const confirmed = window.confirm(
      "Approve this discovered tool and add it to the live public tools table?"
    );

    if (!confirmed) {
      return;
    }

    const csrfToken = getCookieValue("aifinder_admin_csrf_token");

    if (!csrfToken) {
      setActionMessage("Security token missing. Please refresh or log in again.");
      return;
    }

    setActionLoading("approve");

    try {
      const response = await fetch(`${detailUrl}/approve`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-csrf-token": csrfToken,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to approve discovered tool.");
      }

      setActionMessage(
        `Approved and added to live tools. Tool ID: ${
          result?.data?.approvedToolId || "created"
        }.`
      );
      await fetchDetail();
    } catch (approveError) {
      setActionMessage(
        approveError instanceof Error
          ? approveError.message
          : "Failed to approve discovered tool."
      );
    } finally {
      setActionLoading(null);
    }
  }


  async function markDuplicateCandidate() {
    setActionMessage(null);

    const candidateId = duplicateCandidateId.trim();

    if (!candidateId) {
      setActionMessage("Candidate ID is required.");
      return;
    }

    const matchScore = Number(duplicateMatchScore);

    if (!Number.isFinite(matchScore) || matchScore < 0 || matchScore > 100) {
      setActionMessage("Match score must be between 0 and 100.");
      return;
    }

    const confirmed = window.confirm(
      "Mark this discovered tool as a duplicate and block approval?"
    );

    if (!confirmed) {
      return;
    }

    const csrfToken = getCookieValue("aifinder_admin_csrf_token");

    if (!csrfToken) {
      setActionMessage("Security token missing. Please refresh or log in again.");
      return;
    }

    const body: Record<string, unknown> = {
      candidate_type: duplicateCandidateType,
      match_type: duplicateMatchType,
      match_score: matchScore,
      reason: duplicateReason.trim() || null,
    };

    if (duplicateCandidateType === "tool") {
      body.candidate_tool_id = candidateId;
    }

    if (duplicateCandidateType === "submission") {
      body.candidate_submission_id = candidateId;
    }

    if (duplicateCandidateType === "discovered_tool") {
      body.candidate_discovered_tool_id = candidateId;
    }

    setActionLoading("duplicate");

    try {
      const response = await fetch(`${detailUrl}/duplicate`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to mark duplicate.");
      }

      setActionMessage("Duplicate candidate recorded and approval blocked.");
      await fetchDetail();
    } catch (duplicateError) {
      setActionMessage(
        duplicateError instanceof Error
          ? duplicateError.message
          : "Failed to mark duplicate."
      );
    } finally {
      setActionLoading(null);
    }
  }

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
  const source = data?.source || null;
  const run = data?.run || null;
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
  const currentStatus = typeof tool.status === "string" ? tool.status : null;
  const canApprove =
    currentStatus === "new" || currentStatus === "pending_review";
  const canMarkDuplicate =
    currentStatus === "new" || currentStatus === "pending_review";

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
          Phase 3E duplicate review
        </span>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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

          <div className="flex flex-wrap gap-2">
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
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Triage Actions
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Approve candidates into live tools or update review status safely.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void approveDiscoveredTool()}
                disabled={actionLoading !== null || !canApprove}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading === "approve"
                  ? "Approving..."
                  : "Approve to Live Tools"}
              </button>

              <button
                type="button"
                onClick={() => void updateStatus("pending_review")}
                disabled={actionLoading !== null}
                className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                {actionLoading === "pending_review"
                  ? "Updating..."
                  : "Mark Pending Review"}
              </button>

              <button
                type="button"
                onClick={() => void updateStatus("ignored")}
                disabled={actionLoading !== null}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-slate-400 disabled:opacity-50"
              >
                {actionLoading === "ignored" ? "Updating..." : "Ignore"}
              </button>

              <button
                type="button"
                onClick={() => void updateStatus("rejected")}
                disabled={actionLoading !== null}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:border-red-300 disabled:opacity-50"
              >
                {actionLoading === "rejected" ? "Updating..." : "Reject"}
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Mark as Duplicate
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-1 text-xs font-black text-slate-600">
                Candidate Type
                <select
                  value={duplicateCandidateType}
                  onChange={(event) =>
                    setDuplicateCandidateType(
                      event.target.value as DuplicateCandidateType
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  {duplicateCandidateTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs font-black text-slate-600">
                Candidate ID
                <input
                  value={duplicateCandidateId}
                  onChange={(event) => setDuplicateCandidateId(event.target.value)}
                  placeholder="Tool/submission ID or UUID"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>

              <label className="space-y-1 text-xs font-black text-slate-600">
                Match Type
                <select
                  value={duplicateMatchType}
                  onChange={(event) =>
                    setDuplicateMatchType(event.target.value as DuplicateMatchType)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  {duplicateMatchTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs font-black text-slate-600">
                Score
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={duplicateMatchScore}
                  onChange={(event) => setDuplicateMatchScore(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>

              <label className="space-y-1 text-xs font-black text-slate-600">
                Reason
                <input
                  value={duplicateReason}
                  onChange={(event) => setDuplicateReason(event.target.value)}
                  placeholder="Why this is a duplicate"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => void markDuplicateCandidate()}
              disabled={actionLoading !== null || !canMarkDuplicate}
              className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 hover:border-amber-400 disabled:opacity-50"
            >
              {actionLoading === "duplicate"
                ? "Marking Duplicate..."
                : "Record Duplicate Candidate"}
            </button>
          </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Status" value={tool.status} />
          <DetailRow label="Approved Tool ID" value={tool.approved_tool_id} />
          <DetailRow label="Rejected Reason" value={tool.rejected_reason} />
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
            Discovery Origin
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Source and run metadata for this discovered candidate.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <SafeJsonBlock value={{ source: source || null }} />
            <SafeJsonBlock value={{ run: run || null }} />
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
          This page supports approval into live tools, basic status triage,
          and duplicate candidate recording before approval.
        </p>
      </section>
    </div>
  );
}
