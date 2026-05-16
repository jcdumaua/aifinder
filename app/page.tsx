"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  categories,
  getIcon,
  getLogoUrl,
  slugify,
  toolSlug,
  tools,
  Tool,
} from "./data/tools";

const pricingOptions = ["All", "Free + Paid", "Free", "Paid"];
const platformOptions = ["All", "Web", "iOS", "Android", "Desktop"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const searchText =
        `${tool.name} ${tool.category} ${tool.description} ${tool.bestFor} ${tool.useCases.join(" ")}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || tool.category === selectedCategory;
      const matchesPricing =
        selectedPricing === "All" || tool.pricing === selectedPricing;
      const matchesPlatform =
        selectedPlatform === "All" || tool.platforms.includes(selectedPlatform);

      return matchesSearch && matchesCategory && matchesPricing && matchesPlatform;
    });
  }, [search, selectedCategory, selectedPricing, selectedPlatform]);

  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const trendingTools = tools
    .filter((tool) => tool.featured)
    .slice(0, 6);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedPricing("All");
    setSelectedPlatform("All");
  };

  const hasActiveFilters =
    search ||
    selectedCategory !== "All" ||
    selectedPricing !== "All" ||
    selectedPlatform !== "All";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <nav className="mb-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
          <Link href="/" className="text-lg font-black">
            AiFinder
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="#categories"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-200"
            >
              Explore
            </a>

            <Link
              href="/submit"
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Submit Tool
            </Link>
          </div>
        </nav>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Discover • Compare • Launch
            </p>

            <h1 className="mt-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl md:text-7xl">
              Find the best AI tools fast.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Explore premium AI tools for chat, images, video, voice, music,
              coding, writing, productivity, and automation.
            </p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI tools, categories, or use cases..."
              className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white shadow-xl outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={selectedPricing}
                onChange={(e) => setSelectedPricing(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              >
                {pricingOptions.map((price) => (
                  <option key={price} value={price}>
                    {price === "All" ? "All Pricing" : price}
                  </option>
                ))}
              </select>

              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              >
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform === "All" ? "All Platforms" : platform}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters ? (
          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Results
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {filteredTools.length} tools found
            </h2>

            <div className="mt-5">
              {filteredTools.length > 0 ? (
                <ToolList tools={filteredTools} />
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-400">
                  No tools found. Try a different search, category, pricing, or platform.
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            <section className="mt-10">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Trending
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Trending AI Tools
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trendingTools.map((tool, index) => (
                  <Link
                    key={tool.name}
                    href={`/tool/${toolSlug(tool.name)}`}
                    className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black text-cyan-300">
                        #{index + 1}
                      </div>
                      <ToolLogo tool={tool} />
                      <div>
                        <h3 className="font-bold">{tool.name}</h3>
                        <p className="text-sm text-cyan-300">{tool.category}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section id="categories" className="mt-12">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                    Categories
                  </p>

                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    Popular Categories
                  </h2>
                </div>

                <p className="text-sm text-slate-400">
                  {tools.length} tools listed
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={`/category/${slugify(category)}`}
                    className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08]"
                  >
                    <div className="text-3xl">{getIcon(category)}</div>

                    <h3 className="mt-4 text-lg font-bold">{category}</h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {tools.filter((tool) => tool.category === category).length} tools
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Featured
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Featured AI Tools
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredTools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function ToolList({ tools }: { tools: Tool[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      {tools.map((tool, index) => (
        <Link
          key={tool.name}
          href={`/tool/${toolSlug(tool.name)}`}
          className="flex gap-4 border-b border-white/10 p-4 last:border-b-0 hover:bg-white/10"
        >
          <div className="text-slate-500">{index + 1}.</div>

          <ToolLogo tool={tool} />

          <div>
            <h3 className="font-bold">{tool.name}</h3>
            <p className="text-sm text-cyan-300">{tool.category}</p>
            <p className="text-sm text-slate-400">{tool.description}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {tool.pricing}
              </span>

              {tool.platforms.slice(0, 3).map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/tool/${toolSlug(tool.name)}`}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-2 hover:bg-white/[0.08]"
    >
      <ToolLogo tool={tool} />

      <h3 className="mt-4 font-bold">{tool.name}</h3>
      <p className="mt-2 text-sm text-cyan-300">{tool.category}</p>
      <p className="mt-2 text-sm text-slate-400">{tool.description}</p>
    </Link>
  );
}

function ToolLogo({ tool }: { tool: Tool }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
      <img
        src={getLogoUrl(tool.website)}
        alt={`${tool.name} logo`}
        className="h-8 w-8"
      />
    </div>
  );
}