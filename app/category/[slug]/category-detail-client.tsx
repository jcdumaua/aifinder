"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getIcon } from "../../data/tools";
import { useCompare } from "../../compare-provider";
import { useTheme } from "../../theme-provider";

export type CategoryPageTool = {
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
  createdAt: string | null;
  updatedAt: string | null;
};

type RelatedCategory = {
  name: string;
  slug: string;
  description: string;
  count: number;
};

type CategoryDetailClientProps = {
  category: string;
  description: string;
  tools: CategoryPageTool[];
  featuredTools: CategoryPageTool[];
  relatedCategories: RelatedCategory[];
};

const pricingOptions = ["All", "Free + Paid", "Free", "Paid"];
const platformOptions = ["All", "Web", "iOS", "Android", "Desktop"];

export default function CategoryDetailClient({
  category,
  description,
  tools,
  featuredTools,
  relatedCategories,
}: CategoryDetailClientProps) {
  const { isLightMode, toggleTheme } = useTheme();
  const { compareSlugs, toggleCompare, clearCompare } = useCompare();

  const [search, setSearch] = useState("");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const searchText = `${tool.name} ${tool.description} ${tool.bestFor} ${tool.useCases.join(
        " "
      )}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesPricing =
        selectedPricing === "All" || tool.pricing === selectedPricing;
      const matchesPlatform =
        selectedPlatform === "All" || tool.platforms.includes(selectedPlatform);

      return matchesSearch && matchesPricing && matchesPlatform;
    });
  }, [tools, search, selectedPricing, selectedPlatform]);

  const topRatedTools = [...tools]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const compareTools = tools.filter((tool) => compareSlugs.includes(tool.slug));

  const hasActiveFilters =
    search || selectedPricing !== "All" || selectedPlatform !== "All";

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  const inputBg = isLightMode
    ? "bg-white border-slate-300 text-slate-950"
    : "bg-black/20 border-white/10 text-white";

  const mutedText = isLightMode ? "text-slate-600" : "text-slate-400";
  const softText = isLightMode ? "text-slate-700" : "text-slate-300";

  function resetFilters() {
    setSearch("");
    setSelectedPricing("All");
    setSelectedPlatform("All");
  }

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
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            All Tools
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
            <div className="text-5xl">{getIcon(category)}</div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-cyan-300">
              AI Tools Category
            </p>

            <h1 className="mt-3 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
              {category} AI Tools
            </h1>

            <p className={`mt-5 max-w-3xl text-base leading-8 sm:text-lg ${softText}`}>
              {description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard label="Tools in category" value={`${tools.length}`} />
              <StatCard label="Featured tools" value={`${featuredTools.length}`} />
              <StatCard label="Compare tools" value="Up to 3" />
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${category} tools...`}
                className={`rounded-2xl border px-5 py-4 outline-none focus:border-cyan-400 ${inputBg}`}
              />

              <select
                value={selectedPricing}
                onChange={(event) => setSelectedPricing(event.target.value)}
                className={`rounded-2xl border px-4 py-4 text-sm outline-none ${inputBg}`}
              >
                {pricingOptions.map((price) => (
                  <option key={price} value={price}>
                    {price === "All" ? "All Pricing" : price}
                  </option>
                ))}
              </select>

              <select
                value={selectedPlatform}
                onChange={(event) => setSelectedPlatform(event.target.value)}
                className={`rounded-2xl border px-4 py-4 text-sm outline-none ${inputBg}`}
              >
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform === "All" ? "All Platforms" : platform}
                  </option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-bold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
        </header>

        {featuredTools.length > 0 && !hasActiveFilters && (
          <section className="mt-12">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Featured
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Featured {category} tools
            </h2>

            <ToolGrid
              tools={featuredTools}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              cardBg={cardBg}
              softText={softText}
              badge="Featured"
            />
          </section>
        )}

        {!hasActiveFilters && topRatedTools.length > 0 && (
          <section className="mt-12">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Top Rated
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Top rated {category} tools
            </h2>

            <ToolGrid
              tools={topRatedTools}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              cardBg={cardBg}
              softText={softText}
              badge="Top Rated"
            />
          </section>
        )}

        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Directory
              </p>

              <h2 className="mt-2 text-3xl font-black">
                {filteredTools.length} {category} tools
              </h2>
            </div>

            {hasActiveFilters && (
              <p className={`text-sm ${mutedText}`}>
                Filtered from {tools.length} total tools
              </p>
            )}
          </div>

          {filteredTools.length > 0 ? (
            <ToolGrid
              tools={filteredTools}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              cardBg={cardBg}
              softText={softText}
            />
          ) : (
            <div className={`mt-5 rounded-3xl border p-8 ${cardBg}`}>
              <p className={mutedText}>
                No tools found for this filter. Try clearing filters or searching
                for another use case.
              </p>
            </div>
          )}
        </section>

        <section className={`mt-14 rounded-[2rem] border p-6 sm:p-8 ${cardBg}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            About this category
          </p>

          <h2 className="mt-2 text-3xl font-black">
            What are {category} AI tools?
          </h2>

          <div className={`mt-5 max-w-4xl space-y-5 text-base leading-8 ${softText}`}>
            <p>
              {category} AI tools are software products that use artificial
              intelligence to help with specific tasks in this category.
              AiFinder organizes these tools so you can quickly compare options,
              review pricing, check platform support, and open the official
              website when you are ready.
            </p>

            <p>{description}</p>

            <p>
              You can use this page to search within the category, filter by
              pricing or platform, compare tools side-by-side, and discover
              related AI tool categories.
            </p>
          </div>
        </section>

        {relatedCategories.length > 0 && (
          <section className="mt-14">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Related Categories
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Explore more AI tool categories
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCategories.map((relatedCategory) => (
                <Link
                  key={relatedCategory.slug}
                  href={`/category/${relatedCategory.slug}`}
                  className={`rounded-3xl border p-5 transition hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}
                >
                  <div className="text-3xl">{getIcon(relatedCategory.name)}</div>

                  <h3 className="mt-4 text-lg font-black">
                    {relatedCategory.name}
                  </h3>

                  <p className={`mt-2 text-sm leading-7 ${softText}`}>
                    {relatedCategory.description}
                  </p>

                  <p className="mt-4 text-sm font-bold text-cyan-300">
                    {relatedCategory.count} tools →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {compareSlugs.length > 0 && (
          <CompareBar
            compareTools={compareTools}
            clearCompare={clearCompare}
            cardBg={cardBg}
          />
        )}
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

