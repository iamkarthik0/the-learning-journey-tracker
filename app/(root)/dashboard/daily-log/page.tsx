import { BookMarked } from 'lucide-react';
import { DailyLogClient } from '@/components/Dashboard/dailyLog/daily-log-client';
import { getChapters } from '@/lib/actions/chapter-actions';
import { getGradesWithSections } from '@/lib/actions/analytics-actions';

export default async function DailyLogPage() {
  const [chapters, gradesWithSections] = await Promise.all([
    getChapters(),
    getGradesWithSections(),
  ]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
              Daily Log
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {today} · Mark questions as taught for today
            </p>
          </div>
        </div>

        <DailyLogClient chapters={chapters} gradesWithSections={gradesWithSections} />
      </div>
    </div>
  );
}
