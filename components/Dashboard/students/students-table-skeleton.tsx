import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StudentsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards Skeleton — matches StudentsTable stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {[
          'border-l-blue-500',
          'border-l-emerald-500',
          'border-l-amber-500',
          'border-l-purple-500',
        ].map((border, i) => (
          <Card key={i} className={`border-l-4 ${border}`}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="mt-2 h-7 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>

          {/* Filters skeleton — 4 columns on lg */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardHeader>

        <CardContent>
          {/* Mobile + tablet card skeleton */}
          <div className="space-y-3 lg:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table skeleton */}
          <div className="hidden lg:block">
            <div className="rounded-lg border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-7 gap-4 border-b bg-muted/40 px-4 py-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              {/* Rows */}
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
