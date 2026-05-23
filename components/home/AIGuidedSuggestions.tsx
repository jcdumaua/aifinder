type AIGuidedSuggestionsProps = {
  suggestions: {
    label: string;
    searchValue: string;
  }[];
  onSelect: (searchValue: string) => void;
};

export function AIGuidedSuggestions({
  suggestions,
  onSelect,
}: AIGuidedSuggestionsProps) {
  return (
    <section className="mt-3">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={`${suggestion.searchValue}-${suggestion.label}`}
            onClick={() => onSelect(suggestion.searchValue)}
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 sm:text-sm"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  );
}
