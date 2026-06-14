import Link from "next/link";
import { notFound } from "next/navigation";
import HomepageControlDraftEditor from "../../../../../components/admin/homepage-control-draft-editor";
import { getHomepageControlConfigById } from "../../../../../lib/homepage-control-admin";
import {
  HOMEPAGE_DENSITY_PRESET_DETAILS,
  HOMEPAGE_LAYOUT_PRESET_DETAILS,
  isHomepageDensityPreset,
  isHomepageLayoutPreset,
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

function getText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function AdminHomepageControlEditPage({
  params,
}: PageProps) {
  const { id } = await params;
  const result = await getHomepageControlConfigById(id);

  if (!result.config) {
    notFound();
  }

  const config = result.config;

  if (config.status !== "draft") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <Link
            href={`/admin/homepage-control/${config.id}`}
            className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            Back to config detail
          </Link>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">
              Read-only
            </p>
            <h1 className="mt-2 text-2xl font-black">
              This config cannot be edited
            </h1>
            <p className="mt-3 text-sm leading-6">
              This configuration is locked because it is in {config.status}{" "}
              status. Only draft Homepage Control Room configs can be edited.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const hero = isRecord(config.content.hero) ? config.content.hero : {};
  const layoutPreset = getText(config.config.layoutPreset);
  const densityPreset = getText(config.config.densityPreset);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Link
          href={`/admin/homepage-control/${config.id}`}
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          Back to config detail
        </Link>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Draft editor
          </p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">
            Edit Homepage Draft v{config.version}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This structured editor updates draft fields only. It does not
            publish, activate, delete, archive, or affect the live homepage.
          </p>
        </section>

        <HomepageControlDraftEditor
          configId={config.id}
          initialValues={{
            layoutPreset: isHomepageLayoutPreset(layoutPreset)
              ? layoutPreset
              : "clean",
            densityPreset: isHomepageDensityPreset(densityPreset)
              ? densityPreset
              : "comfortable",
            heroTitle: getText(hero.title),
            heroSubtitle: getText(hero.subtitle),
            checklist: config.pre_publish_checklist,
          }}
          layoutOptions={HOMEPAGE_LAYOUT_PRESET_DETAILS}
          densityOptions={HOMEPAGE_DENSITY_PRESET_DETAILS}
        />
      </div>
    </main>
  );
}
