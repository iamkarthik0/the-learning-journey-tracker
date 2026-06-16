import { Suspense } from 'react';
import { Shield, Users, CalendarDays } from 'lucide-react';
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
import { TeacherForm } from '@/components/Dashboard/createTeacher/teacher-form';
import {
  TeachersList,
  TeachersListSkeleton,
} from '@/components/Dashboard/createTeacher/teachers-list';
import { PeriodSessionForm } from '@/components/Dashboard/createPeriodSession/period-session-form';
import {
  PeriodSessionsList,
  PeriodSessionsListSkeleton,
} from '@/components/Dashboard/createPeriodSession/period-sessions-list';
import { getTeachers } from '@/lib/actions/teacher-actions';
import { getSubjects } from '@/lib/actions/subject-actions';

async function PeriodSessionFormWrapper() {
  const [teachers, subjects] = await Promise.all([getTeachers(), getSubjects()]);
  return <PeriodSessionForm teachers={teachers} subjects={subjects} />;
}

const FormSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
    ))}
  </div>
);

export default function PrincipalPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Principal
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage teachers and period sessions for your school
            </p>
          </div>
        </div>
        <div className="mt-6 border-b" />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="teachers">
        <TabsList className="mb-6 h-11 gap-1 p-1">
          <TabsTrigger value="teachers" className="gap-2 rounded-md px-4 text-sm">
            <Users className="h-4 w-4" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="periods" className="gap-2 rounded-md px-4 text-sm">
            <CalendarDays className="h-4 w-4" />
            Period Sessions
          </TabsTrigger>
        </TabsList>

        {/* ── TEACHERS ──────────────────────────────────────────── */}
        <TabsContent value="teachers">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Add Teacher
                </CardTitle>
                <CardDescription>Register a new teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <TeacherForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">All Teachers</CardTitle>
                <CardDescription>Registered teachers in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TeachersListSkeleton />}>
                  <TeachersList />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── PERIOD SESSIONS ───────────────────────────────────── */}
        <TabsContent value="periods">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  Create Period Session
                </CardTitle>
                <CardDescription>Schedule a class period session</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<FormSkeleton />}>
                  <PeriodSessionFormWrapper />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">All Period Sessions</CardTitle>
                <CardDescription>Scheduled class period sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<PeriodSessionsListSkeleton />}>
                  <PeriodSessionsList />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
