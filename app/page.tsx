"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Plus, Sparkles, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolDetailsModal } from "@/components/tool-details-modal";
import { AIGuidedSuggestions } from "../components/home/AIGuidedSuggestions";
import { AIOnboardingSteps } from "../components/home/AIOnboardingSteps";
import { CompareAssistant } from "../components/home/CompareAssistant";
import { SearchBar } from "../components/home/SearchBar";
import { Button } from "@/components/ui/button";
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
import {
  getConversationalSearchResponse,
  getSearchMatchExplanation,
  getSearchConfidenceLabel,
  rankToolsForQuery,
  type RankedTool,
} from "../lib/search-relevance";

const pricingOptions = ["All", "Free + Paid", "Free", "Paid"];
const platformOptions = ["All", "Web", "iOS", "Android", "Desktop"];

const guidedSuggestions = [
  { label: "✨ Video", searchValue: "video" },
  { label: "⚡ Automation", searchValue: "automation" },
  { label: "🧠 Coding", searchValue: "coding" },
  { label: "✍️ Writing", searchValue: "writing" },
  { label: "📊 Business", searchValue: "business" },
];

const emptySearchSuggestions = ["video", "writing", "business", "coding", "automation"];
const thinkingMessages = [
  "AiFinder is thinking...",
  "Analyzing your intent...",
  "Matching the best AI tools...",
];

const seoCategoryCopy = [
  {
    title: "Chatbots",
    href: "/category/chatbots",
    text: "Find AI chatbots for answering questions, customer support, research, brainstorming, and daily productivity.",
  },
  {
    title: "Image AI",
    href: "/category/image-ai",
    text: "Explore AI image generators and visual design tools for marketing, social content, thumbnails, and creative projects.",
  },
  {
    title: "Video AI",
    href: "/category/video-ai",
    text: "Compare AI video tools for editing, captions, avatars, short-form content, presentations, and creative production.",
  },
  {
    title: "Coding",
    href: "/category/coding",
    text: "Discover AI coding assistants for debugging, documentation, code generation, app building, and developer productivity.",
  },
  {
    title: "Business",
    href: "/category/business",
    text: "Browse AI business tools for operations, automation, analytics, workflows, customer support, and team productivity.",
  },
  {
    title: "AI Agents",
    href: "/category/ai-agents",
    text: "Find AI agents that can automate multi-step tasks, connect apps, research topics, and support advanced workflows.",
  },
];

const faqItems = [
  {
    question: "What is AiFinder?",
    answer:
      "AiFinder is an AI tools directory that helps people discover, search, bookmark, and compare useful AI tools by category, pricing, platform, and use case.",
  },
  {
    question: "What types of AI tools can I find?",
    answer:
      "You can browse AI tools for chatbots, image generation, video creation, voice AI, writing, coding, business, productivity, education, marketing, SEO, design, and AI agents.",
  },
  {
    question: "Can I compare AI tools?",
    answer:
      "Yes. AiFinder lets you select tools and compare important details such as category, pricing, platform support, ratings, and use cases side-by-side.",
  },
  {
    question: "Can I submit a new AI tool?",
    answer:
      "Yes. You can submit an AI tool through the Submit Tool page. Submissions are reviewed before they appear publicly on AiFinder.",
  },
];

function normalizeCategory(category: string | null | undefined) {
  if (category === "Chat") return "Chatbots";
  if (category === "Image") return "Image AI";
  if (category === "Video") return "Video AI";
  if (category === "Audio") return "Voice AI";

  return category || "Productivity";
}

function normalizePricing(pricing: string | null | undefined): Tool["pricing"] {
  if (pricing === "Free" || pricing === "Paid" || pricing === "Free + Paid") {
    return pricing;
  }

  if (pricing === "Freemium") return "Free + Paid";

  return "Free + Paid";
}

