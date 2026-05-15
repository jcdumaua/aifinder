"use client";

import { useMemo, useState } from "react";

const tools = [
  { name: "ChatGPT", category: "Chatbots", website: "https://chatgpt.com", description: "AI chatbot for writing, learning, coding, and productivity." },
  { name: "Claude", category: "Chatbots", website: "https://claude.ai", description: "AI assistant for writing, research, and analysis." },
  { name: "Midjourney", category: "Image AI", website: "https://www.midjourney.com", description: "AI image generator for art and realistic visuals." },
  { name: "Canva AI", category: "Image AI", website: "https://www.canva.com/ai-image-generator", description: "AI design and image creation tools." },
  { name: "Runway", category: "Video AI", website: "https://runwayml.com", description: "AI video generation and editing." },
  { name: "ElevenLabs", category: "Voice AI", website: "https://elevenlabs.io", description: "AI voice generation and cloning." },
  { name: "Suno", category: "Music AI", website: "https://suno.com", description: "AI music and song generator." },
  { name: "Cursor", category: "Coding", website: "https://cursor.com", description: "AI code editor for developers." },
  { name: "Grammarly", category: "Writing", website: "https://www.grammarly.com", description: "AI grammar and writing assistant." },
  { name: "Gamma", category: "Presentation AI", website: "https://gamma.app", description: "AI presentation and document builder." },
];

const categories = [...new Set(tools.map((tool) => tool.category))];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchCategory = !activeCategory || tool.category === activeCategory;
      const matchSearch =
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.category.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-4xl font-black">AiFinder</h1>
        <p className="mt-2 text-slate-400">Find the best AI tools fast.</p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search AI tools..."
          className="mt-8 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 outline-none"
        />

        {!activeCategory && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left hover:bg-white/10"
              >
                <h2 className="text-xl font-bold">{category}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {tools.filter((tool) => tool.category === category).length} tools
                </p>
              </button>
            ))}
          </div>
        )}

        {activeCategory && (
          <div className="mt-8">
            <button
              onClick={() => setActiveCategory(null)}
              className="mb-6 rounded-full border border-white/10 px-4 py-2 text-sm"
            >
              ← Back
            </button>

            <h2 className="mb-5 text-3xl font-bold">{activeCategory}</h2>

            <div className="rounded-3xl border border-white/10 bg-white/5">
              {filteredTools.map((tool, index) => (
                <a
                  key={tool.name}
                  href={tool.website}
                  target="_blank"
                  className="flex items-center gap-4 border-b border-white/10 p-5 last:border-b-0 hover:bg-white/10"
                >
                  <div className="text-slate-500">{index + 1}.</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold">{tool.name}</h3>
                    <p className="text-sm text-slate-400">{tool.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}