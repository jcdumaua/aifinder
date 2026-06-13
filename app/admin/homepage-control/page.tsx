import HomepageControlCreateDraftButton from "../../../components/admin/homepage-control-create-draft-button";
import { listHomepageControlConfigs } from "../../../lib/homepage-control-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatDate(value: string | null) {
  if (!value) return "Not published";

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

export default async function AdminHomepageControlPage() {
  const result = await listHomepageControlConfigs();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Admin
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                Homepage Control Room
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Create draft homepage control configs for future review. This
                page is draft-only and does not affect the live homepage.
              </p>
            </div>
            <HomepageControlCreateDraftButton />
          </div>
        </section>

        {(result.errors.length > 0 || result.warnings.length > 0) && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {result.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
            {result.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5 sm:p-6">
            <h2 className="text-lg font-bold">Drafts and configs</h2>
            <p className="mt-1 text-sm text-gray-600">
              Read-only overview of Homepage Control Room configs. Editing,
              publishing, and deletion are intentionally not available yet.
            </p>
          </div>

          {result.configs.length === 0 ? (
            <div className="p-5 text-sm text-gray-600 sm:p-6">
              No Homepage Control Room drafts or configs found yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {result.configs.map((config) => (
                <article
                  key={config.id}
                  className="grid gap-4 p-5 text-sm sm:p-6 lg:grid-cols-[120px_150px_120px_1fr_1fr]"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Version
                    </p>
                    <p className="mt-1 font-semibold">v{config.version}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(
                        config.status
                      )}`}
                    >
                      {config.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Active
                    </p>
                    <p className="mt-1 font-semibold">
                      {config.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Published
                    </p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(config.published_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Updated
                    </p>
                    <p className="mt-1 text-gray-700">
                      {formatDate(config.updated_at)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
