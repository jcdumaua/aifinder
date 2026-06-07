"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AIGuidedSuggestions } from "../components/home/AIGuidedSuggestions";
import { AIOnboardingSteps } from "../components/home/AIOnboardingSteps";
import { CompareAssistant } from "../components/home/CompareAssistant";
import { SearchBar } from "../components/home/SearchBar";
import {
  PublicToolCard,
  type PublicToolCardData,
} from "@/components/public/tool-card";
import { ToolDetailsModal } from "@/components/tool-details-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeToolCategory } from "@/lib/tool-categories";
import { useOverlayScrollLock } from "@/lib/use-overlay-scroll-lock";
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

type FilterSelectProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  className: string;
  isMounted: boolean;
  onValueChange: (value: string) => void;
  getOptionLabel?: (value: string) => string;
};

function FilterSelect({
  id,
  label,
  value,
  placeholder,
  options,
  className,
  isMounted,
  onValueChange,
  getOptionLabel = (option) => option,
}: FilterSelectProps) {
  const displayValue = getOptionLabel(value);

  if (!isMounted) {
    return (
      <button
        id={id}
        type="button"
        aria-disabled="true"
        aria-label={label}
        tabIndex={-1}
        className={`flex items-center justify-between gap-2 ${className}`}
      >
        <span className="min-w-0 truncate">{displayValue}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
      </button>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {getOptionLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function subscribeToHydrationStore() {
  return () => {};
}

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
  return normalizeToolCategory(category);
}

function normalizePricing(pricing: string | null | undefined): Tool["pricing"] {
  if (pricing === "Free" || pricing === "Paid" || pricing === "Free + Paid") {
    return pricing;
  }

  if (pricing === "Freemium") return "Free + Paid";

  return "Free + Paid";
}

function toPublicToolCardData(tool: Tool): PublicToolCardData {
  const explicitSlug =
    typeof (tool as Tool & { slug?: string | null }).slug === "string"
      ? (tool as Tool & { slug?: string | null }).slug?.trim()
      : "";
  const slug = explicitSlug || toolSlug(tool.name);

  return {
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
    fallbackIcon: getIcon(tool.category),
  };
}

export default function Home() {
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
  const [selectedTool, setSelectedTool] = useState<PublicToolCardData | null>(
    null,
  );
  const [selectedCardKey, setSelectedCardKey] = useState<string | null>(null);

  const tools = databaseTools;
  const areFilterSelectsMounted = useSyncExternalStore(
    subscribeToHydrationStore,
    () => true,
    () => false,
  );

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

  const selectedOriginalTool = selectedTool
    ? tools.find((tool) => toolSlug(tool.name) === selectedTool.slug)
    : undefined;

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
      className={`min-h-dvh overflow-x-hidden transition-colors duration-300 ${pageBg}`}
    >
      <section className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8 xl:max-w-7xl">
        <nav
          className={`relative z-10 mb-6 flex flex-col gap-4 rounded-3xl border px-5 py-4 xl:flex-row xl:items-center xl:justify-between ${cardBg}`}
        >
          <Link href="/" className="ai-product-heading text-lg font-black">
            AiFinder
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Button
              asChild
              className="ai-product-button-primary px-4 py-2 text-sm"
            >
              <a href="#categories">Explore</a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              <a href="#how-it-works">How it works</a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              <a href="#favorites">Bookmarks</a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              <Link href="/submit">Submit Tool</Link>
            </Button>
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

            <h1 className="mt-3 max-w-4xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl xl:text-6xl [.theme-light_&]:from-slate-950 [.theme-light_&]:via-cyan-900 [.theme-light_&]:to-slate-700">
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="h-auto px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-transparent hover:text-cyan-300 [.theme-light_&]:text-slate-600 [.theme-light_&]:hover:text-cyan-800"
                  >
                    Clear
                  </Button>
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

            <div className="mt-5 grid gap-2.5 md:grid-cols-3">
              <div>
                <Label htmlFor="home-category-filter" className="sr-only">
                  Filter by category
                </Label>
                <FilterSelect
                  id="home-category-filter"
                  label="Filter tools by category"
                  value={selectedCategory}
                  placeholder="All Categories"
                  options={["All", ...categories]}
                  className={`h-auto w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold ${inputBg}`}
                  isMounted={areFilterSelectsMounted}
                  onValueChange={setSelectedCategory}
                  getOptionLabel={(category) =>
                    category === "All" ? "All Categories" : category
                  }
                />
              </div>

              <div>
                <Label htmlFor="home-pricing-filter" className="sr-only">
                  Filter by pricing
                </Label>
                <FilterSelect
                  id="home-pricing-filter"
                  label="Filter tools by pricing"
                  value={selectedPricing}
                  placeholder="All Pricing"
                  options={pricingOptions}
                  className={`h-auto w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold ${inputBg}`}
                  isMounted={areFilterSelectsMounted}
                  onValueChange={setSelectedPricing}
                  getOptionLabel={(price) =>
                    price === "All" ? "All Pricing" : price
                  }
                />
              </div>

              <div>
                <Label htmlFor="home-platform-filter" className="sr-only">
                  Filter by platform
                </Label>
                <FilterSelect
                  id="home-platform-filter"
                  label="Filter tools by platform"
                  value={selectedPlatform}
                  placeholder="All Platforms"
                  options={platformOptions}
                  className={`h-auto w-full rounded-2xl border px-4 py-2.5 text-sm font-semibold ${inputBg}`}
                  isMounted={areFilterSelectsMounted}
                  onValueChange={setSelectedPlatform}
                  getOptionLabel={(platform) =>
                    platform === "All" ? "All Platforms" : platform
                  }
                />
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                className="ai-product-button-secondary mt-4 px-4 py-2 text-sm"
              >
                Clear filters
              </Button>
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
              selectedCardKey={selectedCardKey}
              onOpenTool={(tool, cardKey) => {
                setSelectedTool(tool);
                setSelectedCardKey(cardKey);
              }}
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
              selectedCardKey={selectedCardKey}
              onOpenTool={(tool, cardKey) => {
                setSelectedTool(tool);
                setSelectedCardKey(cardKey);
              }}
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
              selectedCardKey={selectedCardKey}
              onOpenTool={(tool, cardKey) => {
                setSelectedTool(tool);
                setSelectedCardKey(cardKey);
              }}
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
              selectedCardKey={selectedCardKey}
              onOpenTool={(tool, cardKey) => {
                setSelectedTool(tool);
                setSelectedCardKey(cardKey);
              }}
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

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            selectedCardKey={selectedCardKey}
            onOpenTool={(tool, cardKey) => {
              setSelectedTool(tool);
              setSelectedCardKey(cardKey);
            }}
            emptySuggestions={emptySearchSuggestions}
            onSelectSuggestion={applySearch}
            onClose={() => setIsSearchModalOpen(false)}
            cardBg={cardBg}
            mutedText={mutedText}
          />
        )}

        <ToolDetailsModal
          tool={selectedTool}
          isOpen={Boolean(selectedTool)}
          isCompared={
            selectedTool ? compareSlugs.includes(selectedTool.slug) : false
          }
          isFavorite={
            selectedTool ? favoriteSlugs.includes(selectedTool.slug) : false
          }
          onClose={() => {
            setSelectedTool(null);
            setSelectedCardKey(null);
          }}
          onToggleCompare={() => {
            if (selectedTool) toggleCompare(selectedTool.slug);
          }}
          onToggleFavorite={() => {
            if (selectedOriginalTool) toggleFavorite(selectedOriginalTool);
          }}
        />

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
  selectedCardKey,
  onOpenTool,
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
  selectedCardKey: string | null;
  onOpenTool: (tool: PublicToolCardData, cardKey: string) => void;
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
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => {
            const publicTool = toPublicToolCardData(tool);
            const cardKey = `${title}:${publicTool.slug}`;

            return (
              <PublicToolCard
                key={cardKey}
                tool={publicTool}
                variant="homepage"
                isFavorite={favoriteSlugs.includes(publicTool.slug)}
                isCompared={compareSlugs.includes(publicTool.slug)}
                isOpen={selectedCardKey === cardKey}
                onOpenTool={(selectedPublicTool) =>
                  onOpenTool(selectedPublicTool, cardKey)
                }
                onToggleFavorite={() => onToggleFavorite(tool)}
                onToggleCompare={() => onToggleCompare(publicTool.slug)}
                badge={badge}
                cardBg={cardBg}
              />
            );
          })}
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
  selectedCardKey,
  onOpenTool,
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
  selectedCardKey: string | null;
  onOpenTool: (tool: PublicToolCardData, cardKey: string) => void;
  emptySuggestions: string[];
  onSelectSuggestion: (value: string) => void;
  onClose: () => void;
  cardBg: string;
  mutedText: string;
}) {
  const aiSearchResponse = getConversationalSearchResponse(search, filteredTools.length);
  useOverlayScrollLock(true);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div suppressHydrationWarning={true} className="aifinder-responsive-modal-backdrop ai-modal-backdrop fixed inset-0 z-[80] flex w-screen items-center justify-center">
      <motion.section
        aria-label="AI search results"
        aria-modal="true"
        role="dialog"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`aifinder-responsive-modal-panel ai-corner-safe-panel relative isolate flex max-w-6xl flex-col overflow-hidden rounded-3xl border bg-white p-4 shadow-2xl [.theme-dark_&]:bg-slate-950 sm:p-5 lg:p-6 2xl:max-w-7xl ${cardBg}`}
      >
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-white [.theme-dark_&]:bg-slate-950" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(14,116,144,0.10),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.72),rgba(255,255,255,0.20),rgba(248,250,252,0))] [.theme-dark_&]:bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(59,130,246,0.04),rgba(15,23,42,0))]" />

        <button
          type="button"
          aria-label="Close search results"
          onClick={onClose}
          className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="relative z-10 min-w-0 pr-12 sm:pr-14">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 [.theme-light_&]:text-cyan-800">
              AI Search Results
            </p>

            <h2 className="ai-product-section-title mt-2 text-2xl font-black sm:text-3xl">
              {filteredTools.length} tools found
            </h2>

            {search.trim() && (
              <p className={`mt-2 break-words text-sm ${mutedText}`}>Query: {search}</p>
            )}
          </div>
        </div>

        {aiSearchResponse && (
          <div className="relative z-10 mt-5 min-w-0 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3 shadow-[inset_0_0_22px_rgba(34,211,238,0.05)] [.theme-light_&]:bg-cyan-50/70">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
              AiFinder Response
            </p>
            <p className="ai-product-body mt-1 break-words text-sm font-semibold leading-6">
              {aiSearchResponse}
            </p>
          </div>
        )}

        <div className="tool-details-modal-scroll relative z-10 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain pt-5 sm:pr-2">
          {filteredTools.length > 0 ? (
            <ToolList
              rankedTools={rankedTools}
              search={search}
              favoriteSlugs={favoriteSlugs}
              onToggleFavorite={onToggleFavorite}
              compareSlugs={compareSlugs}
              onToggleCompare={onToggleCompare}
              selectedCardKey={selectedCardKey}
              onOpenTool={onOpenTool}
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
  useOverlayScrollLock(true);

  return (
    <div className="aifinder-responsive-modal-backdrop ai-modal-backdrop fixed inset-0 z-[85] flex w-screen items-center justify-center">
      <div className="aifinder-responsive-modal-panel ai-thinking-panel ai-corner-safe-panel relative isolate max-w-md overflow-hidden rounded-3xl border border-cyan-900/10 bg-white/95 p-6 text-center shadow-2xl shadow-slate-950/10">
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-white" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_0%,rgba(14,116,144,0.10),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.68),rgba(255,255,255,0.22),rgba(248,250,252,0))]" />
        <div className="relative z-10">
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

        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-cyan-800">
          AI Search Engine
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-700">{message}</p>
        </div>
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
  selectedCardKey,
  onOpenTool,
  cardBg,
}: {
  rankedTools: RankedTool[];
  search: string;
  favoriteSlugs: string[];
  onToggleFavorite: (tool: Tool) => void;
  compareSlugs: string[];
  onToggleCompare: (slug: string) => void;
  selectedCardKey: string | null;
  onOpenTool: (tool: PublicToolCardData, cardKey: string) => void;
  cardBg: string;
}) {
  return (
    <div className="grid max-w-full grid-cols-1 gap-4 overflow-x-hidden md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rankedTools.map(({ tool, score }) => {
        const publicTool = toPublicToolCardData(tool);
        const cardKey = `search:${publicTool.slug}`;

        return (
          <PublicToolCard
            key={cardKey}
            tool={publicTool}
            variant="homepage"
            isFavorite={favoriteSlugs.includes(publicTool.slug)}
            isCompared={compareSlugs.includes(publicTool.slug)}
            isOpen={selectedCardKey === cardKey}
            onOpenTool={(selectedPublicTool) =>
              onOpenTool(selectedPublicTool, cardKey)
            }
            onToggleFavorite={() => onToggleFavorite(tool)}
            onToggleCompare={() => onToggleCompare(publicTool.slug)}
            badge={getSearchConfidenceLabel(score)}
            matchExplanation={getSearchMatchExplanation(tool, search)}
            cardBg={cardBg}
            useCornerSafeShell
          />
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
            <Button
              type="button"
              variant="outline"
              onClick={clearCompare}
              className="ai-product-button-secondary px-4 py-2 text-sm"
            >
              Clear
            </Button>

            <Button
              asChild
              className="ai-product-button-primary px-4 py-2 text-sm"
            >
              <Link href="/compare">Compare Now</Link>
            </Button>
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
      <div className="ai-layout-polish mx-auto flex max-w-6xl flex-col gap-8 xl:max-w-7xl xl:flex-row xl:items-start xl:justify-between">
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
