"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HomepageControlChecklistItem } from "../../lib/homepage-control-types";

type PreviewChecklistResponse = {
  success?: boolean;
  data?: {
    checklist?: HomepageControlChecklistItem[];
    completed_at?: string | null;
  } | null;
  errors?: string[];
  warnings?: string[];
};

type HomepageControlPreviewChecklistProps = {
  configId: string;
  initialChecklist: HomepageControlChecklistItem[];
  completedAt: string | null;
};

async function fetchCsrfToken() {
  const response = await fetch("/api/admin/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });
  const result: unknown = await response.json().catch(() => null);

  if (
    !response.ok ||
    typeof result !== "object" ||
    result === null ||
    !("csrfToken" in result) ||
    typeof result.csrfToken !== "string"
  ) {
    throw new Error(
      typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
        ? result.error
        : "Unable to prepare secure admin action."
    );
  }

  return result.csrfToken;
}

function formatCompletedAt(value: string | null) {
  if (!value) return "Not complete";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Completion date unavailable";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function HomepageControlPreviewChecklist({
  configId,
  initialChecklist,
  completedAt,
}: HomepageControlPreviewChecklistProps) {
  const router = useRouter();
  const [checklist, setChecklist] = useState(initialChecklist);
  const [lastCompletedAt, setLastCompletedAt] = useState(completedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const requiredCount = checklist.filter((item) => item.required).length;
  const completedRequiredCount = checklist.filter(
    (item) => item.required && item.completed
  ).length;
  const isComplete = requiredCount > 0 && completedRequiredCount === requiredCount;

  function updateChecklistItem(id: string, completed: boolean) {
    setChecklist((items) =>
      items.map((item) => (item.id === id ? { ...item, completed } : item))
    );
  }

  async function saveChecklist() {
    setIsSaving(true);
    setMessage("");
    setErrors([]);
    setWarnings([]);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(
        `/api/admin/homepage-control/drafts/${configId}/preview-checklist`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            checklist: checklist.map((item) => ({
              id: item.id,
              completed: item.completed,
            })),
          }),
        }
      );
      const result = (await response.json().catch(() => null)) as
        | PreviewChecklistResponse
        | null;

      if (!response.ok || !result?.success) {
        setErrors(result?.errors || ["Unable to save preview checklist."]);
        setWarnings(result?.warnings || []);
        return;
      }

      if (Array.isArray(result.data?.checklist)) {
        setChecklist(result.data.checklist);
      }

      setLastCompletedAt(result.data?.completed_at || null);
      setMessage("Preview checklist saved.");
      setWarnings(result.warnings || []);
      router.refresh();
    } catch (error: unknown) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Unable to save preview checklist.",
      ]);
    } finally {
      setIsSaving(false);
    }
  }

  if (checklist.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        No preview checklist items are configured.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Preview checklist
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Complete these review checks from the preview before publishing.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
            isComplete
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {completedRequiredCount}/{requiredCount} required
        </span>
      </div>

      <div className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200">
        {checklist.map((item) => (
          <label
            key={item.id}
            className="flex gap-3 p-4 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(event) =>
                updateChecklistItem(item.id, event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
            />
            <span>
              <span className="font-semibold text-slate-950">
                {item.label}
              </span>
              {item.required && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Required
                </span>
              )}
              {item.description && (
                <span className="mt-1 block text-slate-600">
                  {item.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={saveChecklist}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSaving ? "Saving..." : "Save Preview Checklist"}
        </button>
        <p className="text-sm text-slate-600">
          Status: {formatCompletedAt(lastCompletedAt)}
        </p>
      </div>

      {(message || errors.length > 0 || warnings.length > 0) && (
        <div className="mt-4 space-y-2 text-sm">
          {message && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
              {message}
            </p>
          )}
          {errors.map((error) => (
            <p
              key={error}
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
            >
              {error}
            </p>
          ))}
          {warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800"
            >
              {warning}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
