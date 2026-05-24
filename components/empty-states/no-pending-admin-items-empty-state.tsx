import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-states/empty-state";

type NoPendingAdminItemsEmptyStateProps = {
  className?: string;
};

export function NoPendingAdminItemsEmptyState({
  className,
}: NoPendingAdminItemsEmptyStateProps) {
  // Use this in admin review queues when there are no pending submissions or actions.
  return (
    <EmptyState
      icon={ClipboardCheck}
      title="No pending admin items"
      description="Everything is reviewed for now. New submissions and admin tasks will appear here."
      className={className}
    />
  );
}
