import { notFound } from "next/navigation";
import HomepagePreviewBanner from "../../../../../components/admin/homepage-preview-banner";
import HomepageControlPreviewChecklist from "../../../../../components/admin/homepage-control-preview-checklist";
import {
  getHomepageControlConfigById,
  getHomepageControlPreviewChecklist,
  hydrateHomepagePreviewToolPlacements,
  recordHomepageControlPreview,
  type HomepagePreviewToolPlacement,
} from "../../../../../lib/homepage-control-admin";
import {
  HOMEPAGE_DENSITY_PRESET_DETAILS,
  HOMEPAGE_LAYOUT_PRESET_DETAILS,
} from "../../../../../lib/homepage-control-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

function getPresetLabel(
  value: unknown,
  options: readonly { id: string; label: string }[],
  fallback: string
) {
  const text = getText(value);

  return options.find((option) => option.id === text)?.label || fallback;
}

function PreviewSectionSummary({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-600">No sections configured.</p>
      )}
    </section>
  );
}

function ToolPlacementPreview({
  placement,
}: {
  placement: HomepagePreviewToolPlacement;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-950">{placement.title}</h2>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {placement.placementId}
        </p>
      </div>

      {placement.unsupportedReferences.length > 0 && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Some placement references could not be hydrated in this preview:
          {" "}
          {placement.unsupportedReferences.join(", ")}
        </p>
      )}

      {placement.tools.length > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {placement.tools.map((tool) => (
            <article
              key={`${placement.placementId}-${tool.requestedId}`}
              className={`rounded-xl border p-4 ${
                tool.isMissing
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{tool.name}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {tool.category}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                {tool.description}
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                {tool.pricing}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          No hydrateable tool IDs are configured for this placement yet.
        </p>
      )}
    </section>
  );
}

export default async function AdminHomepageControlPreviewPage({
  params,
}: PageProps) {
  const { id } = await params;
  const result = await getHomepageControlConfigById(id);

  if (!result.config) {
    notFound();
  }

  const config = result.config;
  const hero = isRecord(config.content.hero) ? config.content.hero : {};
  const layoutLabel = getPresetLabel(
    config.config.layoutPreset,
    HOMEPAGE_LAYOUT_PRESET_DETAILS,
    "Unknown layout"
  );
  const densityLabel = getPresetLabel(
    config.config.densityPreset,
    HOMEPAGE_DENSITY_PRESET_DETAILS,
    "Unknown density"
  );
  const visibleSections = getStringArray(config.config.visibleSections);
  const sectionOrder = getStringArray(config.config.sectionOrder);
  const previewAuditResult = await recordHomepageControlPreview(
    config.id,
    { id: null, label: "AiFinder Admin" },
    config.version
  );
  const previewChecklistResult = await getHomepageControlPreviewChecklist(
    config.id
  );
  const placementResult = await hydrateHomepagePreviewToolPlacements(config);
  const auditWarnings = previewAuditResult.success
    ? previewAuditResult.warnings
    : [
        ...previewAuditResult.errors,
        ...previewAuditResult.warnings,
      ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <HomepagePreviewBanner
        configId={config.id}
        version={config.version}
        status={config.status}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {(result.errors.length > 0 ||
          result.warnings.length > 0 ||
          auditWarnings.length > 0 ||
          previewChecklistResult.errors.length > 0 ||
          previewChecklistResult.warnings.length > 0 ||
          placementResult.errors.length > 0 ||
          placementResult.warnings.length > 0) && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {[
              ...result.errors,
              ...previewChecklistResult.errors,
              ...placementResult.errors,
            ].map((item) => (
              <p key={item}>{item}</p>
            ))}
            {[
              ...result.warnings,
              ...auditWarnings,
              ...previewChecklistResult.warnings,
              ...placementResult.warnings,
            ].map((item) => (
              <p key={item}>{item}</p>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-12 shadow-sm sm:px-8 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            Admin homepage preview
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
            {getText(hero.title, "Homepage hero title not configured")}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            {getText(hero.subtitle, "Homepage hero subtitle not configured")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
              Layout: {layoutLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              Density: {densityLabel}
            </span>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <PreviewSectionSummary
            title="Visible sections"
            items={visibleSections}
          />
          <PreviewSectionSummary title="Section order" items={sectionOrder} />
        </div>

        {config.status === "preview" && (
          <HomepageControlPreviewChecklist
            configId={config.id}
            initialChecklist={previewChecklistResult.checklist}
            completedAt={previewChecklistResult.run?.completed_at || null}
          />
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Tool placement summary
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Tool placements are hydrated from numeric tool IDs when available.
            Unsupported or missing references are shown as review placeholders.
          </p>
        </section>

        {placementResult.placements.length > 0 ? (
          placementResult.placements.map((placement) => (
            <ToolPlacementPreview
              key={placement.placementId}
              placement={placement}
            />
          ))
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            No homepage tool placements are configured yet.
          </section>
        )}
      </div>
    </main>
  );
}
