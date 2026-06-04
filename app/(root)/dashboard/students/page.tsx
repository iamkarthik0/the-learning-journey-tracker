import { getStudents } from '@/lib/actions/student-actions';
import { StudentsPageClient } from '@/components/Dashboard/students/students-page-client';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { grade?: string; section?: string };
}) {
  // Fetch students data on the server
  const studentsData = await getStudents();
  
  // Sort students by grade and roll number
  const sortedStudents = [...studentsData].sort((a, b) => {
    const ga = a.grade_level || '';
    const gb = b.grade_level || '';
    if (ga !== gb) return ga.localeCompare(gb);
    return a.roll_number - b.roll_number;
  });

  const selectedGrade = searchParams.grade || null;
  const selectedSection = searchParams.section || null;

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:py-8">
      <StudentsPageClient 
        initialStudents={sortedStudents}
        selectedGrade={selectedGrade}
        selectedSection={selectedSection}
      />
    </div>
  );
}
