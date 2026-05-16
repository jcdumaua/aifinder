import type { Metadata } from "next";
import Link from "next/link";
import {
  findToolBySlug,
  getLogoUrl,
  slugify,
  toolSlug,
  tools,
  Tool,
} from "../../data/tools";

export function generateStaticParams() {
  return tools.map((tool) => ({
    slug: toolSlug(tool.name),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const tool = findToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Not Found | AiFinder",
      description: "This AI tool could not be found.",
    };
  }

  return {
    title: `${tool.name} - ${tool.category} | AiFinder`,
    description: tool.description,
  };
}

function getIOSLink(toolName: string) {
  const query = encodeURIComponent(toolName);
  return `https://apps.apple.com/us/iphone/search?term=${query}`;
}

function getAndroidLink(toolName: string) {
  const query = encodeURIComponent(toolName);
  return `https://play.google.com/store/search?q=${query}&c=apps`;
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tool = findToolBySlug(slug);

  if (!tool) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <Link href="/">← Back home</Link>

        <h1 className="mt-8 text-4xl font-black">
          Tool not found
        </h1>
      </main>
    );
  }

  const relatedTools = tools
    .filter(
      (item) =>
        item.category === tool.category &&
        item.name !== tool.name
    )
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/category/${slugify(tool.category)}`}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Back to {tool.category}
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            Home
          </Link>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <ToolLogo tool={tool} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              {tool.category}
            </p>

            {tool.featured && (
              <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-200">
                Featured
              </span>
            )}
          </div>

          <h1 className="mt-4 text-4xl font-black">
            {tool.name}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            {tool.description}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              title="Pricing"
              value={tool.pricing}
            />

            <InfoCard
              title="Best For"
              value={tool.bestFor}
            />

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Platforms
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {tool.platforms.includes("Web") && (
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                  >
                    🌐 Web
                  </a>
                )}

                {tool.platforms.includes("iOS") && (
                  <a
                    href={getIOSLink(tool.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 hover:bg-white/10"
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/0/747.png"
                      alt="Apple"
                      className="h-5 w-5 invert"
                    />
                  </a>
                )}

                {tool.platforms.includes("Android") && (
                  <a
                    href={getAndroidLink(tool.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 hover:bg-white/10"
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/226/226770.png"
                      alt="Android"
                      className="h-5 w-5"
                    />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Use Cases
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {tool.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </div>
        </div>

        {relatedTools.length > 0 && (
          <section className="mt-10">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Related Tools
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              More {tool.category} tools
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTools.map((relatedTool) => (
                <Link
                  key={relatedTool.name}
                  href={`/tool/${toolSlug(
                    relatedTool.name
                  )}`}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-2 hover:bg-white/[0.08]"
                >
                  <ToolLogo tool={relatedTool} />

                  <h3 className="mt-4 font-bold">
                    {relatedTool.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {relatedTool.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
        {title}
      </p>

      <p className="mt-2 text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}

function ToolLogo({ tool }: { tool: Tool }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white">
      <img
        src={getLogoUrl(tool.website)}
        alt={`${tool.name} logo`}
        className="h-10 w-10"
      />
    </div>
  );
}