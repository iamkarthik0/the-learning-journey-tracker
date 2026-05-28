import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceRecordsTableSkeleton } from '@/components/Dashboard/attendance/attendance-records-table-skeleton';

export default function AttendanceLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Page header skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="h-9 w-40" />
            </div>
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-11 w-full sm:w-44" />
        </div>

        {/* Records table skeleton */}
        <AttendanceRecordsTableSkeleton />
      </div>
    </div>
  );
}
