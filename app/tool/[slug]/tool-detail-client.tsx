"use client";

import Link from "next/link";
import { slugify } from "../../data/tools";
import { useCompare } from "../../compare-provider";
import { useTheme } from "../../theme-provider";

export type ToolPageData = {
  name: string;
  slug: string;
  category: string;
  description: string;
  website: string;
  pricing: string;
  logoUrl: string;
  platforms: string[];
  featured: boolean;
  bestFor: string;
  useCases: string[];
  ios: string | null;
  android: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type ToolDetailClientProps = {
  tool: ToolPageData;
  similarTools: ToolPageData[];
};

export default function ToolDetailClient({
  tool,
  similarTools,
}: ToolDetailClientProps) {
  const { isLightMode, toggleTheme } = useTheme();
  const { compareSlugs, toggleCompare } = useCompare();

  const isCompared = compareSlugs.includes(tool.slug);

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  const mutedText = isLightMode ? "text-slate-600" : "text-slate-400";
  const softText = isLightMode ? "text-slate-700" : "text-slate-300";
  const chipBg = isLightMode
    ? "border-slate-200 bg-slate-100"
    : "border-white/10 bg-white/5";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <nav className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Back
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            🏠 Home
          </Link>

          <Link
            href={`/category/${slugify(tool.category)}`}
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-400/20"
          >
            {tool.category}
          </Link>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </nav>

        <article className={`mt-8 overflow-hidden rounded-[2rem] border shadow-2xl ${cardBg}`}>
          <header className="relative border-b border-white/10 p-6 sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ToolLogo tool={tool} large />

                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                    {tool.category} AI Tool
                  </p>

                  <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">
                    {tool.name}
                  </h1>

                  <p className={`mt-4 max-w-3xl text-lg leading-8 ${softText}`}>
                    {tool.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                      ⭐ {tool.rating} / 5 · {tool.reviewCount.toLocaleString()} reviews
                    </span>

                    <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
                      {tool.pricing}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Visit Website
                </a>

                <button
                  onClick={() => toggleCompare(tool.slug)}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
                >
                  {isCompared ? "✓ In Compare" : "+ Compare"}
                </button>

                {tool.ios && (
                  <a
                    href={tool.ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-5 py-3 text-center text-sm hover:bg-white/10"
                  >
                    🍎 iOS
                  </a>
                )}

                {tool.android && (
                  <a
                    href={tool.android}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-5 py-3 text-center text-sm hover:bg-white/10"
                  >
                    🤖 Android
                  </a>
                )}
              </div>
            </div>
          </header>

          <section className="grid gap-4 p-6 sm:p-10 lg:grid-cols-4">
            <InfoCard title="Pricing" value={tool.pricing} cardBg={cardBg} />
            <InfoCard title="Rating" value={`${tool.rating} / 5`} cardBg={cardBg} />
            <InfoCard
              title="Reviews"
              value={tool.reviewCount.toLocaleString()}
              cardBg={cardBg}
            />
            <InfoCard title="Best For" value={tool.bestFor} cardBg={cardBg} />
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Platforms
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {tool.platforms.map((platform) => (
                <span
                  key={platform}
                  className={`rounded-full border px-4 py-2 text-sm ${chipBg}`}
                >
                  {platform}
                </span>
              ))}
            </div>
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Common Use Cases
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {tool.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              About {tool.name}
            </p>

            <div className={`mt-5 max-w-4xl space-y-5 text-lg leading-8 ${softText}`}>
              <p>
                {tool.name} is listed on AiFinder as a {tool.category.toLowerCase()} tool
                for people who want to discover practical AI software faster.
              </p>

              <p>{tool.description}</p>

              <p>
                This tool may be useful for users looking for {tool.bestFor.toLowerCase()}.
                You can compare it with other {tool.category.toLowerCase()} tools,
                bookmark it for later, or open the official website to learn more.
              </p>
            </div>
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Quick FAQ
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FaqCard
                question={`What is ${tool.name}?`}
                answer={`${tool.name} is a ${tool.category} AI tool listed on AiFinder. ${tool.description}`}
                cardBg={cardBg}
                softText={softText}
              />

              <FaqCard
                question={`Is ${tool.name} free?`}
                answer={`${tool.name} is listed with this pricing option: ${tool.pricing}. Check the official website for the latest plan details.`}
                cardBg={cardBg}
                softText={softText}
              />

              <FaqCard
                question={`What is ${tool.name} best for?`}
                answer={`${tool.name} is best for ${tool.bestFor}.`}
                cardBg={cardBg}
                softText={softText}
              />

              <FaqCard
                question={`Can I compare ${tool.name} with other AI tools?`}
                answer={`Yes. Use AiFinder's compare feature to compare ${tool.name} with other AI tools side-by-side.`}
                cardBg={cardBg}
                softText={softText}
              />
            </div>
          </section>
        </article>

        {similarTools.length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Similar Tools
            </p>

            <h2 className="mt-2 text-3xl font-black">
              More {tool.category} tools
            </h2>

            <p className={`mt-3 max-w-2xl text-sm leading-7 ${mutedText}`}>
              Explore more AI tools in the same category and compare them before
              choosing the right one.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarTools.map((similarTool) => (
                <Link
                  key={similarTool.slug}
                  href={`/tool/${similarTool.slug}`}
                  className={`group rounded-3xl border p-5 transition hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}
                >
                  <ToolLogo tool={similarTool} />

                  <h3 className="mt-4 font-bold">{similarTool.name}</h3>

                  <p className="mt-2 text-sm text-cyan-300">
                    {similarTool.category}
                  </p>

                  <p className="mt-1 text-sm text-yellow-300">
                    ⭐ {similarTool.rating} ({similarTool.reviewCount.toLocaleString()} reviews)
                  </p>

                  <p className={`mt-3 text-sm leading-6 ${softText}`}>
                    {similarTool.description}
                  </p>

                  <span className="mt-5 inline-block text-sm font-bold text-cyan-300">
                    View Tool →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={`mt-10 rounded-[2rem] border p-6 sm:p-8 ${cardBg}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            Discover More
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Browse more AI tools on AiFinder
          </h2>

          <p className={`mt-3 max-w-3xl text-sm leading-7 ${mutedText}`}>
            AiFinder helps you search, bookmark, and compare AI tools for
            writing, coding, image generation, video editing, business,
            productivity, marketing, SEO, design, and AI agents.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              Browse All Tools
            </Link>

            <Link
              href="/submit"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
            >
              Submit a Tool
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({
  title,
  value,
  cardBg,
}: {
  title: string;
  value: string;
  cardBg: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${cardBg}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
        {title}
      </p>

      <p className="mt-3 line-clamp-3 text-xl font-black">{value}</p>
    </div>
  );
}

function FaqCard({
  question,
  answer,
  cardBg,
  softText,
}: {
  question: string;
  answer: string;
  cardBg: string;
  softText: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${cardBg}`}>
      <h3 className="font-black">{question}</h3>

      <p className={`mt-3 text-sm leading-7 ${softText}`}>{answer}</p>
    </div>
  );
}

function ToolLogo({
  tool,
  large = false,
}: {
  tool: ToolPageData;
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ${
        large ? "h-24 w-24 rounded-[2rem]" : "h-14 w-14 rounded-2xl"
      }`}
    >
      <img
        src={tool.logoUrl}
        alt={`${tool.name} logo`}
        className={large ? "h-14 w-14 object-contain" : "h-9 w-9 object-contain"}
      />
    </div>
  );
}
