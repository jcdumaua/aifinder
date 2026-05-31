"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ToolDetailsModal } from "@/components/tool-details-modal";
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
  ios: string | null;
  android: string | null;
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

  const pageBg = "ai-product-page";
  const cardBg = "ai-product-surface";
  const inputBg = "ai-product-input";
  const mutedText = "ai-product-muted";
  const softText = "ai-product-body";

  function resetFilters() {
    setSearch("");
    setSelectedPricing("All");
    setSelectedPlatform("All");
  }

  return (
    <main className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${pageBg}`}>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 xl:max-w-7xl">
        <nav className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="ai-product-button-secondary px-4 py-2 text-sm"
          >
            ← Back Home
          </Link>

          <Link
            href="/"
            className="ai-product-button-secondary px-4 py-2 text-sm"
          >
            All Tools
          </Link>

          <button
            onClick={toggleTheme}
            className="ai-product-button-secondary px-4 py-2 text-sm"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </nav>

        <header className={`relative mt-8 overflow-hidden rounded-[2rem] border p-6 shadow-2xl sm:p-10 ${cardBg}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent [.theme-light_&]:from-cyan-50/70 [.theme-light_&]:via-transparent [.theme-light_&]:to-slate-50/70" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl [.theme-light_&]:bg-cyan-200/20" />

          <div className="relative z-10">
            <div className="text-5xl">{getIcon(category)}</div>

            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-cyan-300">
              AI Tools Category
            </p>

            <h1 className="ai-product-section-title mt-3 max-w-5xl text-4xl sm:text-6xl xl:text-7xl">
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

            <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-[1fr_180px_180px_auto]">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${category} tools...`}
                className={`rounded-2xl border px-5 py-4 outline-none ${inputBg}`}
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
                className="ai-product-button-secondary rounded-2xl px-5 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>
        </header>

        {featuredTools.length > 0 && !hasActiveFilters && (
          <section className="ai-product-section">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Featured
            </p>

            <h2 className="ai-product-section-title mt-2 text-3xl">
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
          <section className="ai-product-section">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Top Rated
            </p>

            <h2 className="ai-product-section-title mt-2 text-3xl">
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

        <section className="ai-product-section">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Directory
              </p>

              <h2 className="ai-product-section-title mt-2 text-3xl">
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

        <section className={`ai-product-section rounded-[2rem] border p-6 sm:p-8 ${cardBg}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
            About this category
          </p>

          <h2 className="ai-product-section-title mt-2 text-3xl">
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
          <section className="ai-product-section">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Related Categories
            </p>

            <h2 className="ai-product-section-title mt-2 text-3xl">
              Explore more AI tool categories
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedCategories.map((relatedCategory) => (
                <Link
                  key={relatedCategory.slug}
                  href={`/category/${relatedCategory.slug}`}
                  className={`rounded-3xl border p-5 ${cardBg} ai-product-hover`}
                >
                  <div className="text-3xl">{getIcon(relatedCategory.name)}</div>

                  <h3 className="ai-product-heading mt-4 text-lg font-black">
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
    <div className="ai-product-surface-soft rounded-2xl border p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
        {label}
      </p>

      <p className="ai-product-heading mt-2 text-3xl font-black">{value}</p>
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
  const shouldReduceMotion = useReducedMotion();
  const [selectedTool, setSelectedTool] = useState<CategoryPageTool | null>(null);
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aifinder-favorites");
    if (savedFavorites) {
      setFavoriteSlugs(JSON.parse(savedFavorites));
    }
  }, []);

  function toggleFavorite(slug: string) {
    const newFavorites = favoriteSlugs.includes(slug)
      ? favoriteSlugs.filter((item) => item !== slug)
      : [...favoriteSlugs, slug];

    setFavoriteSlugs(newFavorites);
    localStorage.setItem("aifinder-favorites", JSON.stringify(newFavorites));
  }

  function openTool(tool: CategoryPageTool) {
    setSelectedTool(tool);
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tools.map((tool) => {
        const isCompared = compareSlugs.includes(tool.slug);
        const isOpening = selectedTool?.slug === tool.slug && !shouldReduceMotion;

        return (
          <div key={tool.slug} className="relative">
            <motion.article
              role="link"
              tabIndex={0}
              onClick={() => openTool(tool)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openTool(tool);
                }
              }}
              animate={
                isOpening
                  ? { opacity: 0.45, scale: 0.985 }
                  : { opacity: 1, scale: 1 }
              }
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`group relative cursor-pointer rounded-3xl border p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 ${cardBg} ai-product-hover`}
            >
              {badge && (
                <span className="ai-product-chip mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold">
                  {badge}
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <ToolLogo tool={tool} />

                <button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleCompare(tool.slug);
                  }}
                  className="ai-product-button-secondary min-h-0 px-3 py-1 text-xs"
                >
                  {isCompared ? "✓ Compare" : "+ Compare"}
                </button>
              </div>

              <div className="mt-4 block">
                <h3 className="ai-product-heading text-lg font-black">{tool.name}</h3>

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
                      className="ai-product-chip rounded-full px-3 py-1 text-xs"
                    >
                      {platform}
                    </span>
                  ))}
                </div>

                <span className="mt-5 inline-block text-sm font-bold text-cyan-300">
                  View Tool →
                </span>
              </div>
            </motion.article>
          </div>
        );
      })}

      <ToolDetailsModal
        tool={
          selectedTool
            ? {
                name: selectedTool.name,
                slug: selectedTool.slug,
                category: selectedTool.category,
                description: selectedTool.description,
                website: selectedTool.website,
                logoUrl: selectedTool.logoUrl,
                pricing: selectedTool.pricing,
                platforms: selectedTool.platforms,
                rating: selectedTool.rating,
                reviewCount: selectedTool.reviewCount,
                bestFor: selectedTool.bestFor,
                useCases: selectedTool.useCases,
                ios: selectedTool.ios,
                android: selectedTool.android,
              }
            : null
        }
        isOpen={selectedTool !== null}
        isCompared={selectedTool ? compareSlugs.includes(selectedTool.slug) : false}
        isFavorite={
          selectedTool ? favoriteSlugs.includes(selectedTool.slug) : false
        }
        onClose={() => setSelectedTool(null)}
        onToggleCompare={() => {
          if (selectedTool) {
            onToggleCompare(selectedTool.slug);
          }
        }}
        onToggleFavorite={() => {
          if (selectedTool) {
            toggleFavorite(selectedTool.slug);
          }
        }}
      />
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
                  className="ai-product-chip rounded-full px-3 py-1 text-xs"
                >
                  {tool.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCompare}
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              Clear
            </button>

            <Link
              href="/compare"
              className="ai-product-button-primary px-4 py-2 text-sm"
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
