"use client";

import { useMemo, useState } from "react";

const tools = [
  { name: "ChatGPT", category: "Chatbots", website: "https://chatgpt.com", description: "AI assistant for writing, coding, images, voice chat, and productivity.", featured: true },
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
  { name: "Adobe Firefly", category: "Image AI", website: "https://firefly.adobe.com", description: "Adobe AI image generation tools for creative design.", featured: false },
  { name: "Canva AI", category: "Image AI", website: "https://www.canva.com/ai-image-generator", description: "AI design and image creation for graphics and social media.", featured: false },
  { name: "Ideogram", category: "Image AI", website: "https://ideogram.ai", description: "AI image generator for posters, typography, and design.", featured: false },
  { name: "NightCafe", category: "Image AI", website: "https://creator.nightcafe.studio", description: "AI art generator and creative community.", featured: false },
  { name: "Picsart AI", category: "Image AI", website: "https://picsart.com/ai-image-generator", description: "AI image editing and generation tools.", featured: false },

  { name: "Runway", category: "Video AI", website: "https://runwayml.com", description: "AI video generation and editing for creators.", featured: true },
  { name: "Pika", category: "Video AI", website: "https://pika.art", description: "Turn prompts and images into AI videos.", featured: false },
  { name: "Kling AI", category: "Video AI", website: "https://klingai.com", description: "AI video generator for cinematic text-to-video.", featured: true },
  { name: "CapCut AI", category: "Video AI", website: "https://www.capcut.com", description: "AI video editing for captions, reels, and effects.", featured: false },
  { name: "Synthesia", category: "Video AI", website: "https://www.synthesia.io", description: "AI avatar videos for business and training.", featured: false },
  { name: "HeyGen", category: "Video AI", website: "https://www.heygen.com", description: "AI avatar video generator for sales and marketing.", featured: false },

  { name: "ElevenLabs", category: "Voice AI", website: "https://elevenlabs.io", description: "AI voice generation, cloning, narration, and dubbing.", featured: true },
  { name: "Murf AI", category: "Voice AI", website: "https://murf.ai", description: "AI voiceover generator for videos and ads.", featured: false },
  { name: "PlayHT", category: "Voice AI", website: "https://play.ht", description: "AI text-to-speech and voice generation platform.", featured: false },
  { name: "Resemble AI", category: "Voice AI", website: "https://www.resemble.ai", description: "AI voice cloning and synthetic speech tools.", featured: false },

  { name: "Suno", category: "Music AI", website: "https://suno.com", description: "AI music and song generator from text prompts.", featured: true },
  { name: "Udio", category: "Music AI", website: "https://udio.com", description: "AI music generator for songs and vocals.", featured: true },
  { name: "Soundraw", category: "Music AI", website: "https://soundraw.io", description: "AI music generator for creators.", featured: false },
  { name: "AIVA", category: "Music AI", website: "https://www.aiva.ai", description: "AI music composition assistant.", featured: false },

  { name: "Cursor", category: "Coding", website: "https://cursor.com", description: "AI-powered code editor for developers.", featured: true },
  { name: "GitHub Copilot", category: "Coding", website: "https://github.com/features/copilot", description: "AI coding assistant for autocomplete and code help.", featured: true },
  { name: "Replit AI", category: "Coding", website: "https://replit.com/ai", description: "AI coding assistant inside Replit.", featured: false },
  { name: "Codeium", category: "Coding", website: "https://codeium.com", description: "AI coding assistant and autocomplete tool.", featured: false },
  { name: "Tabnine", category: "Coding", website: "https://www.tabnine.com", description: "AI code completion for development teams.", featured: false },
  { name: "Phind", category: "Coding", website: "https://www.phind.com", description: "AI search engine for developers.", featured: false },

  { name: "Grammarly", category: "Writing", website: "https://www.grammarly.com", description: "AI grammar, tone, writing, and rewriting assistant.", featured: true },
  { name: "Jasper", category: "Writing", website: "https://www.jasper.ai", description: "AI writing tool for blogs, ads, and marketing.", featured: false },
  { name: "Copy.ai", category: "Writing", website: "https://www.copy.ai", description: "AI writing and marketing content generator.", featured: false },
  { name: "Writesonic", category: "Writing", website: "https://writesonic.com", description: "AI writing platform for blogs, ads, and SEO.", featured: false },
  { name: "QuillBot", category: "Writing", website: "https://quillbot.com", description: "AI paraphrasing, grammar, and writing tool.", featured: false },

  { name: "Notion AI", category: "Productivity", website: "https://www.notion.so/product/ai", description: "AI workspace assistant for notes and planning.", featured: true },
  { name: "Otter.ai", category: "Productivity", website: "https://otter.ai", description: "AI meeting notes, transcription, and summaries.", featured: false },
  { name: "Gamma", category: "Productivity", website: "https://gamma.app", description: "AI presentation and document builder.", featured: true },
  { name: "Beautiful.ai", category: "Productivity", website: "https://www.beautiful.ai", description: "AI presentation design platform.", featured: false },
  { name: "Tome", category: "Productivity", website: "https://tome.app", description: "AI storytelling and presentation tool.", featured: false },

  { name: "Zapier AI", category: "Automation", website: "https://zapier.com/ai", description: "AI automation for workflows and apps.", featured: true },
  { name: "Make", category: "Automation", website: "https://www.make.com", description: "Visual workflow automation platform.", featured: false },
  { name: "Gumloop", category: "Automation", website: "https://www.gumloop.com", description: "AI workflow and agent automation builder.", featured: false },
  { name: "Lindy", category: "Automation", website: "https://www.lindy.ai", description: "AI agents for business workflows.", featured: false },
  { name: "n8n", category: "Automation", website: "https://n8n.io", description: "Workflow automation with AI agent support.", featured: false },
];

