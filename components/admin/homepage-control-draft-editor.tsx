"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type PresetOption = {
  id: string;
  label: string;
  description: string;
};

type ChecklistEditorItem = {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  completed: boolean;
};

type DraftEditorInitialValues = {
  layoutPreset: string;
  densityPreset: string;
  heroTitle: string;
  heroSubtitle: string;
  checklist: ChecklistEditorItem[];
};

type DraftUpdateResponse = {
  success?: boolean;
  errors?: string[];
  warnings?: string[];
};

type HomepageControlDraftEditorProps = {
  configId: string;
  initialValues: DraftEditorInitialValues;
  layoutOptions: PresetOption[];
  densityOptions: PresetOption[];
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

export default function HomepageControlDraftEditor({
  configId,
  initialValues,
  layoutOptions,
  densityOptions,
}: HomepageControlDraftEditorProps) {
  const router = useRouter();
  const [layoutPreset, setLayoutPreset] = useState(initialValues.layoutPreset);
  const [densityPreset, setDensityPreset] = useState(initialValues.densityPreset);
  const [heroTitle, setHeroTitle] = useState(initialValues.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(initialValues.heroSubtitle);
  const [checklist, setChecklist] = useState(initialValues.checklist);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function updateChecklistItem(id: string, completed: boolean) {
    setChecklist((items) =>
      items.map((item) => (item.id === id ? { ...item, completed } : item))
    );
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const confirmed = window.confirm(
      "Save this Homepage Control Room draft? This will not publish or affect the live homepage."
    );

    if (!confirmed) return;

    setIsSaving(true);
    setMessage("");
    setErrors([]);
    setWarnings([]);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(
        `/api/admin/homepage-control/drafts/${configId}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            layoutPreset,
            densityPreset,
            heroTitle,
            heroSubtitle,
            checklist: checklist.map((item) => ({
              id: item.id,
              completed: item.completed,
            })),
          }),
        }
      );
      const result = (await response.json().catch(() => null)) as
        | DraftUpdateResponse
        | null;

      if (!response.ok || !result?.success) {
        setErrors(result?.errors || ["Unable to save draft."]);
        setWarnings(result?.warnings || []);
        return;
      }

      setMessage("Draft saved.");
      setWarnings(result.warnings || []);
      router.refresh();
    } catch (error: unknown) {
      setErrors([
        error instanceof Error ? error.message : "Unable to save draft.",
      ]);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={saveDraft} className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">Visual presets</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Layout preset
            </span>
            <select
              value={layoutPreset}
              onChange={(event) => setLayoutPreset(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {layoutOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {layoutOptions.find((option) => option.id === layoutPreset)
                ?.description || "Approved layout preset."}
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Density preset
            </span>
            <select
              value={densityPreset}
              onChange={(event) => setDensityPreset(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {densityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {densityOptions.find((option) => option.id === densityPreset)
                ?.description || "Approved density preset."}
            </p>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">Hero content</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Hero title
            </span>
            <input
              type="text"
              value={heroTitle}
              maxLength={90}
              onChange={(event) => setHeroTitle(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Hero subtitle
            </span>
            <textarea
              value={heroSubtitle}
              maxLength={220}
              rows={4}
              onChange={(event) => setHeroSubtitle(event.target.value)}
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-950">
          Pre-publish checklist
        </h2>
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
      </section>

      {(errors.length > 0 || warnings.length > 0 || message) && (
        <section className="space-y-2 text-sm">
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
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSaving ? "Saving..." : "Save Draft"}
        </button>
        <p className="text-sm text-slate-600">
          Saving updates the draft only. It does not publish or activate the
          homepage config.
        </p>
      </div>
    </form>
  );
}
