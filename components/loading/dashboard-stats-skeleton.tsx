import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardStatsSkeletonProps = {
  count?: number;
  className?: string;
};

function getSkeletonCount(count: number) {
  return Math.max(1, Math.min(count, 8));
}

export function DashboardStatsSkeleton({
  count = 4,
  className,
}: DashboardStatsSkeletonProps) {
  // Use this in admin/dashboard stats panels while counts are loading.
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: getSkeletonCount(count) }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl"
        >
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-5 h-10 w-20" />
          <Skeleton className="mt-4 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
