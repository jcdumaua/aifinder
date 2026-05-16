import Link from "next/link";
import {
  categories,
  getIcon,
  getLogoUrl,
  slugify,
  toolSlug,
  tools,
  Tool,
} from "../../data/tools";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = categories.find(
    (cat) => slugify(cat) === slug
  );

  const categoryTools = tools.filter(
    (tool) => tool.category === category
  );

  if (!category) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <Link href="/" className="text-cyan-300">
          ← Back home
        </Link>

        <h1 className="mt-8 text-4xl font-black">
          Category not found
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← Back
        </Link>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="text-5xl">
            {getIcon(category)}
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-cyan-300">
            Category
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            {category}
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Discover the best {category.toLowerCase()} tools for productivity,
            creativity, business, and AI workflows.
          </p>

          <div className="mt-6 inline-block rounded-full bg-white/5 px-5 py-3 text-sm text-slate-300">
            {categoryTools.length} AI tools listed
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTools.map((tool) => (
            <Link
              key={tool.name}
              href={`/tool/${toolSlug(tool.name)}`}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08]"
            >
              <ToolLogo tool={tool} />

              <div className="mt-5 flex items-center gap-2">
                <h3 className="font-bold">
                  {tool.name}
                </h3>

                {tool.featured && (
                  <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-xs font-bold text-cyan-200">
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                {tool.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {tool.useCases?.slice(0, 3).map((useCase) => (
                  <span
                    key={useCase}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                  >
                    {useCase}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-cyan-300">
                  {tool.pricing}
                </span>

                <span className="text-sm font-bold text-white group-hover:text-cyan-300">
                  View Tool →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function ToolLogo({ tool }: { tool: Tool }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-white">
      <img
        src={getLogoUrl(tool.website)}
        alt={`${tool.name} logo`}
        className="h-9 w-9"
      />
    </div>
  );
}