import { Suspense } from 'react';
import { ClipboardCheck, UserCheck, UserX, Layers, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentAdapter } from '@/lib/adapters/student.adapter';
import { getAttendanceByDate } from '@/lib/actions/student-attendance-actions';
import { AttendancePageClient } from '@/components/Dashboard/attendance/attendance-page-client';

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 sm:h-36 w-full" />
      ))}
    </div>
  );
}

async function AttendanceStats({ selectedGrade, selectedSection, selectedDate }: { selectedGrade: string | null; selectedSection: string | null; selectedDate: string }) {
  // Get all data
  const allStudents = await studentAdapter.findAll();
  const activeStudents = allStudents.filter((s) => s.status === 'active');
  
  // Get attendance records for the selected date
  const dateRecords = await getAttendanceByDate(selectedDate);
  
  // Filter students based on selected grade/section
  let filteredStudents = activeStudents;
  if (selectedGrade) {
    filteredStudents = filteredStudents.filter((s) => s.grade_level === selectedGrade);
  }
  if (selectedSection) {
    filteredStudents = filteredStudents.filter((s) => s.section === selectedSection);
  }
  
  // Get student IDs for filtered students
  const filteredStudentIds = new Set(filteredStudents.map((s) => s.student_id));
  
  // Filter date records based on filtered students
  const filteredRecords = dateRecords.filter((r) => filteredStudentIds.has(r.student_id));
  
  // Calculate stats from filtered records
  const presentToday = filteredRecords.filter((r) => r.status === 'present').length;
  const absentToday = filteredRecords.filter((r) => r.status === 'absent').length;
  const totalMarked = presentToday + absentToday;
  
  // Get unique grades and sections for Scope card
  const grades = new Set<string>();
  const sections = new Set<string>();
  activeStudents.forEach((s) => {
    if (s.grade_level) grades.add(s.grade_level);
    if (s.section) sections.add(s.section);
  });

  // Use selected filters or show all
  const gradesList = selectedGrade ? [selectedGrade] : Array.from(grades).sort();
  const sectionsList = selectedSection ? [selectedSection] : Array.from(sections).sort();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Marked */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Marked
          </CardTitle>
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{totalMarked}</div>
        </CardContent>
      </Card>

      {/* Present Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Present
          </CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">
            {presentToday}
          </div>
        </CardContent>
      </Card>

      {/* Absent Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Absent
          </CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-500">
            {absentToday}
          </div>
        </CardContent>
      </Card>

      {/* Scope */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Scope
          </CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {gradesList.length === 0 ? (
                <span className="text-sm text-muted-foreground">No grades</span>
              ) : (
                gradesList.map((grade) => (
                  <Badge key={grade} variant="secondary" className="text-xs">
                    {grade}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5">
              {sectionsList.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No sections
                </span>
              ) : (
                sectionsList.map((section) => (
                  <Badge key={section} variant="secondary" className="text-xs">
                    {section}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AttendancePage({
  searchParams,
}: {
  searchParams: { grade?: string; section?: string; date?: string };
}) {
  const selectedGrade = searchParams.grade || null;
  const selectedSection = searchParams.section || null;
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:py-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Page Header with Start Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
                Attendance
              </h1>
              <p className="text-sm text-muted-foreground">
                Track daily attendance and manage subject completion.
              </p>
            </div>
          </div>

          {/* Start Attendance Button - Top Right */}
          <AttendancePageClient showButtonOnly />
        </div>

        {/* Stats Cards with Suspense */}
        <Suspense fallback={<StatsSkeleton />}>
          <AttendanceStats selectedGrade={selectedGrade} selectedSection={selectedSection} selectedDate={selectedDate} />
        </Suspense>

        {/* Client Component for Interactive Parts (Table and Dialog) */}
        <AttendancePageClient hideButton />
      </div>
    </div>
  );
}
