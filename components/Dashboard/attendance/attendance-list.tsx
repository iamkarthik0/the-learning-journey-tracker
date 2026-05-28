import { getAllAttendance } from '@/lib/actions/student-attendance-actions';
import { getStudents } from '@/lib/actions/student-actions';
import { getSubjects } from '@/lib/actions/subject-actions';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export async function AttendanceList() {
  const [attendanceRecords, students, subjects] = await Promise.all([
    getAllAttendance(),
    getStudents(),
    getSubjects(),
  ]);

  const getStudentName = (student_id: string) => {
    return students.find((s) => s.student_id === student_id)?.full_name || 'Unknown';
  };

  const getSubjectName = (subject_id: string) => {
    return subjects.find((s) => s.subject_id === subject_id)?.subject_name || 'Unknown';
  };

  const getSubjectColor = (subject_id: string) => {
    return subjects.find((s) => s.subject_id === subject_id)?.color_code || '#6b7280';
  };

  if (attendanceRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No attendance records yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records ({attendanceRecords.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {attendanceRecords.map((record) => {
            const subjectStatus = record.subject_status
              ? (typeof record.subject_status === 'string'
                  ? JSON.parse(record.subject_status)
                  : record.subject_status)
              : [];

            return (
              <div
                key={record.attendance_id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {getStudentName(record.student_id)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Student ID: {record.student_id}
                    </p>
                  </div>
                  <Badge
                    variant={record.status === 'present' ? 'default' : 'destructive'}
                  >
                    {record.status}
                  </Badge>
                </div>

                {subjectStatus.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Subjects:</p>
                    <div className="flex flex-wrap gap-2">
                      {subjectStatus.map((subject: any) => (
                        <Badge
                          key={subject.subject_id}
                          style={{
                            backgroundColor: subject.is_completed
                              ? getSubjectColor(subject.subject_id)
                              : '#e5e7eb',
                            color: subject.is_completed ? 'white' : '#374151',
                          }}
                        >
                          {getSubjectName(subject.subject_id)}
                          {subject.is_completed && ' ✓'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  Last updated: {new Date(record.updated_at || '').toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AttendanceListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
