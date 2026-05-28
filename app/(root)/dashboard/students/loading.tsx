import { Skeleton } from '@/components/ui/skeleton';
import { StudentsTableSkeleton } from '@/components/Dashboard/students/students-table-skeleton';

export default function StudentsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-2 py-2 sm:px-4 sm:py-4">
      <div className="space-y-6">
        {/* Page header skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-11 w-full sm:w-36" />
        </div>

        {/* Table skeleton */}
        <StudentsTableSkeleton />
      </div>
    </div>
  );
}
