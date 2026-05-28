'use client';

import { lazy, Suspense, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentsTable } from './students-table';

// Lazy load the form dialog — only fetched when user clicks Add/Edit
const StudentFormDialog = lazy(() =>
  import('./student-form-dialog').then((m) => ({
    default: m.StudentFormDialog,
  }))
);

type Student = {
  student_id: string;
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
  sourced_id: string | null;
  status: string | null;
  created_at: string | null;
};

export function StudentsPageContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setDialogOpen(true);
  };

  const handleSaveComplete = () => {
    setRefreshKey((k) => k + 1);
    setEditingStudent(null);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Students
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student records, filter by grade, section, and more.
          </p>
        </div>
        <Button onClick={handleAddNew} size="lg" className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Table with filters */}
      <StudentsTable onEdit={handleEdit} refreshKey={refreshKey} />

      {/* Form Dialog — lazy loaded, only rendered when needed */}
      {dialogOpen && (
        <Suspense fallback={null}>
          <StudentFormDialog
            open={dialogOpen}
            onOpenChange={handleOpenChange}
            editingStudent={editingStudent}
            onSaveComplete={handleSaveComplete}
          />
        </Suspense>
      )}
    </div>
  );
}
