import { Suspense } from 'react';
import { SchoolForm } from '@/components/Dashboard/createSchool/school-form';
import { SchoolsList } from '@/components/Dashboard/createSchool/schools-list';
import { PeriodSessionForm } from '@/components/Dashboard/createPeriodSession/period-session-form';
import { PeriodSessionsList, PeriodSessionsListSkeleton } from '@/components/Dashboard/createPeriodSession/period-sessions-list';
import { TeacherForm } from '@/components/Dashboard/createTeacher/teacher-form';
import { TeachersList, TeachersListSkeleton } from '@/components/Dashboard/createTeacher/teachers-list';
import { SubjectForm } from '@/components/Dashboard/createSubject/subject-form';
import { SubjectsList, SubjectsListSkeleton } from '@/components/Dashboard/createSubject/subjects-list';
import { getTeachers } from '@/lib/actions/teacher-actions';
import { getSubjects } from '@/lib/actions/subject-actions';

async function SubjectFormWrapper() {
  const teachers = await getTeachers();
  return <SubjectForm teachers={teachers} />;
}

async function PeriodSessionFormWrapper() {
  const [teachers, subjects] = await Promise.all([
    getTeachers(),
    getSubjects(),
  ]);
  return <PeriodSessionForm teachers={teachers} subjects={subjects} />;
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Learning Journey Tracker
        </h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Forms Section */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Create School</h2>
              <SchoolForm />
            </div>

            <TeacherForm />

            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              }
            >
              <SubjectFormWrapper />
            </Suspense>

            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              }
            >
              <PeriodSessionFormWrapper />
            </Suspense>
          </div>

          {/* Data Display Section */}
          <div className="space-y-8">
            <SchoolsList />
            <Suspense fallback={<TeachersListSkeleton />}>
              <TeachersList />
            </Suspense>
            <Suspense fallback={<SubjectsListSkeleton />}>
              <SubjectsList />
            </Suspense>
            <Suspense fallback={<PeriodSessionsListSkeleton />}>
              <PeriodSessionsList />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
