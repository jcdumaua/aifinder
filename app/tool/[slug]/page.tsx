"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  findToolBySlug,
  getLogoUrl,
  getReviewCount,
  getToolRating,
  toolSlug,
  tools as staticTools,
  Tool,
} from "../../data/tools";
import { useTheme } from "../../theme-provider";
import { supabase } from "../../../lib/supabase";

export default function ToolPage() {
  const { isLightMode, toggleTheme } = useTheme();
  const params = useParams();
  const slug = params.slug as string;

  const [databaseTools, setDatabaseTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadToolsFromSupabase() {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase tool page error:", error.message);
        setIsLoading(false);
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
      setIsLoading(false);
    }

    loadToolsFromSupabase();
  }, []);

  const databaseTool = databaseTools.find((item) => toolSlug(item.name) === slug);
  const fallbackTool = findToolBySlug(slug);
  const tool = databaseTool || fallbackTool;

  const allTools = databaseTools.length > 0 ? databaseTools : staticTools;

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  const softText = isLightMode ? "text-slate-600" : "text-slate-300";

  if (isLoading && !tool) {
    return (
      <main className={`min-h-screen p-6 ${pageBg}`}>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← Back Home
        </Link>

        <h1 className="mt-8 text-4xl font-black">Loading tool...</h1>
      </main>
    );
  }

  if (!tool) {
    return (
      <main className={`min-h-screen p-6 ${pageBg}`}>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← Back Home
        </Link>

        <h1 className="mt-8 text-4xl font-black">Tool not found</h1>
      </main>
    );
  }

  const platforms = tool.platforms || [];
  const useCases = tool.useCases || [];
  const bestFor = tool.bestFor || "General use";
  const pricing = tool.pricing || "Free + Paid";

  const similarTools = allTools
    .filter(
      (item) =>
        item.category === tool.category &&
        item.name !== tool.name
    )
    .slice(0, 4);

  return (
    <main className={`min-h-screen transition-colors duration-300 ${pageBg}`}>
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap gap-3">
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

          <button
            onClick={toggleTheme}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <div className={`mt-8 overflow-hidden rounded-[2rem] border ${cardBg}`}>
          <div className="relative border-b border-white/10 p-6 sm:p-10">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <ToolLogo tool={tool} large />

                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                    {tool.category}
                  </p>

                  <h1 className="mt-2 text-4xl font-black sm:text-5xl">
                    {tool.name}
                  </h1>

                  <p className={`mt-4 max-w-2xl text-lg leading-8 ${softText}`}>
                    {tool.description}
                  </p>

                  <div className="mt-5 inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                    ⭐ {getToolRating(tool.name)} / 5 ·{" "}
                    {getReviewCount(tool.name).toLocaleString()} reviews
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  🌐 Web
                </a>

                {tool.ios && (
                  <a
                    href={tool.ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-5 py-3 text-sm transition hover:bg-white/10"
                  >
                    🍎 iOS
                  </a>
                )}

                {tool.android && (
                  <a
                    href={tool.android}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-5 py-3 text-sm transition hover:bg-white/10"
                  >
                    🤖 Android
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-3">
            <InfoCard title="Pricing" value={pricing} cardBg={cardBg} />
            <InfoCard title="Best For" value={bestFor} cardBg={cardBg} />

            <div className={`rounded-3xl border p-6 ${cardBg}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                Platforms
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {platforms.length > 0 ? (
                  platforms.map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    >
                      {platform}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    Web
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Use Cases
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {useCases.length > 0 ? (
                useCases.map((useCase) => (
                  <span
                    key={useCase}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200"
                  >
                    {useCase}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                  General AI use
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              About
            </p>

            <div className={`mt-5 max-w-3xl space-y-5 text-lg leading-8 ${softText}`}>
              <p>
                {tool.name} is one of the AI tools in the{" "}
                {tool.category.toLowerCase()} category.
              </p>

              <p>
                It can help users with{" "}
                {useCases.length > 0
                  ? useCases.join(", ").toLowerCase()
                  : "everyday AI-powered tasks"}.
              </p>

              <p>
                AiFinder recommends this tool for users looking for{" "}
                {bestFor.toLowerCase()} solutions powered by artificial
                intelligence.
              </p>
            </div>
          </div>
        </div>

        {similarTools.length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Similar Tools
            </p>

            <h2 className="mt-2 text-3xl font-black">
              More {tool.category} tools
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarTools.map((similarTool) => (
                <Link
                  key={similarTool.name}
                  href={`/tool/${toolSlug(similarTool.name)}`}
                  className={`group rounded-3xl border p-5 transition hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}
                >
                  <ToolLogo tool={similarTool} />

                  <h3 className="mt-4 font-bold">{similarTool.name}</h3>

                  <p className="mt-2 text-sm text-cyan-300">
                    {similarTool.category}
                  </p>

                  <p className="mt-1 text-sm text-yellow-300">
                    ⭐ {getToolRating(similarTool.name)} (
                    {getReviewCount(similarTool.name).toLocaleString()} reviews)
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
    <div className={`rounded-3xl border p-6 ${cardBg}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
        {title}
      </p>

      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}

function ToolLogo({
  tool,
  large = false,
}: {
  tool: Tool;
  large?: boolean;
}) {
  const [logoError, setLogoError] = useState(false);

  const logoSrc =
    !logoError && tool.logoUrl ? tool.logoUrl : getLogoUrl(tool.website);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white ${
        large ? "h-24 w-24 rounded-[2rem]" : "h-14 w-14 rounded-2xl"
      }`}
    >
      <img
        src={logoSrc}
        alt={`${tool.name} logo`}
        className={large ? "h-14 w-14 object-contain" : "h-9 w-9 object-contain"}
        onError={() => setLogoError(true)}
      />
    </div>
  );
}