function ToolGrid({
  tools,
  compareSlugs,
  onToggleCompare,
  cardBg,
  softText,
  badge,
}: {
  tools: CategoryPageTool[];
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  cardBg: string;
  softText: string;
  badge?: string;
}) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tools.map((tool) => {
        const isCompared = compareSlugs.includes(tool.slug);

        return (
          <article
            key={tool.slug}
            className={`group relative rounded-3xl border p-5 transition hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}
          >
            {badge && (
              <span className="mb-3 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                {badge}
              </span>
            )}

            <div className="flex items-start justify-between gap-3">
              <ToolLogo tool={tool} />

              <button
                onClick={() => onToggleCompare(tool.slug)}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs hover:bg-white/10"
              >
                {isCompared ? "✓ Compare" : "+ Compare"}
              </button>
            </div>

            <Link href={`/tool/${tool.slug}`} className="mt-4 block">
              <h3 className="text-lg font-black">{tool.name}</h3>

              <p className="mt-2 text-sm text-cyan-300">{tool.pricing}</p>

              <p className="mt-1 text-sm text-yellow-300">
                ⭐ {tool.rating} ({tool.reviewCount.toLocaleString()} reviews)
              </p>

              <p className={`mt-3 line-clamp-4 text-sm leading-6 ${softText}`}>
                {tool.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {tool.platforms.slice(0, 3).map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs"
                  >
                    {platform}
                  </span>
                ))}
              </div>

              <span className="mt-5 inline-block text-sm font-bold text-cyan-300">
                View Tool →
              </span>
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function CompareBar({
  compareTools,
  clearCompare,
  cardBg,
}: {
  compareTools: CategoryPageTool[];
  clearCompare: () => void;
  cardBg: string;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2">
      <div className={`rounded-3xl border p-4 shadow-2xl backdrop-blur-xl ${cardBg}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-cyan-300">
              Compare Tools ({compareTools.length}/3)
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {compareTools.map((tool) => (
                <span
                  key={tool.slug}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs"
                >
                  {tool.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCompare}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Clear
            </button>

            <Link
              href="/compare"
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              Compare Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolLogo({ tool }: { tool: CategoryPageTool }) {
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
