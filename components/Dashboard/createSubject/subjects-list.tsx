import { getSubjects } from '@/lib/actions/subject-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function SubjectsData() {
  const subjects = await getSubjects();

  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No subjects found. Create one to get started!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teacher
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Grade Level
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Color
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subjects.map((subject) => (
            <tr key={subject.subject_id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {subject.subject_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {subject.teacher_name || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {subject.grade_level || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {subject.color_code ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: subject.color_code }}
                    ></div>
                    <span className="text-xs text-gray-600">{subject.color_code}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubjectsListSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );
}

export async function SubjectsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subjects</CardTitle>
      </CardHeader>
      <CardContent>
        <SubjectsData />
      </CardContent>
    </Card>
  );
}

export { SubjectsListSkeleton };
