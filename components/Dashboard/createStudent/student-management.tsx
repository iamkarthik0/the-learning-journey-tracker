'use client';

import { useState, useRef } from 'react';
import { StudentForm } from './student-form';
import { StudentsList } from './students-list';

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

export function StudentManagement() {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const formRef = useRef<HTMLDivElement | null>(null);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    // Scroll to the form for better UX
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveComplete = () => {
    setEditingStudent(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <div ref={formRef} className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          {editingStudent ? 'Edit Student' : 'Create Student'}
        </h2>
        <StudentForm
          editingStudent={editingStudent}
          onSaveComplete={handleSaveComplete}
        />
      </div>

      <StudentsList onEdit={handleEdit} refreshKey={refreshKey} />
    </>
  );
}
