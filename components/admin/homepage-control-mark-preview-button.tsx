"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MarkPreviewResponse = {
  success?: boolean;
  errors?: string[];
  warnings?: string[];
};

type HomepageControlMarkPreviewButtonProps = {
  configId: string;
  label: string;
};

function getStringField(value: unknown, key: string) {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return "";
  }

  const record = value as Record<string, unknown>;
  const field = record[key];

  return typeof field === "string" ? field : "";
}

async function fetchCsrfToken() {
  const response = await fetch("/api/admin/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);
  const csrfToken = getStringField(result, "csrfToken");
  const errorMessage = getStringField(result, "error");

  if (!response.ok || !csrfToken) {
    throw new Error(errorMessage || "Unable to prepare secure admin action.");
  }

  return csrfToken;
}

export default function HomepageControlMarkPreviewButton({
  configId,
  label,
}: HomepageControlMarkPreviewButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function moveToPreview() {
    const confirmed = window.confirm(
      "Move this Homepage Control Room draft to preview? This will not publish or affect the live homepage."
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    setMessage("");
    setErrors([]);
    setWarnings([]);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(
        `/api/admin/homepage-control/drafts/${configId}/mark-preview`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "x-csrf-token": csrfToken,
          },
        }
      );
      const result = (await response.json().catch(() => null)) as
        | MarkPreviewResponse
        | null;

      if (!response.ok || !result?.success) {
        setErrors(result?.errors || ["Unable to move draft to preview."]);
        setWarnings(result?.warnings || []);
        return;
      }

      setMessage("Draft moved to preview.");
      setWarnings(result.warnings || []);
      router.refresh();
    } catch (error: unknown) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Unable to move draft to preview.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <button
        type="button"
        onClick={moveToPreview}
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Moving..." : label}
      </button>

      {(errors.length > 0 || warnings.length > 0 || message) && (
        <div className="max-w-sm rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          {message && <p className="font-semibold text-emerald-700">{message}</p>}
          {errors.length > 0 && (
            <ul className="list-disc space-y-1 pl-4 text-red-700">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <ul className="list-disc space-y-1 pl-4 text-amber-700">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}