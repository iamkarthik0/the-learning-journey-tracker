'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, Circle, RotateCcw } from 'lucide-react';
import {
  toggleChapterQuestion,
  setChapterCompletion,
} from '@/lib/actions/chapter-actions';
import type { ChapterWithSubject } from '@/lib/adapters/chapter.adapter';

type DailyLogListProps = {
  chapters: ChapterWithSubject[];
};

// taught_date ko readable format me (e.g., "4 Jun")
function formatTaughtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function DailyLogList({ chapters }: DailyLogListProps) {
  const [isPending, startTransition] = useTransition();
  // Track which specific control is loading
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const handleToggleQuestion = (
    chapter_id: string,
    question_index: number,
    is_completed: boolean
  ) => {
    const key = `${chapter_id}-${question_index}`;
    setBusyKey(key);
    startTransition(async () => {
      const result = await toggleChapterQuestion({
        chapter_id,
        question_index,
        is_completed,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setBusyKey(null);
    });
  };

  const handleChapterCompletion = (
    chapter_id: string,
    is_completed: boolean
  ) => {
    const key = `chapter-${chapter_id}`;
    setBusyKey(key);
    startTransition(async () => {
      const result = await setChapterCompletion({ chapter_id, is_completed });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setBusyKey(null);
    });
  };

  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <p>Koi chapter nahi mila.</p>
          <p className="text-sm">
            Pehle Teacher Dashboard se subject aur chapter create karo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {chapters.map((chapter) => {
        const questions = chapter.questions ?? [];
        const total = questions.length;
        const done = questions.filter((q) => q.is_completed).length;
        const allDone = total > 0 && done === total;
        const chapterBusy = busyKey === `chapter-${chapter.chapter_id}`;

        return (
          <Card key={chapter.chapter_id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {chapter.order_index ? `Ch ${chapter.order_index}: ` : ''}
                    {chapter.chapter_name}
                    {chapter.is_completed && (
                      <Badge className="bg-green-600 hover:bg-green-600">
                        Completed
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {chapter.subject_name ?? 'Unknown subject'} · {done}/{total}{' '}
                    questions taught
                  </CardDescription>
                </div>

                {/* Chapter-level complete / reopen */}
                {chapter.is_completed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending && chapterBusy}
                    onClick={() =>
                      handleChapterCompletion(chapter.chapter_id, false)
                    }
                  >
                    <RotateCcw className="size-4" />
                    Reopen
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={(isPending && chapterBusy) || !allDone}
                    title={
                      !allDone
                        ? 'Pehle sabhi questions complete karo'
                        : 'Mark chapter complete'
                    }
                    onClick={() =>
                      handleChapterCompletion(chapter.chapter_id, true)
                    }
                  >
                    <CheckCircle2 className="size-4" />
                    Mark Chapter Complete
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              {total > 0 && (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(done / total) * 100}%` }}
                  />
                </div>
              )}
            </CardHeader>

            <CardContent>
              {total === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Is chapter me koi question add nahi hua.
                </p>
              ) : (
                <ul className="space-y-2">
                  {questions.map((q, index) => {
                    const qBusy =
                      busyKey === `${chapter.chapter_id}-${index}`;
                    return (
                      <li key={index}>
                        <button
                          type="button"
                          disabled={isPending && qBusy}
                          onClick={() =>
                            handleToggleQuestion(
                              chapter.chapter_id,
                              index,
                              !q.is_completed
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
                        >
                          {q.is_completed ? (
                            <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                          ) : (
                            <Circle className="size-5 shrink-0 text-muted-foreground" />
                          )}
                          <span
                            className={
                              q.is_completed
                                ? 'text-sm text-muted-foreground line-through'
                                : 'text-sm'
                            }
                          >
                            {q.text}
                          </span>
                          {q.is_completed && q.taught_date && (
                            <Badge
                              variant="secondary"
                              className="ml-auto shrink-0 text-[10px]"
                            >
                              {formatTaughtDate(q.taught_date)}
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
