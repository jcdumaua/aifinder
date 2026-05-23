import type { Tool } from "../../app/data/tools";

type CompareAssistantProps = {
  tools: Tool[];
};

const fallbackRecommendations = [
  "Best for beginners",
  "Fastest learning curve",
  "Most affordable option",
];

function getRecommendation(tool: Tool, index: number) {
  const metadata = [
    tool.category,
    tool.bestFor,
    tool.pricing,
    ...(Array.isArray(tool.useCases) ? tool.useCases : []),
  ]
    .join(" ")
    .toLowerCase();

  if (metadata.includes("video")) return "Best for content creators";
  if (metadata.includes("automation") || metadata.includes("agent")) {
    return "Best for automation workflows";
  }
  if (metadata.includes("free")) return "Most affordable option";
  if (metadata.includes("writing") || metadata.includes("content")) {
    return "Best for writing teams";
  }
  if (metadata.includes("coding") || metadata.includes("developer")) {
    return "Best for builders";
  }

  return fallbackRecommendations[index % fallbackRecommendations.length];
}

export function CompareAssistant({ tools }: CompareAssistantProps) {
  if (tools.length === 0) return null;

  return (
    <section className="mb-3 rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-4 shadow-[0_0_34px_rgba(34,211,238,0.16)] backdrop-blur-xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          AI Compare Assistant
        </p>
        <p className="text-xs text-slate-400">
          Early guidance based on selected tool metadata
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {tools.map((tool, index) => (
          <div
            key={tool.name}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <p className="text-sm font-bold text-white">{tool.name}</p>
            <p className="mt-1 text-sm text-cyan-200">
              {getRecommendation(tool, index)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
