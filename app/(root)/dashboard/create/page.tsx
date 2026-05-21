import { Suspense } from 'react';
import { SchoolForm } from '@/components/Dashboard/createSchool/school-form';
import { UserForm } from '@/components/Dashboard/createSchool/user-form';
import { SchoolsList } from '@/components/Dashboard/createSchool/schools-list';
import { UsersList } from '@/components/Dashboard/createSchool/users-list';
import { getSchools } from '@/lib/actions/user-actions';

async function UserFormWrapper() {
  const schools = await getSchools();
  return <UserForm schools={schools} />;
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Learning Journey Tracker Demo
        </h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Forms Section */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Create School</h2>
              <SchoolForm />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Create User</h2>
              <Suspense
                fallback={
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                }
              >
                <UserFormWrapper />
              </Suspense>
            </div>
          </div>

          {/* Data Display Section */}
          <div className="space-y-8">
            <SchoolsList />
            <UsersList />
          </div>
        </div>
      </div>
    </div>
  );
}
