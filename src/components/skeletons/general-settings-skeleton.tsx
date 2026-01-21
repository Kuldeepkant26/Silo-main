import { Skeleton } from "../ui/skeleton";

export function GeneralSettingsSkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-y-4">
      <Skeleton className="h-6 w-52 rounded-full" />

      <div className="grid grid-cols-1 gap-y-4 pb-8">
        <div className="flex flex-col gap-y-2">
          <Skeleton className="h-6 w-48 rounded-full" />

          <Skeleton className="h-8 w-full rounded-md" />
        </div>

        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}
