import { BarChart3 } from 'lucide-react';
import { AnalyticsClient } from '@/components/Dashboard/analytics/analytics-client';
import { getGradesWithSections } from '@/lib/actions/analytics-actions';

export default async function AnalyticsPage() {
  const gradesWithSections = await getGradesWithSections();

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-md">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Filter by Grade, Section, and Subject to view chapter-wise attendance
            </p>
          </div>
        </div>

        <AnalyticsClient gradesWithSections={gradesWithSections} />
      </div>
    </div>
  );
}
