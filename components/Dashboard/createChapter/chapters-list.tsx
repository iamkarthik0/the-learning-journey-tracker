import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getChapters } from '@/lib/actions/chapter-actions';

export async function ChaptersList() {
  const chapters = await getChapters();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chapters</CardTitle>
        <CardDescription>All chapters in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No chapters created yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {chapters.map((chapter) => {
              const total = chapter.questions?.length ?? 0;
              const done =
                chapter.questions?.filter((q) => q.is_completed).length ?? 0;
              return (
                <li
                  key={chapter.chapter_id}
                  className="flex items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {chapter.order_index ? `Ch ${chapter.order_index}: ` : ''}
                      {chapter.chapter_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {chapter.subject_name ?? 'Unknown subject'} · {done}/
                      {total} questions
                    </p>
                  </div>
                  {chapter.is_completed ? (
                    <Badge className="bg-green-600 hover:bg-green-600">
                      Completed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">In Progress</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ChaptersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chapters</CardTitle>
        <CardDescription>All chapters in the system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </CardContent>
    </Card>
  );
}