export default function Home() {
  const { isLightMode, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const { compareSlugs, toggleCompare, clearCompare } = useCompare();

  const [databaseTools, setDatabaseTools] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSearchThinking, setIsSearchThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);

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
          category: normalizeCategory(tool.category),
          description: tool.description,
          website: tool.website,
          pricing: normalizePricing(tool.pricing),
          platforms: tool.platforms || ["Web"],
          featured: tool.featured || false,
          bestFor: tool.best_for || tool.description,
          useCases: tool.use_cases || [],
          ios: tool.ios || undefined,
          android: tool.android || undefined,
        })) || [];

      setDatabaseTools(formattedTools);
      setIsLoadingTools(false);
    }

    loadToolsFromSupabase();
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aifinder-favorites");
    const savedSearches = localStorage.getItem("aifinder-recent-searches");

    if (savedFavorites) setFavoriteSlugs(JSON.parse(savedFavorites));
    if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
  }, []);

  useEffect(() => {
    const hasSearchState =
      Boolean(search.trim()) ||
      selectedCategory !== "All" ||
      selectedPricing !== "All" ||
      selectedPlatform !== "All";

    setIsSearchModalOpen(hasSearchState);
  }, [search, selectedCategory, selectedPricing, selectedPlatform]);

  useEffect(() => {
    if (!isSearchThinking) return;

    setThinkingStep(0);

    const stepTimer = window.setInterval(() => {
      setThinkingStep((step) => Math.min(step + 1, thinkingMessages.length - 1));
    }, 320);

    const doneTimer = window.setTimeout(() => {
      window.clearInterval(stepTimer);
      setIsSearchThinking(false);
      setIsSearchModalOpen(true);
    }, 900);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(doneTimer);
    };
  }, [isSearchThinking]);

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

  const submitSearch = (value: string) => {
    const cleanValue = value.trim();
    setSearch(cleanValue);
    if (cleanValue) {
      saveRecentSearch(cleanValue);
      setIsSearchModalOpen(false);
      setIsSearchThinking(true);
    }
  };

  const applySearch = (value: string) => {
    setSearchDraft(value);
    submitSearch(value);
  };

  const favoriteTools = tools.filter((tool) =>
    favoriteSlugs.includes(toolSlug(tool.name))
  );

  const compareTools = tools.filter((tool) =>
    compareSlugs.includes(toolSlug(tool.name))
  );

  const rankedFilteredTools = useMemo(() => {
    return rankToolsForQuery(tools, search)
      .filter(({ tool, score }) => {
        const platforms = Array.isArray(tool.platforms) ? tool.platforms : [];
        // Empty search keeps the original directory behavior. Specific searches
        // hide very weak matches and then rank by the generic intent score.
        const matchesSearch = !search.trim() || score > 0;
        const matchesCategory =
          selectedCategory === "All" || tool.category === selectedCategory;
        const matchesPricing =
          selectedPricing === "All" || tool.pricing === selectedPricing;
        const matchesPlatform =
          selectedPlatform === "All" || platforms.includes(selectedPlatform);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesPricing &&
          matchesPlatform
        );
      })
      .map(({ tool, score }) => ({ tool, score }));
  }, [tools, search, selectedCategory, selectedPricing, selectedPlatform]);

  const filteredTools = rankedFilteredTools.map(({ tool }) => tool);

  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const trendingTools = featuredTools.length
    ? featuredTools.slice(0, 6)
    : tools.slice(0, 6);

  const topRatedTools = [...tools]
    .sort((a, b) => getToolRating(b.name) - getToolRating(a.name))
    .slice(0, 8);

  const newTools = [...tools].slice(0, 8);

  const resetFilters = () => {
    setSearch("");
    setSearchDraft("");
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

  const pageBg = "ai-product-page";

  const cardBg = "ai-product-surface";

  const inputBg = "ai-product-input";

  const mutedText = "ai-product-muted";
  const softText = "ai-product-body";

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-300 ${pageBg}`}
    >
      <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <nav
          className={`relative z-10 mb-6 flex flex-col gap-4 rounded-3xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${cardBg}`}
        >
          <Link href="/" className="ai-product-heading text-lg font-black">
            AiFinder
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleTheme}
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              {isLightMode ? "🌙 Dark" : "☀️ Light"}
            </button>

            <a
              href="#categories"
              className="ai-product-button-primary px-4 py-2 text-sm"
            >
              Explore
            </a>

            <a
              href="#how-it-works"
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              How it works
            </a>

            <a
              href="#favorites"
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              ⭐ Bookmarks
            </a>

            <Link
              href="/submit"
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              Submit Tool
            </Link>
          </div>
        </nav>

        <div
          className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl sm:p-10 ${cardBg}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent [.theme-light_&]:from-cyan-50/70 [.theme-light_&]:via-transparent [.theme-light_&]:to-slate-50/70" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl [.theme-light_&]:bg-cyan-200/20" />

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 [.theme-light_&]:text-cyan-800">
              AI Search Hero
            </p>

            <h1 className="mt-3 max-w-4xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-6xl [.theme-light_&]:from-slate-950 [.theme-light_&]:via-cyan-900 [.theme-light_&]:to-slate-700">
              Ask AiFinder to match you with the right AI tools.
            </h1>

            <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${softText}`}>
              Describe what you need. AiFinder helps you search, filter, compare,
              and bookmark AI tools by use case.
            </p>

            <SearchBar
              search={searchDraft}
              inputBg={inputBg}
              onChange={(e) => setSearchDraft(e.target.value)}
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(searchDraft);
              }}
            />

            <AIGuidedSuggestions
              suggestions={guidedSuggestions}
              onSelect={applySearch}
            />

            {recentSearches.length > 0 && (
              <div className="ai-product-surface-soft mt-5 rounded-3xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="ai-nav-link text-sm font-bold text-cyan-300 [.theme-light_&]:text-cyan-800">
                    Recent searches
                  </p>

                  <button
                    onClick={clearRecentSearches}
                    className="text-xs font-semibold text-slate-400 transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:text-slate-600 [.theme-light_&]:hover:text-cyan-800"
                  >
                    Clear
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2.5">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => applySearch(item)}
                      className="ai-product-chip rounded-full px-3 py-1 text-xs font-semibold"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none ${inputBg}`}
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
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none ${inputBg}`}
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
                className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold outline-none ${inputBg}`}
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
                className="ai-product-button-secondary mt-4 px-4 py-2 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {isLoadingTools && (
          <div className={`mt-8 rounded-3xl border p-6 ${cardBg}`}>
            <p className={`ai-subtitle ${mutedText}`}>Loading AI tools...</p>
          </div>
        )}

        {!isLoadingTools && !hasActiveFilters && (
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
              mutedText={mutedText}
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
              mutedText={mutedText}
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
              mutedText={mutedText}
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
              mutedText={mutedText}
            />

            <section
              id="categories"
              className="mt-12"
            >
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 [.theme-light_&]:text-cyan-800">
                  Browse by Category
                </p>

                <h2 className="mt-2 text-3xl font-black text-white [.theme-light_&]:text-slate-950">
                  Explore AI tools by what you need to do
                </h2>

                <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
                  Start with a category, then narrow your search by pricing,
                  platform, rating, and use case.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <motion.div
                    key={category}
                    whileHover={
                      shouldReduceMotion ? undefined : { scale: 1.005 }
                    }
                  >
                    <Link
                      href={`/category/${slugify(category)}`}
                      className={`block h-full rounded-3xl border p-5 ${cardBg} ai-product-hover`}
                    >
                      <div className="text-3xl">{getIcon(category)}</div>

                      <h3 className="mt-4 text-lg font-bold text-white [.theme-light_&]:text-slate-950">{category}</h3>

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
            </section>

            <AIOnboardingSteps />

            <SeoCategorySection cardBg={cardBg} mutedText={mutedText} />
            <HowItWorksSection cardBg={cardBg} mutedText={mutedText} />
            <FaqSection cardBg={cardBg} mutedText={mutedText} softText={softText} />
          </>
        )}

        {isSearchThinking && (
          <SearchThinkingOverlay message={thinkingMessages[thinkingStep]} />
        )}

        {hasActiveFilters && isSearchModalOpen && !isSearchThinking && (
          <SearchResultsModal
            filteredTools={filteredTools}
            rankedTools={rankedFilteredTools}
            search={search}
            favoriteSlugs={favoriteSlugs}
            onToggleFavorite={toggleFavorite}
            compareSlugs={compareSlugs}
            onToggleCompare={toggleCompare}
            emptySuggestions={emptySearchSuggestions}
            onSelectSuggestion={applySearch}
            onClose={() => setIsSearchModalOpen(false)}
            cardBg={cardBg}
            mutedText={mutedText}
          />
        )}

        {compareSlugs.length > 0 && (
          <CompareBar
            compareTools={compareTools}
            clearCompare={clearCompare}
            cardBg={cardBg}
          />
        )}

        <Footer toolsCount={tools.length} mutedText={mutedText} />
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
  mutedText,
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
  mutedText: string;
}) {
  return (
    <section
      id={title.includes("Saved") ? "favorites" : undefined}
      className="ai-product-section"
    >
      <h2 className="ai-product-section-title text-3xl">{title}</h2>

      {tools.length === 0 ? (
        <div className={`mt-5 rounded-3xl border p-6 ${mutedText} ${cardBg}`}>
          {emptyText}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.name}
              tool={tool}
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
    </section>
  );
}

function SearchResultsModal({
  filteredTools,
  rankedTools,
  search,
  favoriteSlugs,
  onToggleFavorite,
  compareSlugs,
  onToggleCompare,
  emptySuggestions,
  onSelectSuggestion,
  onClose,
  cardBg,
  mutedText,
}: {
  filteredTools: Tool[];
  rankedTools: RankedTool[];
  search: string;
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  emptySuggestions: string[];
  onSelectSuggestion: (value: string) => void;
  onClose: () => void;
  cardBg: string;
  mutedText: string;
}) {
  const aiSearchResponse = getConversationalSearchResponse(search, filteredTools.length);

  return (
    <div className="ai-modal-backdrop fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto px-4 py-6 sm:py-10">
      <motion.section
        aria-label="AI search results"
        aria-modal="true"
        role="dialog"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`relative w-full max-w-6xl rounded-3xl border p-4 shadow-2xl sm:p-6 ${cardBg}`}
      >
        <button
          type="button"
          aria-label="Close search results"
          onClick={onClose}
          className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="pr-12 sm:pr-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              AI Search Results
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              {filteredTools.length} tools found
            </h2>

            {search.trim() && (
              <p className={`mt-2 text-sm ${mutedText}`}>Query: {search}</p>
            )}
          </div>
        </div>

        {aiSearchResponse && (
          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3 shadow-[inset_0_0_22px_rgba(34,211,238,0.05)] [.theme-light_&]:bg-cyan-50/70">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
              AiFinder Response
            </p>
            <p className="ai-product-body mt-1 text-sm font-semibold leading-6">
              {aiSearchResponse}
            </p>
          </div>
        )}

        <div className="tool-details-modal-scroll mt-5 max-h-[72vh] overflow-y-auto overscroll-contain sm:pr-1">
          {filteredTools.length > 0 ? (
            <ToolList
              rankedTools={rankedTools}
              search={search}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={onToggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={onToggleCompare}
              cardBg={cardBg}
            />
          ) : (
            <AIEmptySearchState
              suggestions={emptySuggestions}
              onSelect={onSelectSuggestion}
              cardBg={cardBg}
              mutedText={mutedText}
            />
          )}
        </div>
      </motion.section>
    </div>
  );
}

function SearchThinkingOverlay({ message }: { message: string }) {
  return (
    <div className="ai-modal-backdrop fixed inset-0 z-[85] flex items-center justify-center px-4">
      <div className="ai-thinking-panel rounded-3xl border border-cyan-400/20 bg-slate-950/80 p-6 text-center shadow-2xl">
        <div className="ai-brain-loader mx-auto">
          <svg
            className="ai-head-svg"
            viewBox="0 0 160 132"
            role="img"
            aria-label="AiFinder thinking"
          >
            <defs>
              <linearGradient id="aiHeadStroke" x1="20" x2="140" y1="18" y2="120">
                <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.82" />
                <stop offset="55%" stopColor="#a855f7" stopOpacity="0.52" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.34" />
              </linearGradient>
              <radialGradient id="aiBrainLeft" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#cffafe" stopOpacity="0.95" />
                <stop offset="44%" stopColor="#22d3ee" stopOpacity="0.48" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
              </radialGradient>
              <radialGradient id="aiBrainRight" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#f5d0fe" stopOpacity="0.92" />
                <stop offset="48%" stopColor="#a855f7" stopOpacity="0.48" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
              </radialGradient>
              <filter id="aiGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              className="ai-head-silhouette"
              d="M76 12c-28 0-50 21-50 49 0 15 6 27 15 36l-2 17h28c8 4 17 6 27 6h26c5 0 9-4 9-9V92l9-4c3-1 4-5 2-8l-10-18c-1-28-24-50-54-50Z"
              fill="rgba(15,23,42,0.36)"
              stroke="url(#aiHeadStroke)"
              strokeWidth="2"
            />
            <path
              className="ai-head-profile"
              d="M54 39c-7 7-11 15-11 25 0 16 11 30 28 36"
              fill="none"
              stroke="rgba(103,232,249,0.34)"
              strokeLinecap="round"
              strokeWidth="1.4"
            />

            <g className="ai-brain-hemispheres" filter="url(#aiGlow)">
              <path
                className="ai-brain-half ai-brain-half-left"
                d="M72 38c-13-5-28 5-28 20 0 6 3 11 7 15-1 8 5 15 14 15h11V43c-1-2-2-4-4-5Z"
                fill="url(#aiBrainLeft)"
              />
              <path
                className="ai-brain-half ai-brain-half-right"
                d="M85 38c13-5 28 5 28 20 0 6-3 11-7 15 1 8-5 15-14 15H81V43c1-2 2-4 4-5Z"
                fill="url(#aiBrainRight)"
              />
            </g>

            <g className="ai-neural-lines">
              <path d="M57 57L78 66L101 55" />
              <path d="M59 76L78 66L99 78" />
              <path d="M78 50V84" />
            </g>

            <g className="ai-neural-dots">
              <circle cx="57" cy="57" r="4" />
              <circle cx="101" cy="55" r="4" />
              <circle cx="59" cy="76" r="4" />
              <circle cx="99" cy="78" r="4" />
              <circle cx="78" cy="50" r="3.5" />
              <circle cx="78" cy="84" r="3.5" />
            </g>

            <text className="ai-brain-core-text" x="79" y="71" textAnchor="middle">
              AI
            </text>
            <rect className="ai-brain-scan" x="35" y="34" width="88" height="58" rx="26" />
          </svg>
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
          AI Search Engine
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-200">{message}</p>
      </div>
    </div>
  );
}

function AIEmptySearchState({
  suggestions,
  onSelect,
  cardBg,
  mutedText,
}: {
  suggestions: string[];
  onSelect: (value: string) => void;
  cardBg: string;
  mutedText: string;
}) {
  return (
    <div className={`mt-5 rounded-3xl border p-6 ${cardBg}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
        AI Search Assistant
      </p>

      <h3 className="mt-3 text-2xl font-black">
        AiFinder couldn&apos;t find a strong match yet.
      </h3>

      <p className={`mt-3 max-w-2xl text-sm leading-7 ${mutedText}`}>
        Try a broader phrase like video, writing, business, coding, or
        automation. You can also submit a tool if something is missing.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="ai-product-chip rounded-full px-3 py-2 text-xs font-bold"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function SeoCategorySection({
  cardBg,
  mutedText,
}: {
  cardBg: string;
  mutedText: string;
}) {
  return (
    <section
      className="ai-product-section"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          AI Tools Directory
        </p>

        <h2 className="ai-product-section-title mt-2 text-3xl">
          Find AI tools for every workflow
        </h2>

        <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
          AiFinder is built to help users quickly discover practical AI software.
          Whether you need a chatbot, image generator, video editor, AI writing
          assistant, coding copilot, SEO tool, design app, or AI agent, you can
          search by purpose and compare options before opening a tool.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seoCategoryCopy.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`rounded-3xl border p-5 ${cardBg} ai-product-hover`}
          >
            <h3 className="ai-product-heading text-xl font-black">{item.title}</h3>
            <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
              {item.text}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection({
  cardBg,
  mutedText,
}: {
  cardBg: string;
  mutedText: string;
}) {
  const steps = [
    {
      title: "Search",
      text: "Use the search bar to find AI tools by name, category, task, or use case.",
    },
    {
      title: "Filter",
      text: "Narrow results by category, pricing, and platform so you can find the right option faster.",
    },
    {
      title: "Compare",
      text: "Add up to three tools to the compare view and review details side-by-side.",
    },
    {
      title: "Save",
      text: "Bookmark useful tools locally in your browser so you can come back to them later.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="ai-product-section"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 [.theme-light_&]:text-cyan-800">
          How it works
        </p>

        <h2 className="ai-product-section-title mt-2 text-3xl">
          A faster way to choose AI tools
        </h2>

        <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
          Instead of opening many websites one by one, AiFinder gives you one
          clean place to explore, search, bookmark, and compare AI tools.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className={`rounded-3xl border p-5 ${cardBg} ai-product-hover`}>
            <div className="ai-product-chip flex h-10 w-10 items-center justify-center rounded-2xl font-black">
              {index + 1}
            </div>

            <h3 className="ai-product-heading mt-4 text-lg font-black">{step.title}</h3>

            <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection({
  cardBg,
  mutedText,
  softText,
}: {
  cardBg: string;
  mutedText: string;
  softText: string;
}) {
  return (
    <section
      className="ai-product-section"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          FAQ
        </p>

        <h2 className="ai-product-section-title mt-2 text-3xl">
          Questions about AiFinder
        </h2>

        <p className={`mt-3 text-sm leading-7 ${mutedText}`}>
          Quick answers for people searching for an AI tools directory.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {faqItems.map((item) => (
          <div key={item.question} className={`rounded-3xl border p-5 ${cardBg} ai-product-hover`}>
            <h3 className="ai-product-heading text-lg font-black">{item.question}</h3>

            <p className={`mt-3 text-sm leading-7 ${softText}`}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ToolList({
  rankedTools,
  search,
  favoriteSlugs,
  onToggleFavorite,
  compareSlugs,
  onToggleCompare,
  cardBg,
}: {
  rankedTools: RankedTool[];
  search: string;
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  cardBg: string;
}) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rankedTools.map(({ tool, score }) => (
        <ToolCard
          key={tool.name}
          tool={tool}
          favoriteSlugs={favoriteSlugs}
          onToggleFavorite={onToggleFavorite}
          compareSlugs={compareSlugs}
          onToggleCompare={onToggleCompare}
          badge={getSearchConfidenceLabel(score)}
          matchExplanation={getSearchMatchExplanation(tool, search)}
          cardBg={cardBg}
        />
      ))}
    </div>
  );
}

function ToolCard({
  tool,
  favoriteSlugs,
  onToggleFavorite,
  compareSlugs,
  onToggleCompare,
  badge,
  matchExplanation,
  cardBg,
}: {
  tool: Tool;
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  badge?: string;
  matchExplanation?: string;
  cardBg: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const explicitSlug =
    typeof (tool as Tool & { slug?: string | null }).slug === "string"
      ? (tool as Tool & { slug?: string | null }).slug?.trim()
      : "";
  const slug = explicitSlug || toolSlug(tool.name);
  const isFavorite = favoriteSlugs.includes(slug);
  const isCompared = compareSlugs.includes(slug);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const badgeTone =
    badge === "Strong match"
      ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 [.theme-light_&]:text-cyan-800"
      : badge === "Good match"
        ? "border-sky-400/25 bg-sky-400/10 text-sky-200 [.theme-light_&]:text-sky-800"
        : "border-slate-500/30 bg-slate-500/10 text-slate-200 [.theme-light_&]:text-slate-700";

  const handleCardClick = () => {
    if (!slug) {
      console.warn("[AiFinder ToolCard] Missing slug; navigation skipped", {
        toolName: tool.name,
      });
      return;
    }

    setIsModalOpen(true);
  };

  return (
    <div className="relative h-full">
      <motion.article
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick();
          }
        }}
        animate={
          isModalOpen && !shouldReduceMotion
            ? { opacity: 0.45, scale: 0.985 }
            : { opacity: 1, scale: 1 }
        }
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`group relative isolate flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.75rem] border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 sm:p-5 ${cardBg} ai-product-hover`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/[0.055] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 [.theme-light_&]:from-cyan-100/60" />

        <div className="pointer-events-none relative z-20 mb-5 flex items-start justify-between gap-3">
          {badge ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeTone}`}>
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {badge}
            </span>
          ) : (
            <span className="ai-product-chip inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              {tool.category}
            </span>
          )}

          <div className="pointer-events-auto relative z-40 ml-auto flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                isFavorite
                  ? `Remove ${tool.name} from favorites`
                  : `Save ${tool.name}`
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleFavorite(tool);
              }}
              className={`rounded-full border border-white/10 bg-black/20 transition-colors duration-200 hover:border-yellow-300/35 hover:bg-yellow-300/[0.08] [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/80 [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:border-amber-300/60 [.theme-light_&]:hover:bg-amber-50/80 ${
                isFavorite ? "text-yellow-300" : "text-slate-300"
              }`}
            >
              <Star
                className={isFavorite ? "fill-current" : ""}
                aria-hidden="true"
              />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={
                isCompared
                  ? `Remove ${tool.name} from comparison`
                  : `Compare ${tool.name}`
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleCompare(slug);
              }}
              className={`rounded-full border border-white/10 bg-black/20 px-3 text-xs font-bold transition-colors duration-200 hover:border-cyan-300/35 hover:bg-cyan-300/[0.08] [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/80 [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:border-cyan-700/20 [.theme-light_&]:hover:bg-cyan-50/80 ${
                isCompared ? "text-cyan-200" : "text-slate-200"
              }`}
            >
              {isCompared ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Compare
            </Button>
          </div>
        </div>

        <div className="pointer-events-none relative z-20 flex flex-1 flex-col">
          <div className="flex items-start gap-4">
            <ToolLogo tool={tool} isOpening={isModalOpen && !shouldReduceMotion} />

            <div className="min-w-0 flex-1">
              <h3 className="ai-product-heading line-clamp-2 text-lg font-black leading-tight">
                {tool.name}
              </h3>

              <p className="ai-product-chip mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold">
                {tool.category}
              </p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-yellow-200 [.theme-light_&]:text-amber-600">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            {getToolRating(tool.name)}
            <span className="text-slate-400 [.theme-light_&]:text-slate-600">
              ({getReviewCount(tool.name).toLocaleString()} reviews)
            </span>
          </p>

          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300 [.theme-light_&]:text-slate-700">
            {tool.description}
          </p>

          {matchExplanation && (
            <p className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs font-semibold leading-5 text-cyan-100 [.theme-light_&]:border-cyan-700/15 [.theme-light_&]:bg-cyan-50/80 [.theme-light_&]:text-cyan-800">
              {matchExplanation}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500 [.theme-light_&]:text-slate-600">
              Details
            </span>

            <span className="ai-product-button-primary inline-flex min-h-0 items-center gap-1.5 px-3 py-2 text-xs">
              View
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </motion.article>

      <ToolDetailsModal
        tool={{
          name: tool.name,
          slug,
          category: tool.category,
          description: tool.description,
          website: tool.website,
          logoUrl: tool.logoUrl || getLogoUrl(tool.website),
          pricing: tool.pricing,
          platforms: tool.platforms,
          rating: getToolRating(tool.name),
          reviewCount: getReviewCount(tool.name),
          bestFor: tool.bestFor,
          useCases: tool.useCases,
          ios: tool.ios,
          android: tool.android,
        }}
        isOpen={isModalOpen}
        isCompared={isCompared}
        isFavorite={isFavorite}
        onClose={() => setIsModalOpen(false)}
        onToggleCompare={() => onToggleCompare(slug)}
        onToggleFavorite={() => onToggleFavorite(tool)}
      />
    </div>
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
      <CompareAssistant tools={compareTools} />

      <div className={`rounded-3xl border p-4 shadow-2xl ${cardBg}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ai-nav-link text-sm font-bold text-cyan-300">
              Compare Tools ({compareTools.length}/3)
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {compareTools.map((tool) => (
                <span
                  key={tool.name}
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

function Footer({
  toolsCount,
  mutedText,
}: {
  toolsCount: number;
  mutedText: string;
}) {
  return (
    <footer className="mt-20 border-t border-white/10 py-10">
      <div className="ai-layout-polish mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-black">AiFinder</h3>

          <p className={`mt-3 max-w-xl text-sm leading-7 ${mutedText}`}>
            AiFinder is a searchable AI tools directory for discovering,
            comparing, and bookmarking useful AI tools for productivity,
            creativity, automation, coding, research, writing, video, image
            generation, business, marketing, SEO, design, and AI agents.
          </p>

          <p className="ai-product-muted mt-4 text-xs">
            © 2026 AiFinder. All rights reserved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="ai-nav-link text-sm font-bold text-cyan-300">Explore</p>

            <div className="ai-product-muted mt-4 flex flex-col gap-3 text-sm">
              <a href="#categories" className="transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:hover:text-cyan-800">
                Categories
              </a>

              <a href="#favorites" className="transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:hover:text-cyan-800">
                Bookmarks
              </a>

              <Link href="/compare" className="transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:hover:text-cyan-800">
                Compare
              </Link>
            </div>
          </div>

          <div>
            <p className="ai-nav-link text-sm font-bold text-cyan-300">Platform</p>

            <div className="ai-product-muted mt-4 flex flex-col gap-3 text-sm">
              <Link href="/submit" className="transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:hover:text-cyan-800">
                Submit Tool
              </Link>

              <a href="#how-it-works" className="transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:hover:text-cyan-800">
                How it works
              </a>

              <a href="#categories" className="transition-colors duration-200 hover:text-cyan-300 [.theme-light_&]:hover:text-cyan-800">
                AI categories
              </a>
            </div>
          </div>

          <div>
            <p className="ai-nav-link text-sm font-bold text-cyan-300">Stats</p>

            <div className="ai-product-muted mt-4 space-y-3 text-sm">
              <p>{toolsCount}+ AI tools</p>
              <p>{categories.length} categories</p>
              <p>Compare up to 3 tools</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ToolLogo({
  tool,
  isOpening = false,
}: {
  tool: Tool;
  isOpening?: boolean;
}) {
  const [hasLogoError, setHasLogoError] = useState(false);
  const iconFallback = getIcon(tool.category);

  return (
    <motion.div
      animate={isOpening ? { scale: 1.16 } : { scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)]"
    >
      {hasLogoError ? (
        <span className="text-2xl" aria-hidden="true">
          {iconFallback}
        </span>
      ) : (
        <img
          src={getLogoUrl(tool.website)}
          alt={`${tool.name} logo`}
          className="h-9 w-9 object-contain"
          onError={() => setHasLogoError(true)}
        />
      )}
    </motion.div>
  );
}
