"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DraftResponse = {
  success?: boolean;
  errors?: string[];
  warnings?: string[];
};

async function fetchCsrfToken() {
  const response = await fetch("/api/admin/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || typeof result?.csrfToken !== "string") {
    throw new Error(
      result?.error || "Unable to prepare secure admin action."
    );
  }

  return result.csrfToken;
}

export default function HomepageControlCreateDraftButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function createDraft() {
    const confirmed = window.confirm(
      "Create a new Homepage Control Room draft? This will not affect the live homepage."
    );

    if (!confirmed) return;

    setIsCreating(true);
    setMessage("");
    setWarnings([]);
    setError("");

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch("/api/admin/homepage-control/drafts", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });

      const result = (await response.json().catch(() => null)) as
        | DraftResponse
        | null;

      if (!response.ok || !result?.success) {
        setError(
          result?.errors?.[0] || "Unable to create Homepage Control Room draft."
        );
        setWarnings(result?.warnings || []);
        return;
      }

      setMessage("Homepage draft created.");
      setWarnings(result.warnings || []);
      router.refresh();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create Homepage Control Room draft."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={createDraft}
        disabled={isCreating}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isCreating ? "Creating..." : "Create Homepage Draft"}
      </button>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {warnings.length > 0 && (
        <div className="space-y-1 text-sm text-amber-700">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
    </div>
  );
}
