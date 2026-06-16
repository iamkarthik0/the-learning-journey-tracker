import { getPeriodSessions } from '@/lib/actions/period-session-actions';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays } from 'lucide-react';

async function PeriodSessionsData() {
  const sessions = await getPeriodSessions();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No period sessions yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Create one using the form</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Grade · Division</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead className="w-[70px]">Period</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.session_id}>
              <TableCell className="font-medium text-sm">
                Grade {s.grade} · Div {s.division}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono">
                {s.subject_id.slice(0, 8)}…
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono">
                {s.teacher_id.slice(0, 8)}…
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {s.period_number}
              </TableCell>
              <TableCell>
                <Badge
                  variant={s.is_completed ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {s.is_completed ? 'Done' : 'Active'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export async function PeriodSessionsList() {
  return <PeriodSessionsData />;
}

export function PeriodSessionsListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
