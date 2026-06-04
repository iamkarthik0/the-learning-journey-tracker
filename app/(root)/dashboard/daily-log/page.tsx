import { DailyLogList } from '@/components/Dashboard/dailyLog/daily-log-list';
import { getChapters } from '@/lib/actions/chapter-actions';

export default async function DailyLogPage() {
  const chapters = await getChapters();

  // Aaj ki date readable format me
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Daily Log
        </h1>
        <p className="text-sm text-muted-foreground">
          {today} · Aaj jo padhaya uske questions ko taught mark karo
        </p>
      </div>

      <DailyLogList chapters={chapters} />
    </div>
  );
}
