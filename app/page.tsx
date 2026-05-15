"use client";

import { useMemo, useState } from "react";

const tools = [
  { name: "ChatGPT", category: "Chatbots", website: "https://chatgpt.com", description: "AI chatbot for writing, coding, images, voice chat, and productivity.", featured: true },
  { name: "Claude", category: "Chatbots", website: "https://claude.ai", description: "AI assistant for research, writing, coding, documents, and analysis.", featured: true },
  { name: "Gemini", category: "Chatbots", website: "https://gemini.google.com", description: "Google AI assistant for search, writing, planning, and productivity.", featured: true },
  { name: "Perplexity", category: "Chatbots", website: "https://perplexity.ai", description: "AI answer engine with web search and cited answers.", featured: true },
  { name: "Microsoft Copilot", category: "Chatbots", website: "https://copilot.microsoft.com", description: "Microsoft AI assistant for work, search, writing, and images.", featured: false },
  { name: "Poe", category: "Chatbots", website: "https://poe.com", description: "Multi-model AI chat platform with different AI bots.", featured: false },
  { name: "Character.AI", category: "Chatbots", website: "https://character.ai", description: "AI character chatbot platform for roleplay and entertainment.", featured: false },
  { name: "Grok", category: "Chatbots", website: "https://grok.com", description: "AI chatbot by xAI for chat, search, and real-time answers.", featured: false },

  { name: "Midjourney", category: "Image AI", website: "https://www.midjourney.com", description: "AI image generator for art, realistic visuals, and creative scenes.", featured: true },
  { name: "DALL·E", category: "Image AI", website: "https://chatgpt.com", description: "AI image generation and editing from OpenAI.", featured: true },
  { name: "Leonardo AI", category: "Image AI", website: "https://leonardo.ai", description: "AI image platform for art, design, game assets, and graphics.", featured: true },
  { name: "Adobe Firefly", category: "Image AI", website: "https://firefly.adobe.com", description: "Adobe AI image generation tools for creative and commercial design.", featured: false },
  { name: "Canva AI", category: "Image AI", website: "https://www.canva.com/ai-image-generator", description: "AI design and image creation tools for social media and graphics.", featured: false },
  { name: "Ideogram", category: "Image AI", website: "https://ideogram.ai", description: "AI image generator known for posters, typography, and design.", featured: false },

  { name: "Runway", category: "Video AI", website: "https://runwayml.com", description: "AI video generation and editing for creators, marketers, and studios.", featured: true },
  { name: "Pika", category: "Video AI", website: "https://pika.art", description: "AI tool for turning prompts and images into videos.", featured: false },
  { name: "Kling AI", category: "Video AI", website: "https://klingai.com", description: "AI video generator for cinematic text-to-video and image-to-video.", featured: true },
  { name: "CapCut AI", category: "Video AI", website: "https://www.capcut.com", description: "AI video editing tool for captions, reels, templates, and effects.", featured: false },
  { name: "Synthesia", category: "Video AI", website: "https://www.synthesia.io", description: "AI avatar video platform for business and training videos.", featured: false },
  { name: "HeyGen", category: "Video AI", website: "https://www.heygen.com", description: "AI avatar video generator for sales, marketing, and presentations.", featured: false },

  { name: "ElevenLabs", category: "Voice AI", website: "https://elevenlabs.io", description: "AI voice generation, cloning, narration, and dubbing.", featured: true },
  { name: "Murf AI", category: "Voice AI", website: "https://murf.ai", description: "AI voiceover generator for videos, ads, and presentations.", featured: false },
  { name: "PlayHT", category: "Voice AI", website: "https://play.ht", description: "AI text-to-speech and voice generation platform.", featured: false },

  { name: "Suno", category: "Music AI", website: "https://suno.com", description: "AI music and song generator from text prompts.", featured: true },
  { name: "Udio", category: "Music AI", website: "https://udio.com", description: "AI music generator for songs, vocals, and instrumentals.", featured: true },
  { name: "Soundraw", category: "Music AI", website: "https://soundraw.io", description: "AI music generator for creators and commercial projects.", featured: false },

  { name: "Cursor", category: "Coding", website: "https://cursor.com", description: "AI-powered code editor for developers.", featured: true },
  { name: "GitHub Copilot", category: "Coding", website: "https://github.com/features/copilot", description: "AI coding assistant for autocomplete and code help.", featured: true },
  { name: "Replit AI", category: "Coding", website: "https://replit.com/ai", description: "AI coding assistant inside Replit.", featured: false },

  { name: "Grammarly", category: "Writing", website: "https://www.grammarly.com", description: "AI writing, grammar, tone, and rewriting assistant.", featured: true },
  { name: "Jasper", category: "Writing", website: "https://www.jasper.ai", description: "AI writing tool for blogs, ads, emails, and marketing.", featured: false },
  { name: "Copy.ai", category: "Writing", website: "https://www.copy.ai", description: "AI writing and marketing content generator.", featured: false },

  { name: "Notion AI", category: "Productivity", website: "https://www.notion.so/product/ai", description: "AI workspace assistant for notes, summaries, and planning.", featured: true },
  { name: "Otter.ai", category: "Productivity", website: "https://otter.ai", description: "AI meeting notes, transcription, and summaries.", featured: false },
  { name: "Gamma", category: "Productivity", website: "https://gamma.app", description: "AI presentation and document builder.", featured: true },

  { name: "Zapier AI", category: "Automation", website: "https://zapier.com/ai", description: "AI automation for workflows, apps, and business tasks.", featured: true },
  { name: "Make", category: "Automation", website: "https://www.make.com", description: "Visual workflow automation platform.", featured: false },
  { name: "Gumloop", category: "Automation", website: "https://www.gumloop.com", description: "AI workflow and agent automation builder.", featured: false },
];

