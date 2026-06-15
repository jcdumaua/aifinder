"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PublishResponse = {
  success?: boolean;
  errors?: string[];
  warnings?: string[];
};

type HomepageControlPublishButtonProps = {
  configId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringField(value: unknown, key: string) {
  if (!isRecord(value)) return "";

  const field = value[key];

  return typeof field === "string" ? field : "";
}

function getStringArrayField(value: unknown, key: string) {
  if (!isRecord(value) || !Array.isArray(value[key])) return [];

  return value[key].filter((item): item is string => typeof item === "string");
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

function buildHelpfulErrors(errors: string[]) {
  const guidance = new Set<string>();

  errors.forEach((error) => {
    const lowerError = error.toLowerCase();

    if (
      lowerError.includes("preview required") ||
      lowerError.includes("must be in preview")
    ) {
      guidance.add("This config must be in preview before it can be published.");
    }

    if (lowerError.includes("previewed") || lowerError.includes("preview audit")) {
      guidance.add("Visit the Preview page first so the preview audit event is recorded.");
    }

    if (lowerError.includes("checklist")) {
      guidance.add(
        "Complete and save required preview checklist items before publishing."
      );
    }
  });

  return [...errors, ...Array.from(guidance)];
}

export default function HomepageControlPublishButton({
  configId,
}: HomepageControlPublishButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function closeModal() {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setConfirmationText("");
    setMessage("");
    setErrors([]);
    setWarnings([]);
  }

  async function handlePublish() {
    if (confirmationText !== "PUBLISH") return;

    setIsSubmitting(true);
    setMessage("");
    setErrors([]);
    setWarnings([]);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(
        `/api/admin/homepage-control/drafts/${configId}/publish`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "x-csrf-token": csrfToken },
        }
      );
      const result: unknown = await response.json().catch(() => null);
      const publishResult: PublishResponse = {
        success: isRecord(result) && result.success === true,
        errors: getStringArrayField(result, "errors"),
        warnings: getStringArrayField(result, "warnings"),
      };
      const resultErrors = publishResult.errors || [];
      const resultWarnings = publishResult.warnings || [];

      if (!response.ok || !publishResult.success) {
        setErrors(
          buildHelpfulErrors(
            resultErrors.length > 0
              ? resultErrors
              : ["Failed to publish configuration."]
          )
        );
        setWarnings(resultWarnings);
        return;
      }

      setMessage("Homepage config marked active in the database.");
      setWarnings(resultWarnings);
      setConfirmationText("");
      router.refresh();
    } catch (error: unknown) {
      setErrors([
        error instanceof Error ? error.message : "Unable to publish configuration.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
      >
        Publish to Homepage
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-slate-950">
              Publish to Homepage
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will mark this config as active in the database. Public
              homepage wiring is not active yet. Publishing updates the active
              database record but will not change the live site yet.
            </p>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Live homepage will not change until public wiring is implemented.
              Continue only if this preview config has been reviewed and is ready
              to become the active database record.
            </div>

            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Type PUBLISH to confirm
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="PUBLISH"
                autoFocus
              />
            </div>

            {(message || errors.length > 0 || warnings.length > 0) && (
              <div className="mt-4 space-y-2 text-xs">
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

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting || confirmationText !== "PUBLISH"}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSubmitting ? "Publishing..." : "Confirm Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
