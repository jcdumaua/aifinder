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

export default function Home() {
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const searchText =
        `${tool.name} ${tool.category} ${tool.description}`.toLowerCase();

      return searchText.includes(search.toLowerCase());
    });
  }, [search]);

  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <nav className="mb-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-xl">
          <Link href="/" className="text-lg font-black">
            AiFinder
          </Link>

          <a
            href="#categories"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950"
          >
            Explore
          </a>
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
              Explore premium AI tools for chat, images, video, voice,
              music, coding, writing, productivity, and automation.
            </p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search AI tools, categories, or use cases..."
              className="mt-8 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white shadow-xl outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>
        </div>

        {search ? (
          <section className="mt-10">
            <h2 className="mb-5 text-2xl font-bold sm:text-3xl">
              Search Results
            </h2>

            <ToolList tools={filteredTools} />
          </section>
        ) : (
          <>
            <section id="categories" className="mt-10">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Browse AI categories
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={`/category/${slugify(category)}`}
                    className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:bg-white/[0.08]"
                  >
                    <div className="text-3xl">
                      {getIcon(category)}
                    </div>

                    <h3 className="mt-4 text-lg font-bold">
                      {category}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {
                        tools.filter(
                          (tool) => tool.category === category
                        ).length
                      }{" "}
                      tools
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold sm:text-3xl">
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
        <a
          key={tool.name}
          href={`/tool/${toolSlug(tool.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 border-b border-white/10 p-4 last:border-b-0 hover:bg-white/10"
        >
          <div className="text-slate-500">
            {index + 1}.
          </div>

          <ToolLogo tool={tool} />

          <div>
            <h3 className="font-bold">{tool.name}</h3>

            <p className="text-sm text-cyan-300">
              {tool.category}
            </p>

            <p className="text-sm text-slate-400">
              {tool.description}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <a
      href={tool.website}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-2 hover:bg-white/[0.08]"
    >
      <ToolLogo tool={tool} />

      <h3 className="mt-4 font-bold">
        {tool.name}
      </h3>

      <p className="mt-2 text-sm text-cyan-300">
        {tool.category}
      </p>

      <p className="mt-2 text-sm text-slate-400">
        {tool.description}
      </p>
    </a>
  );
}

function ToolLogo({ tool }: { tool: Tool }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white">
      <img
        src={getLogoUrl(tool.website)}
        alt={`${tool.name} logo`}
        className="h-8 w-8"
      />
    </div>
  );
}