import { History } from 'lucide-react';
import { StudentHistoryClient } from '@/components/Dashboard/history/student-history-client';
import { getAllStudentsForHistory } from '@/lib/actions/student-history-actions';

export default async function StudentHistoryPage() {
  const students = await getAllStudentsForHistory();

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:py-8">
      <div className="space-y-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
              Student History
            </h1>
            <p className="text-sm text-muted-foreground">
              Student ka attendance history, missed questions aur detailed records dekho
            </p>
          </div>
        </div>

        <StudentHistoryClient initialStudents={students} />
      </div>
    </div>
  );
}
