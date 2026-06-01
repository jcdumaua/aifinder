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
    <section className="ai-product-surface tool-details-modal-scroll mb-3 max-h-[42dvh] overflow-y-auto rounded-3xl border p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          AI Compare Assistant
        </p>
        <p className="ai-product-muted text-xs">
          Here is my quick read on your selected tools
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {tools.map((tool, index) => (
          <div
            key={tool.name}
            className="ai-product-surface-soft rounded-2xl border p-3"
          >
            <p className="ai-product-heading text-sm font-bold">{tool.name}</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200 [.theme-light_&]:text-cyan-800">
              {getRecommendation(tool, index)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
