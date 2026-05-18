"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  categories,
  getIcon,
  getLogoUrl,
  getReviewCount,
  getToolRating,
  slugify,
  toolSlug,
  Tool,
} from "./data/tools";
import { useTheme } from "./theme-provider";
import { useCompare } from "./compare-provider";
import { supabase } from "../lib/supabase";

const pricingOptions = ["All", "Free + Paid", "Free", "Paid"];
const platformOptions = ["All", "Web", "iOS", "Android", "Desktop"];
const popularSearches = ["ChatGPT", "Video AI", "Coding", "Automation", "Writing"];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { isLightMode, toggleTheme } = useTheme();
  const { compareSlugs, toggleCompare, clearCompare } = useCompare();

  const [databaseTools, setDatabaseTools] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  const tools = databaseTools;

  useEffect(() => {
    async function loadToolsFromSupabase() {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase tools error:", error.message);
        setIsLoadingTools(false);
        return;
      }

      const formattedTools: Tool[] =
        data?.map((tool) => ({
          name: tool.name,
          category:
            tool.category === "Chat"
              ? "Chatbots"
              : tool.category === "Image"
                ? "Image AI"
                : tool.category === "Video"
                  ? "Video AI"
                  : tool.category === "Audio"
                    ? "Voice AI"
                    : tool.category,
          description: tool.description,
          website: tool.website,
          logoUrl: tool.logo_url || undefined,
          pricing:
            tool.pricing === "Freemium"
              ? "Free + Paid"
              : tool.pricing || "Free + Paid",
          platforms: tool.platforms || [],
          featured: tool.featured || false,
          bestFor: tool.best_for || "General use",
          useCases: tool.use_cases || [],
          ios: tool.ios || undefined,
          android: tool.android || undefined,
        })) || [];

      setDatabaseTools(formattedTools);
      setIsLoadingTools(false);
    }

    loadToolsFromSupabase();
  }, []);

  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aifinder-favorites");
    const savedSearches = localStorage.getItem("aifinder-recent-searches");

    if (savedFavorites) setFavoriteSlugs(JSON.parse(savedFavorites));
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
  }, []);

  const saveFavorites = (newFavorites: string[]) => {
    setFavoriteSlugs(newFavorites);
    localStorage.setItem("aifinder-favorites", JSON.stringify(newFavorites));
  };

  const toggleFavorite = (tool: Tool) => {
    const slug = toolSlug(tool.name);

    if (favoriteSlugs.includes(slug)) {
      saveFavorites(favoriteSlugs.filter((item) => item !== slug));
    } else {
      saveFavorites([...favoriteSlugs, slug]);
    }
  };

  const saveRecentSearch = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;

    const updatedSearches = [
      cleanValue,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== cleanValue.toLowerCase()
      ),
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    localStorage.setItem(
      "aifinder-recent-searches",
      JSON.stringify(updatedSearches)
    );
  };

  const applySearch = (value: string) => {
    setSearch(value);
    saveRecentSearch(value);
  };

  const favoriteTools = tools.filter((tool) =>
    favoriteSlugs.includes(toolSlug(tool.name))
  );

  const compareTools = tools.filter((tool) =>
    compareSlugs.includes(toolSlug(tool.name))
  );

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const searchText =
        `${tool.name} ${tool.category} ${tool.description} ${tool.bestFor} ${tool.useCases.join(
          " "
        )}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || tool.category === selectedCategory;
      const matchesPricing =
        selectedPricing === "All" || tool.pricing === selectedPricing;
      const matchesPlatform =
        selectedPlatform === "All" ||
        tool.platforms.includes(selectedPlatform);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPricing &&
        matchesPlatform
      );
    });
  }, [tools, search, selectedCategory, selectedPricing, selectedPlatform]);

  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const trendingTools = tools.filter((tool) => tool.featured).slice(0, 6);

  const topRatedTools = [...tools]
    .sort((a, b) => getToolRating(b.name) - getToolRating(a.name))
    .slice(0, 8);

  const newTools = [...tools].slice(-8).reverse();

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedPricing("All");
    setSelectedPlatform("All");
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("aifinder-recent-searches");
  };

  const hasActiveFilters =
    search ||
    selectedCategory !== "All" ||
    selectedPricing !== "All" ||
    selectedPlatform !== "All";

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

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-300 ${pageBg}`}
    >
      <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <motion.nav
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className={`relative z-10 mb-6 flex items-center justify-between rounded-3xl border px-5 py-4 backdrop-blur-xl ${cardBg}`}
        >
          <Link href="/" className="text-lg font-black">
            AiFinder
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              {isLightMode ? "🌙 Dark" : "☀️ Light"}
            </button>

            <a
              href="#categories"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-200"
            >
              Explore
            </a>

            <a
              href="#favorites"
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              ⭐ Bookmarks
            </a>

            <Link
              href="/submit"
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Submit Tool
            </Link>
          </div>
        </motion.nav>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl sm:p-10 ${cardBg}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Discover • Compare • Launch
            </p>

            <h1 className="mt-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl md:text-7xl">
              Find the best AI tools fast.
            </h1>

            <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${mutedText}`}>
              Explore premium AI tools for chat, images, video, voice, music,
              coding, writing, productivity, automation, and more.
            </p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => saveRecentSearch(search)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRecentSearch(search);
              }}
              placeholder="Search AI tools, categories, or use cases..."
              className={`mt-8 w-full rounded-2xl border px-5 py-4 shadow-xl outline-none focus:border-cyan-400 ${inputBg}`}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <button
                  key={item}
                  onClick={() => applySearch(item)}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/20"
                >
                  {item}
                </button>
              ))}
            </div>

            {recentSearches.length > 0 && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-cyan-300">
                    Recent searches
                  </p>

                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-slate-400 hover:text-cyan-300"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => setSearch(item)}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs hover:bg-white/10"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`rounded-2xl border px-4 py-3 text-sm outline-none ${inputBg}`}
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
                className={`rounded-2xl border px-4 py-3 text-sm outline-none ${inputBg}`}
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
                className={`rounded-2xl border px-4 py-3 text-sm outline-none ${inputBg}`}
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
                className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Clear filters
              </button>
            )}

            {isLoadingTools && (
              <p className="mt-4 text-sm text-slate-400">
                Loading AI tools...
              </p>
            )}
          </div>
        </motion.div>

        {!hasActiveFilters && (
          <>
            <Section
              title="Your Saved AI Tools"
              tools={favoriteTools}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={toggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              emptyText="No bookmarks yet. Click the ☆ on any tool to save it here."
              cardBg={cardBg}
            />

            <Section
              title="Trending AI Tools"
              tools={trendingTools}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={toggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              badge="Trending"
              cardBg={cardBg}
            />

            <Section
              title="Top Rated AI Tools"
              tools={topRatedTools}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={toggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              badge="Top Rated"
              cardBg={cardBg}
            />

            <Section
              title="New AI Tools"
              tools={newTools}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={toggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={toggleCompare}
              badge="New"
              cardBg={cardBg}
            />

            <motion.section
              id="categories"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <h2 className="text-3xl font-black">Popular Categories</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category, index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.04,
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Link
                      href={`/category/${slugify(category)}`}
                      className={`block rounded-3xl border p-5 transition hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}
                    >
                      <div className="text-3xl">{getIcon(category)}</div>

                      <h3 className="mt-4 text-lg font-bold">{category}</h3>

                      <p className={`mt-2 text-sm ${mutedText}`}>
                        {
                          tools.filter(
                            (tool) => tool.category === category
                          ).length
                        }{" "}
                        tools
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </>
        )}

        {hasActiveFilters && (
          <motion.section
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Search Results
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {filteredTools.length} tools found
            </h2>

            {filteredTools.length > 0 ? (
              <ToolList
                tools={filteredTools}
                favoriteSlugs={favoriteSlugs}
                onToggleFavorite={toggleFavorite}
                compareSlugs={compareSlugs}
                onToggleCompare={toggleCompare}
                cardBg={cardBg}
              />
            ) : (
              <div className={`mt-5 rounded-3xl border p-8 ${cardBg}`}>
                <p className={mutedText}>
                  No tools found. Try searching for “chatbot”, “video”,
                  “coding”, or “automation”.
                </p>
              </div>
            )}
          </motion.section>
        )}

        {compareSlugs.length > 0 && (
          <CompareBar
            compareTools={compareTools}
            clearCompare={clearCompare}
            cardBg={cardBg}
          />
        )}

        <footer className="mt-20 border-t border-white/10 py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-2xl font-black">AiFinder</h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
                Discover, compare, and explore the best AI tools for
                productivity, creativity, automation, coding, research,
                writing, video, images, and more.
              </p>

              <p className="mt-4 text-xs text-slate-500">
                © 2026 AiFinder. All rights reserved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-sm font-bold text-cyan-300">
                  Explore
                </p>

                <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                  <a href="#categories" className="hover:text-cyan-300">
                    Categories
                  </a>

                  <a href="#favorites" className="hover:text-cyan-300">
                    Bookmarks
                  </a>

                  <Link href="/compare" className="hover:text-cyan-300">
                    Compare
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-cyan-300">
                  Platform
                </p>

                <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                  <Link href="/submit" className="hover:text-cyan-300">
                    Submit Tool
                  </Link>

                  <button className="text-left hover:text-cyan-300">
                    Trending
                  </button>

                  <button className="text-left hover:text-cyan-300">
                    Top Rated
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-cyan-300">
                  Stats
                </p>

                <div className="mt-4 space-y-3 text-sm text-slate-400">
                  <p>{tools.length}+ AI tools</p>
                  <p>{categories.length} categories</p>
                  <p>Compare up to 3 tools</p>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

