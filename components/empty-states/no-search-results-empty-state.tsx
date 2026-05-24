import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/empty-states/empty-state";

type NoSearchResultsEmptyStateProps = {
  query?: string;
  className?: string;
};

export function NoSearchResultsEmptyState({
  query,
  className,
}: NoSearchResultsEmptyStateProps) {
  // Use this on search/filter result screens when no tools match the active query.
  const description = query
    ? `No AI tools matched "${query}". Try a broader keyword or clear some filters.`
    : "No AI tools matched the current filters. Try a broader keyword or clear some filters.";

  return (
    <EmptyState
      icon={SearchX}
      title="No matching tools found"
      description={description}
      className={className}
    />
  );
}
