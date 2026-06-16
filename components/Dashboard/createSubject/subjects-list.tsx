import { getSubjects } from '@/lib/actions/subject-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

async function SubjectsData() {
  const subjects = await getSubjects();

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No subjects yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first subject using the form
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Subject</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="w-[80px]">Color</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((s) => (
            <TableRow key={s.subject_id}>
              <TableCell className="font-medium">{s.subject_name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {s.teacher_name ?? '—'}
              </TableCell>
              <TableCell>
                {s.grade_level ? (
                  <Badge variant="secondary" className="text-xs">
                    Grade {s.grade_level}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {s.color_code ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full border border-border"
                      style={{ backgroundColor: s.color_code }}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.color_code}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export async function SubjectsList() {
  return <SubjectsData />;
}

export function SubjectsListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
