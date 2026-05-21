import { Suspense } from 'react';
import { getSchools } from '@/lib/actions/user-actions';

async function SchoolsData() {
  const schools = await getSchools();

  if (schools.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">No schools found. Create one above!</p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {schools.map((school) => (
        <div key={school.school_id} className="border rounded-lg p-4 hover:shadow-md transition">
          <h3 className="font-semibold text-lg">{school.name}</h3>
          <p className="text-sm text-gray-500 mt-2">
            Created: {school.created_at ? new Date(school.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      ))}
    </div>
  );
}

function SchoolsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse border rounded-lg p-4">
          <div className="h-6 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );
}

export function SchoolsList() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Schools</h2>
      <Suspense fallback={<SchoolsListSkeleton />}>
        <SchoolsData />
      </Suspense>
    </div>
  );
}
