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
    <section className="mt-3.5">
      <div className="flex flex-wrap gap-2.5">
        {suggestions.map((suggestion) => (
          <button
            key={`${suggestion.searchValue}-${suggestion.label}`}
            onClick={() => onSelect(suggestion.searchValue)}
            className="ai-product-chip rounded-full px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400/30 sm:text-sm"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  );
}
