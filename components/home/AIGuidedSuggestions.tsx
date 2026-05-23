type AIGuidedSuggestionsProps = {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
};

export function AIGuidedSuggestions({
  suggestions,
  onSelect,
}: AIGuidedSuggestionsProps) {
  return (
    <section className="mt-4 rounded-3xl border border-cyan-400/20 bg-slate-950/45 p-4 shadow-[0_0_30px_rgba(34,211,238,0.10)] backdrop-blur-xl">
      <p className="ai-nav-link text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
        AI Guided Suggestions
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            className="min-h-12 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-left text-sm font-semibold leading-snug text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
