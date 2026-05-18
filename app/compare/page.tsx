"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getLogoUrl,
  getReviewCount,
  getToolRating,
  toolSlug,
  tools as staticTools,
  Tool,
} from "../data/tools";
import { useCompare } from "../compare-provider";
import { useTheme } from "../theme-provider";
import { supabase } from "../../lib/supabase";

export default function ComparePage() {
  const { compareSlugs, clearCompare } = useCompare();
  const { isLightMode, toggleTheme } = useTheme();

  const [databaseTools, setDatabaseTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadToolsFromSupabase() {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase compare page error:", error.message);
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

  const allTools = databaseTools.length > 0 ? databaseTools : staticTools;

  const compareTools = allTools.filter((tool) =>
    compareSlugs.includes(toolSlug(tool.name))
  );

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  return (
    <main className={`min-h-screen ${pageBg}`}>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Home
          </Link>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>

          {compareTools.length > 0 && (
            <button
              onClick={clearCompare}
              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
            >
              Clear Compare
            </button>
          )}
        </div>

        <div className={`mt-8 rounded-[2rem] border p-6 ${cardBg}`}>
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            Compare
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Compare AI Tools
          </h1>

          <p className="mt-4 text-slate-400">
            Compare pricing, platforms, ratings, use cases, and best use cases
            side-by-side.
          </p>

          {isLoading && (
            <p className="mt-4 text-sm text-slate-400">
              Loading comparison tools...
            </p>
          )}
        </div>

        {compareTools.length === 0 ? (
          <div className={`mt-8 rounded-3xl border p-8 ${cardBg}`}>
            <p className="text-slate-400">
              No tools selected yet. Go back home and click “+ Compare” on up to
              3 tools.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <div
              className={`min-w-[850px] overflow-hidden rounded-3xl border ${cardBg}`}
            >
              <div
                className="grid border-b border-white/10"
                style={{
                  gridTemplateColumns: `180px repeat(${compareTools.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="p-5 font-bold text-cyan-300">Feature</div>

                {compareTools.map((tool) => (
                  <div key={tool.name} className="p-5">
                    <ToolLogo tool={tool} />

                    <h2 className="mt-4 text-xl font-black">{tool.name}</h2>

                    <p className="mt-1 text-sm text-cyan-300">
                      {tool.category}
                    </p>
                  </div>
                ))}
              </div>

              <CompareRow
                label="Rating"
                values={compareTools.map(
                  (tool) =>
                    `⭐ ${getToolRating(tool.name)} / 5 (${getReviewCount(
                      tool.name
                    ).toLocaleString()} reviews)`
                )}
              />

              <CompareRow
                label="Pricing"
                values={compareTools.map((tool) => tool.pricing || "Free + Paid")}
              />

              <CompareRow
                label="Best For"
                values={compareTools.map(
                  (tool) => tool.bestFor || "General use"
                )}
              />

              <CompareRow
                label="Platforms"
                values={compareTools.map((tool) =>
                  tool.platforms && tool.platforms.length > 0
                    ? tool.platforms.join(", ")
                    : "Web"
                )}
              />

              <CompareRow
                label="Use Cases"
                values={compareTools.map((tool) =>
                  tool.useCases && tool.useCases.length > 0
                    ? tool.useCases.join(", ")
                    : "General AI use"
                )}
              />

              <CompareRow
                label="Description"
                values={compareTools.map((tool) => tool.description)}
              />

              <div
                className="grid border-t border-white/10"
                style={{
                  gridTemplateColumns: `180px repeat(${compareTools.length}, minmax(220px, 1fr))`,
                }}
              >
                <div className="p-5 font-bold text-cyan-300">Visit</div>

                {compareTools.map((tool) => (
                  <div key={tool.name} className="p-5">
                    <a
                      href={tool.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
                    >
                      Visit Website ↗
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div
      className="grid border-b border-white/10 last:border-b-0"
      style={{
        gridTemplateColumns: `180px repeat(${values.length}, minmax(220px, 1fr))`,
      }}
    >
      <div className="p-5 font-bold text-cyan-300">{label}</div>

      {values.map((value, index) => (
        <div key={index} className="p-5 text-sm leading-6 text-slate-400">
          {value}
        </div>
      ))}
    </div>
  );
}

function ToolLogo({ tool }: { tool: Tool }) {
  const [logoError, setLogoError] = useState(false);

  const logoSrc =
    !logoError && tool.logoUrl ? tool.logoUrl : getLogoUrl(tool.website);

  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white">
      <img
        src={logoSrc}
        alt={`${tool.name} logo`}
        className="h-9 w-9 object-contain"
        onError={() => setLogoError(true)}
      />
    </div>
  );
}