function Section({
  title,
  tools,
  favoriteSlugs,
  onToggleFavorite,
  compareSlugs,
  onToggleCompare,
  badge,
  emptyText,
  cardBg,
}: {
  title: string;
  tools: Tool[];
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  badge?: string;
  emptyText?: string;
  cardBg: string;
}) {
  return (
    <motion.section
      id={title.includes("Saved") ? "favorites" : undefined}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={fadeUp}
      transition={{ duration: 0.5 }}
      className="mt-12"
    >
      <h2 className="text-3xl font-black">{title}</h2>

      {tools.length === 0 ? (
        <div className={`mt-5 rounded-3xl border p-6 text-slate-400 ${cardBg}`}>
          {emptyText}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.name}
              tool={tool}
              index={index}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={onToggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={onToggleCompare}
              badge={badge}
              cardBg={cardBg}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function ToolList({
  tools,
  favoriteSlugs,
  onToggleFavorite,
  compareSlugs,
  onToggleCompare,
  cardBg,
}: {
  tools: Tool[];
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  cardBg: string;
}) {
  return (
    <div className={`mt-5 overflow-hidden rounded-3xl border ${cardBg}`}>
      {tools.map((tool, index) => (
        <motion.div
          key={tool.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.03 }}
          className="relative"
        >
          <button
            onClick={() => onToggleFavorite(tool)}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm hover:bg-white/10"
          >
            {favoriteSlugs.includes(toolSlug(tool.name)) ? "★" : "☆"}
          </button>

          <button
            onClick={() => onToggleCompare(toolSlug(tool.name))}
            className="absolute right-4 top-14 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs hover:bg-white/10"
          >
            {compareSlugs.includes(toolSlug(tool.name)) ? "✓ Compare" : "+ Compare"}
          </button>

          <Link
            href={`/tool/${toolSlug(tool.name)}`}
            className="flex gap-4 border-b border-white/10 p-4 pr-28 last:border-b-0 hover:bg-white/10"
          >
            <div className="text-slate-500">{index + 1}.</div>

            <ToolLogo tool={tool} />

            <div>
              <h3 className="font-bold">{tool.name}</h3>

              <p className="text-sm text-cyan-300">{tool.category}</p>

              <p className="mt-1 text-sm text-yellow-300">
                ⭐ {getToolRating(tool.name)} (
                {getReviewCount(tool.name).toLocaleString()} reviews)
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {tool.description}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function ToolCard({
  tool,
  index,
  favoriteSlugs,
  onToggleFavorite,
  compareSlugs,
  onToggleCompare,
  badge,
  cardBg,
}: {
  tool: Tool;
  index: number;
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  badge?: string;
  cardBg: string;
}) {
  const isFavorite = favoriteSlugs.includes(toolSlug(tool.name));
  const isCompared = compareSlugs.includes(toolSlug(tool.name));

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative"
    >
      <button
        onClick={() => onToggleFavorite(tool)}
        className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm hover:bg-white/10"
      >
        {isFavorite ? "★" : "☆"}
      </button>

      <button
        onClick={() => onToggleCompare(toolSlug(tool.name))}
        className="absolute right-4 top-14 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs hover:bg-white/10"
      >
        {isCompared ? "✓ Compare" : "+ Compare"}
      </button>

      <Link
        href={`/tool/${toolSlug(tool.name)}`}
        className={`block rounded-3xl border p-5 pr-14 transition hover:bg-white/[0.08] ${cardBg}`}
      >
        {badge && (
          <span className="mb-3 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
            {badge}
          </span>
        )}

        <ToolLogo tool={tool} />

        <h3 className="mt-4 font-bold">{tool.name}</h3>

        <p className="mt-2 text-sm text-cyan-300">{tool.category}</p>

        <p className="mt-1 text-sm text-yellow-300">
          ⭐ {getToolRating(tool.name)} (
          {getReviewCount(tool.name).toLocaleString()} reviews)
        </p>

        <p className="mt-2 text-sm text-slate-400">{tool.description}</p>
      </Link>
    </motion.div>
  );
}

function CompareBar({
  compareTools,
  clearCompare,
  cardBg,
}: {
  compareTools: Tool[];
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
                  key={tool.name}
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

function ToolLogo({ tool }: { tool: Tool }) {
  const [logoError, setLogoError] = useState(false);

  const logoSrc =
    !logoError && tool.logoUrl ? tool.logoUrl : getLogoUrl(tool.website);

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
      <img
        src={logoSrc}
        alt={`${tool.name} logo`}
        className="h-8 w-8 object-contain"
        onError={() => setLogoError(true)}
      />
    </div>
  );
}