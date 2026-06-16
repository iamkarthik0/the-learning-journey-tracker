import { Shield } from 'lucide-react';
import { PrincipalDashboard } from '@/components/Dashboard/principal/principal-dashboard';
import { getPrincipalDashboardData } from '@/lib/actions/principal-dashboard-actions';

export default async function DashboardPage() {
  const data = await getPrincipalDashboardData();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Principal Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              School-wide overview — students, teachers, chapters, and attendance
            </p>
          </div>
        </div>
        <div className="mt-6 border-b" />
      </div>

      <PrincipalDashboard data={data} />
    </div>
  );
}
