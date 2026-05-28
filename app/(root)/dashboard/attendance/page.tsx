'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { ClipboardCheck, Play } from 'lucide-react';
import { AttendanceRecordsTable } from '@/components/Dashboard/attendance/attendance-records-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the heavy AttendanceTracker — only loaded when user opens the dialog
const AttendanceTracker = lazy(() =>
  import('@/components/Dashboard/attendance/attendance-tracker').then((m) => ({
    default: m.AttendanceTracker,
  }))
);

function TrackerSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Open dialog automatically whenever an edit is requested
  useEffect(() => {
    if (editingRecord) setDialogOpen(true);
  }, [editingRecord]);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleStartNew = () => {
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const handleSaveComplete = () => {
    setRefreshKey((k) => k + 1);
    setEditingRecord(null);
    setDialogOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingRecord(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold tracking-tight">
              <ClipboardCheck className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 shrink-0" />
              <span className="truncate">Attendance</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mark attendance, track subject completion, and review records.
            </p>
          </div>
          <Button onClick={handleStartNew} size="lg" className="shadow-sm w-full sm:w-auto shrink-0">
            <Play className="mr-2 h-4 w-4" />
            Start Attendance
          </Button>
        </div>

        {/* Records table - full width */}
        <AttendanceRecordsTable onEdit={handleEdit} refreshKey={refreshKey} />

        {/* Tracker Dialog */}
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            className="max-w-2xl w-[95vw] sm:w-full p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col"
          >
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
              <DialogTitle className="text-lg sm:text-xl">
                {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingRecord
                  ? 'Update attendance and subject completion status.'
                  : 'Select a grade and mark attendance for each student.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
              {dialogOpen && (
                <Suspense fallback={<TrackerSkeleton />}>
                  <AttendanceTracker
                    editingRecord={editingRecord}
                    onSaveComplete={handleSaveComplete}
                    onRecordSaved={() => setRefreshKey((k) => k + 1)}
                    onAlreadyComplete={() => setDialogOpen(false)}
                    className="border-0 shadow-none p-0 bg-transparent"
                  />
                </Suspense>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
