import { getTeachers } from '@/lib/actions/teacher-actions';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

async function TeachersData() {
  const teachers = await getTeachers();

  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No teachers yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Add a teacher using the form</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead className="w-[90px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((t) => (
            <TableRow key={t.teacher_id}>
              <TableCell className="font-medium">{t.full_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{t.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{t.specialization || '—'}</TableCell>
              <TableCell>
                <Badge variant={t.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {t.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export async function TeachersList() {
  return <TeachersData />;
}

export function TeachersListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
