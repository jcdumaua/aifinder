"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  categories,
  getIcon,
  getLogoUrl,
  getReviewCount,
  getToolRating,
  slugify,
  toolSlug,
  tools,
  Tool,
} from "../../data/tools";
import { useTheme } from "../../theme-provider";

export default function CategoryPage() {
  const { isLightMode, toggleTheme } = useTheme();
  const params = useParams();
  const slug = params.slug as string;

  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem("aifinder-favorites");

    if (savedFavorites) {
      setFavoriteSlugs(JSON.parse(savedFavorites));
    }
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

  const category = categories.find((cat) => slugify(cat) === slug);
  const categoryTools = tools.filter((tool) => tool.category === category);

  const pageBg = isLightMode
    ? "bg-slate-100 text-slate-950"
    : "bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white";

  const cardBg = isLightMode
    ? "bg-white border-slate-200"
    : "bg-white/[0.04] border-white/10";

  const softText = isLightMode ? "text-slate-600" : "text-slate-400";

  if (!category) {
    return (
      <main className={`min-h-screen p-6 ${pageBg}`}>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          ← Back home
        </Link>

        <h1 className="mt-8 text-4xl font-black">Category not found</h1>
      </main>
    );
  }

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
            href="/#favorites"
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            ⭐ Bookmarks
          </Link>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>

        <div className={`mt-8 rounded-[2rem] border p-6 sm:p-8 ${cardBg}`}>
          <div className="text-5xl">{getIcon(category)}</div>

          <p className="mt-5 text-sm font-bold uppercase tracking-widest text-cyan-300">
            Category
          </p>

          <h1 className="mt-2 text-4xl font-black sm:text-5xl">
            {category}
          </h1>

          <p className={`mt-4 max-w-2xl text-lg leading-8 ${softText}`}>
            Discover the best {category.toLowerCase()} tools for productivity,
            creativity, business, and AI workflows.
          </p>

          <div className="mt-6 inline-block rounded-full bg-white/5 px-5 py-3 text-sm">
            {categoryTools.length} AI tools listed
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTools.map((tool) => {
            const isFavorite = favoriteSlugs.includes(toolSlug(tool.name));

            return (
              <div
                key={tool.name}
                className={`group relative rounded-3xl border p-5 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08] ${cardBg}`}
              >
                <button
                  onClick={() => toggleFavorite(tool)}
                  className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-sm hover:bg-white/10"
                >
                  {isFavorite ? "★" : "☆"}
                </button>

                <Link href={`/tool/${toolSlug(tool.name)}`}>
                  <ToolLogo tool={tool} />

                  <div className="mt-5 flex items-center gap-2 pr-10">
                    <h3 className="font-bold">{tool.name}</h3>

                    {tool.featured && (
                      <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-xs font-bold text-cyan-200">
                        Featured
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-cyan-300">
                    {tool.category}
                  </p>

                  <p className="mt-1 text-sm text-yellow-300">
                    ⭐ {getToolRating(tool.name)} (
                    {getReviewCount(tool.name).toLocaleString()} reviews)
                  </p>

                  <p className={`mt-3 text-sm leading-7 ${softText}`}>
                    {tool.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {tool.useCases?.slice(0, 3).map((useCase) => (
                      <span
                        key={useCase}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm text-cyan-300">
                      {tool.pricing}
                    </span>

                    <span className="text-sm font-bold group-hover:text-cyan-300">
                      View Tool →
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function ToolLogo({ tool }: { tool: Tool }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-white">
      <img
        src={getLogoUrl(tool.website)}
        alt={`${tool.name} logo`}
        className="h-9 w-9"
      />
    </div>
  );
}