import { FilePlus2 } from "lucide-react";

import { EmptyState } from "@/components/empty-states/empty-state";

type NoSubmittedToolsEmptyStateProps = {
  className?: string;
};

export function NoSubmittedToolsEmptyState({
  className,
}: NoSubmittedToolsEmptyStateProps) {
  // Use this where user-submitted tools would appear but none have been submitted yet.
  return (
    <EmptyState
      icon={FilePlus2}
      title="No submitted tools yet"
      description="Submitted tools will appear here after people send them for review."
      className={className}
    />
  );
}
