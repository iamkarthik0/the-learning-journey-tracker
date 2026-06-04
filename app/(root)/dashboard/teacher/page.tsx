import { Suspense } from 'react';
import { SubjectForm } from '@/components/Dashboard/createSubject/subject-form';
import {
  SubjectsList,
  SubjectsListSkeleton,
} from '@/components/Dashboard/createSubject/subjects-list';
import { ChapterForm } from '@/components/Dashboard/createChapter/chapter-form';
import {
  ChaptersList,
  ChaptersListSkeleton,
} from '@/components/Dashboard/createChapter/chapters-list';
import { getTeachers } from '@/lib/actions/teacher-actions';
import { getSubjects } from '@/lib/actions/subject-actions';

async function SubjectFormWrapper() {
  const teachers = await getTeachers();
  return <SubjectForm teachers={teachers} />;
}

async function ChapterFormWrapper() {
  const subjects = await getSubjects();
  return <ChapterForm subjects={subjects} />;
}

export default function TeacherDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Teacher Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Apne subjects aur chapters yahan create karo
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create forms */}
        <div className="space-y-6">
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            }
          >
            <SubjectFormWrapper />
          </Suspense>

          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            }
          >
            <ChapterFormWrapper />
          </Suspense>
        </div>

        {/* Lists */}
        <div className="space-y-6">
          <Suspense fallback={<SubjectsListSkeleton />}>
            <SubjectsList />
          </Suspense>

          <Suspense fallback={<ChaptersListSkeleton />}>
            <ChaptersList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
