import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ToolCardSkeletonGridProps = {
  count?: number;
  className?: string;
};

function getSkeletonCount(count: number) {
  return Math.max(1, Math.min(count, 12));
}

export function ToolCardSkeleton() {
  // Use this where tool cards load, such as the home tool grid or category pages.
  return (
    <article
      aria-hidden="true"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl bg-white/15" />

        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </article>
  );
}

export function ToolCardSkeletonGrid({
  count = 6,
  className,
}: ToolCardSkeletonGridProps) {
  return (
    <div
      className={cn(
        "grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: getSkeletonCount(count) }).map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
    </div>
  );
}
