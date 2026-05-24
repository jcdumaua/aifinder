import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  // Use this generic empty state when a specific empty-state variant does not fit.
  return (
    <section
      className={cn(
        "ai-product-surface rounded-[2rem] border px-6 py-10 text-center",
        className
      )}
    >
      <div className="ai-product-chip mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h2 className="ai-product-heading mt-5 text-xl font-black">{title}</h2>

      {description && (
        <p className="ai-product-muted mx-auto mt-3 max-w-md text-sm leading-6">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
