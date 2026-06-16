import { Skeleton } from '@/components/ui/skeleton';
import { getChapters } from '@/lib/actions/chapter-actions';
import { getSubjects } from '@/lib/actions/subject-actions';
import { ChaptersTable } from './chapters-table';

export async function ChaptersList() {
  const [chapters, subjects] = await Promise.all([
    getChapters(),
    getSubjects(),
  ]);

  const chaptersData = chapters.map((c) => ({
    chapter_id:   c.chapter_id,
    chapter_name: c.chapter_name,
    subject_name: c.subject_name,
    section:      c.section,
    order_index:  c.order_index,
    is_completed: !!c.is_completed,
    start_date:   c.start_date,
    end_date:     c.end_date,
    questions:    (c.questions ?? []).map((q) => ({ is_completed: q.is_completed })),
  }));

  const subjectsData = subjects.map((s) => ({
    subject_id:   s.subject_id,
    subject_name: s.subject_name,
  }));

  return <ChaptersTable chapters={chaptersData} subjects={subjectsData} />;
}

export function ChaptersListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
