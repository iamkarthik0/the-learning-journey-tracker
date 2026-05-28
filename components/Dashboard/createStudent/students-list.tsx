'use client';

import { useEffect, useState } from 'react';
import { getStudents } from '@/lib/actions/student-actions';
import { Pencil } from 'lucide-react';

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

type StudentsListProps = {
  onEdit?: (student: Student) => void;
  refreshKey?: number;
};

export function StudentsList({ onEdit, refreshKey }: StudentsListProps = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStudents = async () => {
    setIsLoading(true);
    const data = await getStudents();
    // Sort by grade then roll number
    const sorted = [...data].sort((a, b) => {
      const gradeA = a.grade_level || '';
      const gradeB = b.grade_level || '';
      if (gradeA !== gradeB) return gradeA.localeCompare(gradeB);
      return a.roll_number - b.roll_number;
    });
    setStudents(sorted);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [refreshKey]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Students ({students.length})</h2>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ) : students.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No students found. Create one above!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Roll No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.student_id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {student.roll_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.grade_level || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.section || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.created_at
                      ? new Date(student.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onEdit?.(student)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      title="Edit student"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