const categories = [...new Set(tools.map((tool) => tool.category))];

const getIcon = (category: string) => {
  const icons: Record<string, string> = {
    Chatbots: "🤖",
    "Image AI": "🖼️",
    "Video AI": "🎬",
    "Voice AI": "🎤",
    "Music AI": "🎵",
    Coding: "💻",
    Writing: "✍️",
    Productivity: "⚡",
    Automation: "🔁",
  };

  return icons[category] || "✨";
};

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchCategory = !activeCategory || tool.category === activeCategory;
      const searchText = `${tool.name} ${tool.category} ${tool.description}`.toLowerCase();
      return matchCategory && searchText.includes(search.toLowerCase());
    });
  }, [activeCategory, search]);

  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            AI Tools Directory
          </p>
          <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
            AiFinder
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Find the best AI tools for chat, images, video, voice, music, coding,
            writing, productivity, and automation.
          </p>

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setActiveCategory(null);
            }}
            placeholder="Search AI tools, categories, or use cases..."
            className="mt-8 w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white outline-none placeholder:text-slate-500"
          />
        </div>

        {!activeCategory && !search && (
          <>
            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                    Categories
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">Browse AI categories</h2>
                </div>
                <p className="text-sm text-slate-400">{tools.length} tools listed</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="text-3xl">{getIcon(category)}</div>
                    <h3 className="mt-4 text-xl font-bold">{category}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {tools.filter((tool) => tool.category === category).length} tools
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                  Featured
                </p>
                <h2 className="mt-2 text-3xl font-bold">Featured AI tools</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {featuredTools.map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="text-3xl">{getIcon(tool.category)}</div>
                    <h3 className="mt-4 font-bold">{tool.name}</h3>
                    <p className="mt-2 text-sm text-cyan-300">{tool.category}</p>
                    <p className="mt-2 text-sm text-slate-400">{tool.description}</p>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {search && (
          <ToolList
            title="Search Results"
            tools={filteredTools}
            onBack={() => {
              setSearch("");
              setActiveCategory(null);
            }}
          />
        )}

        {activeCategory && !search && (
          <ToolList
            title={activeCategory}
            tools={filteredTools}
            onBack={() => setActiveCategory(null)}
          />
        )}
      </section>
    </main>
  );
}

function ToolList({
  title,
  tools,
  onBack,
}: {
  title: string;
  tools: typeof import("./page").tools;
  onBack: () => void;
}) {
  return (
    <section className="mt-10">
      <button
        onClick={onBack}
        className="mb-6 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
      >
        ← Back
      </button>

      <h2 className="mb-5 text-3xl font-bold">{title}</h2>

      {tools.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-400">
          No tools found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          {tools.map((tool, index) => (
            <a
              key={tool.name}
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 border-b border-white/10 p-5 last:border-b-0 hover:bg-white/10"
            >
              <div className="text-slate-500">{index + 1}.</div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/20 text-xl">
                {getIcon(tool.category)}
              </div>
              <div>
                <h3 className="font-bold">{tool.name}</h3>
                <p className="text-sm text-cyan-300">{tool.category}</p>
                <p className="text-sm text-slate-400">{tool.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}