type Tool = (typeof tools)[number];

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

const getLogoUrl = (website: string) => {
  try {
    const domain = new URL(website).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
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
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 sm:text-sm">
            AI Tools Directory
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
            AiFinder
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
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
            <section className="mt-8 sm:mt-10">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 sm:text-sm">
                    Categories
                  </p>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                    Browse AI categories
                  </h2>
                </div>
                <p className="text-sm text-slate-400">{tools.length} tools listed</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div className="text-3xl">{getIcon(category)}</div>
                    <h3 className="mt-4 text-lg font-bold sm:text-xl">{category}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {tools.filter((tool) => tool.category === category).length} tools
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-10 sm:mt-12">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300 sm:text-sm">
                Featured
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Featured AI tools
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featuredTools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
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

function ToolLogo({ tool }: { tool: Tool }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
      <img
        src={getLogoUrl(tool.website)}
        alt={`${tool.name} logo`}
        className="h-8 w-8"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <a
      href={tool.website}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:bg-white/10"
    >
      <ToolLogo tool={tool} />
      <h3 className="mt-4 font-bold">{tool.name}</h3>
      <p className="mt-2 text-sm text-cyan-300">{tool.category}</p>
      <p className="mt-2 text-sm text-slate-400">{tool.description}</p>
    </a>
  );
}

function ToolList({
  title,
  tools,
  onBack,
}: {
  title: string;
  tools: Tool[];
  onBack: () => void;
}) {
  return (
    <section className="mt-8 sm:mt-10">
      <button
        onClick={onBack}
        className="mb-6 rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
      >
        ← Back
      </button>

      <h2 className="mb-5 text-2xl font-bold sm:text-3xl">{title}</h2>

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
              className="flex items-start gap-4 border-b border-white/10 p-4 last:border-b-0 hover:bg-white/10 sm:items-center sm:p-5"
            >
              <div className="pt-3 text-sm text-slate-500 sm:pt-0">
                {index + 1}.
              </div>
              <ToolLogo tool={tool} />
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