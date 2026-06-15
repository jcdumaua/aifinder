import Link from "next/link";
import { notFound } from "next/navigation";
import HomepageControlMarkPreviewButton from "../../../../components/admin/homepage-control-mark-preview-button";
import HomepageControlPublishButton from "../../../../components/admin/homepage-control-publish-button";
import {
  getHomepageControlConfigById,
  getHomepageControlPreviewChecklist,
} from "../../../../lib/homepage-control-admin";
import type {
  HomepageControlChecklistItem,
  HomepageControlConfigRow,
} from "../../../../lib/homepage-control-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: string) {
  if (status === "published") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "preview") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (status === "archived") {
    return "bg-gray-100 text-gray-600 ring-gray-200";
  }

  return "bg-amber-50 text-amber-700 ring-amber-200";
}

function jsonSummary(value: unknown) {
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (value && typeof value === "object") {
    const count = Object.keys(value).length;
    return `${count} field${count === 1 ? "" : "s"}`;
  }

  return "No structured data";
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-950">{label}</h2>
      </div>
      <pre className="max-h-96 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words p-4 text-xs leading-5 text-slate-700 sm:p-5">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function Checklist({ config }: { config: HomepageControlConfigRow }) {
  if (config.pre_publish_checklist.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No pre-publish checklist items are configured.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm">
      {config.pre_publish_checklist.map((item) => (
        <div
          key={item.id}
          className="grid gap-3 p-4 text-sm sm:grid-cols-[1fr_120px] sm:p-5"
        >
          <div>
            <p className="font-semibold text-slate-950">{item.label}</p>
            {item.description && (
              <p className="mt-1 text-slate-600">{item.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {item.required ? "Required" : "Optional"}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.completed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {item.completed ? "Complete" : "Open"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistStatusSummary({
  config,
  checklist,
  completedAt,
}: {
  config: HomepageControlConfigRow;
  checklist: HomepageControlChecklistItem[];
  completedAt: string | null;
}) {
  const requiredItems = checklist.filter((item) => item.required);
  const completedRequiredItems = requiredItems.filter((item) => item.completed);
  const isPreview = config.status === "preview";
  const qaStatusDescription =
    config.status === "published"
      ? "Preview checklist completed before publish."
      : isPreview
        ? "Preview checklist progress for this config."
        : "Preview checklist becomes available after moving this config to preview.";
  const isComplete =
    requiredItems.length > 0 &&
    completedRequiredItems.length === requiredItems.length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">QA status</h2>
          <p className="mt-1 text-sm text-slate-600">
            {qaStatusDescription}
          </p>
          {completedAt && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Completed: {formatDate(completedAt)}
            </p>
          )}
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
            isComplete
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {completedRequiredItems.length}/{requiredItems.length} required
        </span>
      </div>

      {isPreview && (
        <Link
          href={`/admin/homepage-control/${config.id}/preview`}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
        >
          Complete QA on Preview Page
        </Link>
      )}
    </section>
  );
}

function NoticeList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "error" | "warning";
}) {
  if (items.length === 0) return null;

  const className =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <section className={`rounded-xl border p-4 text-sm ${className}`}>
      <h2 className="font-bold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function AdminHomepageControlDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const result = await getHomepageControlConfigById(id);

  if (!result.config) {
    notFound();
  }

  const config = result.config;
  const previewChecklistResult = await getHomepageControlPreviewChecklist(
    config.id
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/admin/homepage-control"
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          Back to Homepage Control Room
        </Link>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Read-only config detail
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                Homepage Control Room Config v{config.version}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This view is read-only. It does not edit, publish, activate,
                delete, archive, or affect the live homepage.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center md:flex-col md:items-end">
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${statusClass(
                  config.status
                )}`}
              >
                {config.status}
              </span>
              {config.status === "draft" && (
                <>
                  <Link
                    href={`/admin/homepage-control/${config.id}/edit`}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Edit Draft
                  </Link>
                  <HomepageControlMarkPreviewButton
                    configId={config.id}
                    label="Move to Preview"
                  />
                </>
              )}
              {config.status === "preview" && (
                <HomepageControlPublishButton configId={config.id} />
              )}
              {(config.status === "draft" ||
                config.status === "preview" ||
                config.status === "published") && (
                <Link
                  href={`/admin/homepage-control/${config.id}/preview`}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  Preview
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <DetailCard label="Version" value={`v${config.version}`} />
          <DetailCard
            label="Status"
            value={config.status}
          />
          <DetailCard
            label="Active state"
            value={config.is_active ? "Active" : "Inactive"}
          />
          <DetailCard label="Published" value={formatDate(config.published_at)} />
          <DetailCard label="Updated" value={formatDate(config.updated_at)} />
        </section>

        <NoticeList
          title="Validation errors"
          items={[...result.errors, ...config.validation_errors]}
          tone="error"
        />
        <NoticeList
          title="Validation warnings"
          items={[
            ...result.warnings,
            ...previewChecklistResult.warnings,
            ...config.validation_warnings,
          ]}
          tone="warning"
        />
        <NoticeList
          title="Preview checklist errors"
          items={previewChecklistResult.errors}
          tone="error"
        />

        <section className="grid gap-4 md:grid-cols-3">
          <DetailCard label="Config summary" value={jsonSummary(config.config)} />
          <DetailCard label="Content summary" value={jsonSummary(config.content)} />
          <DetailCard
            label="Tool placements"
            value={jsonSummary(config.tool_placements)}
          />
        </section>

        <ChecklistStatusSummary
          config={config}
          checklist={previewChecklistResult.checklist}
          completedAt={previewChecklistResult.run?.completed_at || null}
        />

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-bold">Pre-publish checklist</h2>
            <p className="mt-1 text-sm text-slate-600">
              Checklist state is displayed for review only.
            </p>
          </div>
          <Checklist config={config} />
        </section>

        <section>
          <div className="mb-3">
            <h2 className="text-lg font-bold">Technical Details</h2>
            <p className="mt-1 text-sm text-slate-600">
              Raw JSON is formatted for inspection and kept in scrollable
              blocks to protect small screens.
            </p>
          </div>
          <div className="grid gap-4">
            <JsonBlock label="Config JSON" value={config.config} />
            <JsonBlock label="Content JSON" value={config.content} />
            <JsonBlock
              label="Tool placements JSON"
              value={config.tool_placements}
            />
            <JsonBlock
              label="Pre-publish checklist JSON"
              value={config.pre_publish_checklist}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
