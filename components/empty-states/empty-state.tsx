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
        "rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-10 text-center shadow-2xl",
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h2 className="mt-5 text-xl font-black text-white">{title}</h2>

      {description && (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
