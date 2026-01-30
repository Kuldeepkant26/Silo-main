import { Skeleton } from "~/components/ui/skeleton";

export function ReviewListSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-[200px] rounded-full" />
        <Skeleton className="h-9 w-[80px] rounded-full" />
        <Skeleton className="h-9 w-[80px] rounded-full" />
        <Skeleton className="h-9 w-[90px] rounded-full" />
        <Skeleton className="h-9 w-[70px] rounded-full" />
        <Skeleton className="h-9 w-[100px] rounded-full" />
        <div className="ml-auto">
          <Skeleton className="h-9 w-[140px] rounded-full" />
        </div>
      </div>

      {/* Banner skeleton */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-white">
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-3 border-b">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-4 border-b last:border-b-0"
            >
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-14 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
