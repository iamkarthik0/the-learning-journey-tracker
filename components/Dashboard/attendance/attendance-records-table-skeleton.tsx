import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AttendanceRecordsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton — 4 cards matching final UI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {[
          'border-l-blue-500',
          'border-l-emerald-500',
          'border-l-rose-500',
          'border-l-purple-500',
        ].map((border, i) => (
          <Card key={i} className={`border-l-4 ${border}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>

          {/* Filters skeleton */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Skeleton className="h-10 w-full lg:col-span-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Status filter row */}
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>

        <CardContent>
          {/* Mobile card skeleton */}
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded ml-2" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table skeleton */}
          <div className="hidden md:block">
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-7 gap-4 border-b bg-muted/40 px-4 py-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-7 gap-4 border-b px-4 py-3 last:border-b-0"
                >
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination skeleton */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
