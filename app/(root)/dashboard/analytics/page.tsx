import { BarChart3 } from 'lucide-react';
import { ChapterAnalyticsClient } from '@/components/Dashboard/analytics/student-analytics-client';
import { AnalyticsCharts } from '@/components/Dashboard/analytics/analytics-charts';
import { getSubjects } from '@/lib/actions/subject-actions';
import { getChapters } from '@/lib/actions/chapter-actions';

export default async function AnalyticsPage() {
  const [subjectsData, chaptersData] = await Promise.all([
    getSubjects(),
    getChapters(),
  ]);

  // Sirf zaroori fields client ko bhejo
  const subjects = subjectsData.map((s) => ({
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    grade_level: s.grade_level,
  }));

  const chapters = chaptersData.map((c) => ({
    chapter_id: c.chapter_id,
    subject_id: c.subject_id,
    subject_name: c.subject_name,
    chapter_name: c.chapter_name,
    section: c.section,
    order_index: c.order_index,
    is_completed: !!c.is_completed,
    start_date: c.start_date,
    end_date: c.end_date,
    questions: (c.questions ?? []).map((q) => ({
      text: q.text,
      is_completed: q.is_completed,
      taught_date: q.taught_date ?? null,
    })),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              Subject aur chapter ke hisaab se question-level attendance dekho
            </p>
          </div>
        </div>

        <AnalyticsCharts subjects={subjects} chapters={chapters} />

        <ChapterAnalyticsClient subjects={subjects} chapters={chapters} />
      </div>
    </div>
  );
}
