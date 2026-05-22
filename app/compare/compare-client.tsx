"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCompare } from "../compare-provider";
import { useTheme } from "../theme-provider";

export type ComparePageTool = {
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
  rating: number;
  reviewCount: number;
  ios: string | null;
  android: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type CompareClientProps = {
  tools: ComparePageTool[];
};

const highlightedRows = [
  "Category",
  "Pricing",
  "Rating",
  "Reviews",
  "Platforms",
  "Best for",
  "Use cases",
  "Apps",
];

export default function CompareClient({ tools }: CompareClientProps) {
  const { isLightMode, toggleTheme } = useTheme();
  const { compareSlugs, toggleCompare, clearCompare } = useCompare();

  const [search, setSearch] = useState("");

  const selectedTools = tools.filter((tool) => compareSlugs.includes(tool.slug));

  const suggestedTools = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return tools
      .filter((tool) => !compareSlugs.includes(tool.slug))
      .filter((tool) => {
        if (!searchValue) return true;

        return `${tool.name} ${tool.category} ${tool.description} ${tool.bestFor} ${tool.useCases.join(
          " "
        )}`
          .toLowerCase()
          .includes(searchValue);
      })
      .slice(0, 12);
  }, [tools, compareSlugs, search]);

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  const inputBg = isLightMode
    ? "bg-white border-slate-300 text-slate-950 placeholder:text-slate-400"
    : "bg-black/20 border-white/10 text-white placeholder:text-slate-500";

  const mutedText = isLightMode ? "text-slate-600" : "text-slate-400";
  const softText = isLightMode ? "text-slate-700" : "text-slate-300";

  return (
    <main className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <nav className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Back Home
          </Link>

          <Link
            href="/submit"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            Submit Tool
          </Link>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </nav>

        <header className={`relative mt-8 overflow-hidden rounded-[2rem] border p-6 shadow-2xl sm:p-10 ${cardBg}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              AI Tool Comparison
            </p>

            <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
              Compare AI tools side-by-side.
            </h1>

            <p className={`mt-5 max-w-3xl text-base leading-8 sm:text-lg ${softText}`}>
              Compare AI tools by category, pricing, platform support, rating,
              use cases, best-fit workflows, and official app links. Add up to
              three tools from the homepage, category pages, or tool detail pages.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard label="Selected" value={`${selectedTools.length}/3`} />
              <StatCard label="Available tools" value={`${tools.length}+`} />
              <StatCard label="Comparison rows" value={`${highlightedRows.length}`} />
            </div>
          </div>
        </header>

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Selected Tools
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Your comparison board
              </h2>
            </div>

            {selectedTools.length > 0 && (
              <button
                onClick={clearCompare}
                className="rounded-full border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-bold text-red-200 hover:bg-red-400/20"
              >
                Clear Compare
              </button>
            )}
          </div>

          {selectedTools.length === 0 ? (
            <EmptyCompareCard cardBg={cardBg} mutedText={mutedText} />
          ) : (
            <>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {selectedTools.map((tool) => (
                  <SelectedToolCard
                    key={tool.slug}
                    tool={tool}
                    onRemove={() => toggleCompare(tool.slug)}
                    cardBg={cardBg}
                    softText={softText}
                  />
                ))}
              </div>

              <ComparisonTable
                selectedTools={selectedTools}
                cardBg={cardBg}
                softText={softText}
              />
            </>
          )}
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Add More
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Add tools to compare
              </h2>

              <p className={`mt-3 max-w-2xl text-sm leading-7 ${mutedText}`}>
                Search the directory and add up to three tools to your comparison.
              </p>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tools to compare..."
              className={`w-full rounded-2xl border px-5 py-4 outline-none focus:border-cyan-400 sm:max-w-sm ${inputBg}`}
            />
          </div>

          {suggestedTools.length === 0 ? (
            <div className={`mt-5 rounded-3xl border p-8 ${cardBg}`}>
              <p className={mutedText}>
                No tools found. Try another search or clear your current comparison.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {suggestedTools.map((tool) => (
                <AddToolCard
                  key={tool.slug}
                  tool={tool}
                  onAdd={() => toggleCompare(tool.slug)}
                  disabled={
                    compareSlugs.length >= 3 && !compareSlugs.includes(tool.slug)
                  }
                  cardBg={cardBg}
                  softText={softText}
                />
              ))}
            </div>
          )}
        </section>

        <section className={`mt-14 rounded-[2rem] border p-6 sm:p-8 ${cardBg}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            How to compare AI tools
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Choose the tool that fits your workflow
          </h2>

          <div className={`mt-5 max-w-4xl space-y-5 text-base leading-8 ${softText}`}>
            <p>
              A good AI tool comparison should look beyond popularity. Compare
              pricing, platforms, use cases, category fit, and what each tool is
              best for before choosing one for your workflow.
            </p>

            <p>
              AiFinder helps you compare AI tools across practical details so
              you can decide faster without opening many different websites.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function EmptyCompareCard({
  cardBg,
  mutedText,
}: {
  cardBg: string;
  mutedText: string;
}) {
  return (
    <div className={`mt-5 rounded-[2rem] border p-8 text-center ${cardBg}`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400 text-3xl">
        ⚖️
      </div>

      <h3 className="mt-5 text-2xl font-black">
        No tools selected yet
      </h3>

      <p className={`mx-auto mt-3 max-w-2xl text-sm leading-7 ${mutedText}`}>
        Add tools from the list below, or go back to the homepage and click
        “Compare” on any AI tool card.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
      >
        Browse All Tools
      </Link>
    </div>
  );
}

function SelectedToolCard({
  tool,
  onRemove,
  cardBg,
  softText,
}: {
  tool: ComparePageTool;
  onRemove: () => void;
  cardBg: string;
  softText: string;
}) {
  return (
    <article className={`rounded-3xl border p-5 ${cardBg}`}>
      <div className="flex items-start justify-between gap-3">
        <ToolLogo tool={tool} />

        <button
          onClick={onRemove}
          className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-200 hover:bg-red-400/20"
        >
          Remove
        </button>
      </div>

      <h3 className="mt-4 text-xl font-black">{tool.name}</h3>

      <p className="mt-2 text-sm text-cyan-300">{tool.category}</p>

      <p className="mt-1 text-sm text-yellow-300">
        ⭐ {tool.rating} ({tool.reviewCount.toLocaleString()} reviews)
      </p>

      <p className={`mt-3 line-clamp-4 text-sm leading-6 ${softText}`}>
        {tool.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/tool/${tool.slug}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          Details
        </Link>

        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
        >
          Visit
        </a>
      </div>
    </article>
  );
}

function ComparisonTable({
  selectedTools,
  cardBg,
  softText,
}: {
  selectedTools: ComparePageTool[];
  cardBg: string;
  softText: string;
}) {
  return (
    <div className={`mt-6 overflow-hidden rounded-[2rem] border ${cardBg}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-black/20">
              <th className="w-48 px-5 py-4 text-sm font-black text-cyan-300">
                Detail
              </th>

              {selectedTools.map((tool) => (
                <th key={tool.slug} className="px-5 py-4 text-sm font-black">
                  {tool.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <CompareRow
              label="Category"
              values={selectedTools.map((tool) => tool.category)}
              softText={softText}
            />
            <CompareRow
              label="Pricing"
              values={selectedTools.map((tool) => tool.pricing)}
              softText={softText}
            />
            <CompareRow
              label="Rating"
              values={selectedTools.map((tool) => `${tool.rating} / 5`)}
              softText={softText}
            />
            <CompareRow
              label="Reviews"
              values={selectedTools.map((tool) =>
                tool.reviewCount.toLocaleString()
              )}
              softText={softText}
            />
            <CompareRow
              label="Platforms"
              values={selectedTools.map((tool) => tool.platforms.join(", "))}
              softText={softText}
            />
            <CompareRow
              label="Best for"
              values={selectedTools.map((tool) => tool.bestFor)}
              softText={softText}
            />
            <CompareRow
              label="Use cases"
              values={selectedTools.map((tool) => tool.useCases.join(", "))}
              softText={softText}
            />
            <CompareRow
              label="Apps"
              values={selectedTools.map((tool) => {
                const apps = [
                  tool.ios ? "iOS" : null,
                  tool.android ? "Android" : null,
                ].filter(Boolean);

                return apps.length ? apps.join(", ") : "Web";
              })}
              softText={softText}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
  softText,
}: {
  label: string;
  values: string[];
  softText: string;
}) {
  return (
    <tr className="border-b border-white/10 last:border-b-0">
      <td className="px-5 py-4 text-sm font-black text-cyan-300">
        {label}
      </td>

      {values.map((value, index) => (
        <td key={`${label}-${index}`} className={`px-5 py-4 text-sm leading-6 ${softText}`}>
          {value}
        </td>
      ))}
    </tr>
  );
}

function AddToolCard({
  tool,
  onAdd,
  disabled,
  cardBg,
  softText,
}: {
  tool: ComparePageTool;
  onAdd: () => void;
  disabled: boolean;
  cardBg: string;
  softText: string;
}) {
  return (
    <article className={`rounded-3xl border p-5 transition hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}>
      <ToolLogo tool={tool} />

      <h3 className="mt-4 text-lg font-black">{tool.name}</h3>

      <p className="mt-2 text-sm text-cyan-300">{tool.category}</p>

      <p className="mt-1 text-sm text-yellow-300">
        ⭐ {tool.rating} ({tool.reviewCount.toLocaleString()} reviews)
      </p>

      <p className={`mt-3 line-clamp-3 text-sm leading-6 ${softText}`}>
        {tool.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onAdd}
          disabled={disabled}
          className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? "Max 3" : "+ Compare"}
        </button>

        <Link
          href={`/tool/${tool.slug}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          Details
        </Link>
      </div>
    </article>
  );
}

function ToolLogo({ tool }: { tool: ComparePageTool }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
      <img
        src={tool.logoUrl}
        alt={`${tool.name} logo`}
        className="h-9 w-9 object-contain"
      />
    </div>
  );
}
