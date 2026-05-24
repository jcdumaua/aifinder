import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TableListSkeletonProps = {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
};

function getSkeletonCount(count: number, max: number) {
  return Math.max(1, Math.min(count, max));
}

export function TableListSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: TableListSkeletonProps) {
  const safeRows = getSkeletonCount(rows, 12);
  const safeColumns = getSkeletonCount(columns, 8);

  // Use this for admin tables, audit logs, submission lists, and other data lists.
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]",
        className
      )}
    >
      {showHeader && (
        <div
          className="grid gap-4 border-b border-white/10 p-4"
          style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: safeColumns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-3/4 rounded-full" />
          ))}
        </div>
      )}

      <div className="divide-y divide-white/10">
        {Array.from({ length: safeRows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 p-4"
            style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: safeColumns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={cn(
                  "h-4",
                  columnIndex === 0 ? "w-full" : "w-4/5"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
