import { Suspense } from 'react';
import { BookOpen, GraduationCap } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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

const FormSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
    ))}
  </div>
);

export default function TeacherDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Teacher Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage subjects and chapters for your classes
            </p>
          </div>
        </div>

        {/* Subtle bottom divider */}
        <div className="mt-6 border-b" />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="subjects">
        <TabsList className="mb-6 h-11 gap-1 p-1">
          <TabsTrigger value="subjects" className="gap-2 rounded-md px-4 text-sm">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="chapters" className="gap-2 rounded-md px-4 text-sm">
            <GraduationCap className="h-4 w-4" />
            Chapters
          </TabsTrigger>
        </TabsList>

        {/* ── SUBJECTS ──────────────────────────────────────────── */}
        <TabsContent value="subjects">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  Create Subject
                </CardTitle>
                <CardDescription>Add a new subject</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<FormSkeleton />}>
                  <SubjectFormWrapper />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-4 shrink-0">
                <CardTitle className="text-base">All Subjects</CardTitle>
                <CardDescription>Subjects created in the system</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[60vh] pr-2">
                <Suspense fallback={<SubjectsListSkeleton />}>
                  <SubjectsList />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── CHAPTERS ──────────────────────────────────────────── */}
        <TabsContent value="chapters">
          <div className="space-y-6">
            {/* Create form — compact row at top */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  Create Chapter
                </CardTitle>
                <CardDescription>
                  Add a chapter with questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<FormSkeleton />}>
                  <ChapterFormWrapper />
                </Suspense>
              </CardContent>
            </Card>

            {/* All chapters table — full width */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">All Chapters</CardTitle>
                <CardDescription>Chapters with teaching progress</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChaptersListSkeleton />}>
                  <ChaptersList />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
