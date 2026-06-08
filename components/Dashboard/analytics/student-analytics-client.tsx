'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  CheckCircle2, Circle, BookOpen, CalendarDays, UserCheck,
  UserX, HelpCircle, ChevronRight, Library, RefreshCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getQuestionDayAttendance } from '@/lib/actions/student-analytics-actions';
import {
  toggleStudentCaughtUp,
  getCatchupForQuestion,
  type CatchupStudentInfo,
} from '@/lib/actions/catchup-actions';
import type { QuestionDayAttendance } from '@/lib/actions/student-analytics-actions';
import { toast } from 'sonner';

type SubjectLite = {
  subject_id: string;
  subject_name: string;
  grade_level: string | null;
};

type QuestionLite = {
  text: string;
  is_completed: boolean;
  taught_date?: string | null;
};

type ChapterLite = {
  chapter_id: string;
  subject_id: string;
  subject_name: string | null;
  chapter_name: string;
  section: string | null;
  order_index: number | null;
  is_completed: boolean;
  start_date: string | null;
  end_date: string | null;
  questions: QuestionLite[];
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
}

const GRADE_ORDER = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

/* ─────────────────────────────────────────────────────────────────
   MAIN EXPORT
──────────────────────────────────────────────────────────────────*/
export function ChapterAnalyticsClient({
  subjects, chapters,
}: {
  subjects: SubjectLite[];
  chapters: ChapterLite[];
}) {
  const [selectedChapter, setSelectedChapter] = useState<ChapterLite | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sortedChapters = useMemo(() =>
    [...chapters].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [chapters]
  );

  const openChapter = (ch: ChapterLite) => {
    setSelectedChapter(ch);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Library className="h-5 w-5" />
            Chapters
          </CardTitle>
          <CardDescription>
            Filter by grade, subject, and section — then click a chapter to view full details and attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chapter list */}
          {sortedChapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Library className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">No chapters found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try changing the filters or add chapters from the Teacher Dashboard
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {sortedChapters.map((ch) => {
                const total = ch.questions.length;
                const done  = ch.questions.filter((q) => q.is_completed).length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <button
                    key={ch.chapter_id}
                    type="button"
                    onClick={() => openChapter(ch)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent"
                  >
                    {/* Progress ring */}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none"
                          stroke="currentColor" strokeWidth="3"
                          className="text-muted/40" />
                        <circle cx="18" cy="18" r="15" fill="none"
                          stroke="currentColor" strokeWidth="3"
                          strokeDasharray={`${pct * 0.942} 94.2`}
                          strokeLinecap="round"
                          className={ch.is_completed ? 'text-emerald-500' : 'text-primary'} />
                      </svg>
                      <span className="absolute text-[9px] font-bold">{pct}%</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {ch.order_index ? `Ch ${ch.order_index}: ` : ''}
                          {ch.chapter_name}
                        </span>
                        {ch.is_completed
                          ? <Badge className="bg-emerald-600 hover:bg-emerald-600 text-xs">Completed</Badge>
                          : <Badge variant="secondary" className="text-xs">In Progress</Badge>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{ch.subject_name ?? '—'}</span>
                        {ch.section && <span>Section {ch.section}</span>}
                        <span>{done}/{total} taught</span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ChapterSheet
        chapter={selectedChapter}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CHAPTER DETAIL SHEET
──────────────────────────────────────────────────────────────────*/
function ChapterSheet({
  chapter, open, onOpenChange,
}: {
  chapter: ChapterLite | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  // Per-question expanded state
  const [expandedQ, setExpandedQ]   = useState<string | null>(null);
  // Attendance data cache
  const [dayData, setDayData]       = useState<Map<string, QuestionDayAttendance | 'loading' | 'error'>>(new Map());
  // Catchup data cache: qKey → { catchup: [], mastery: [] }
  const [catchupData, setCatchupData] = useState<Map<string, { catchup: CatchupStudentInfo[]; mastery: CatchupStudentInfo[] }>>(new Map());
  const [, startT] = useTransition();

  const loadQuestion = (qKey: string, chapter_id: string, qIndex: number) => {
    // attendance
    if (!dayData.has(qKey)) {
      setDayData((p) => new Map(p).set(qKey, 'loading'));
      startT(async () => {
        const r = await getQuestionDayAttendance({ chapter_id, question_index: qIndex });
        setDayData((p) => new Map(p).set(qKey, r ?? 'error'));
      });
    }
    // catchup records
    if (!catchupData.has(qKey)) {
      startT(async () => {
        const r = await getCatchupForQuestion({ chapter_id, question_index: qIndex });
        setCatchupData((p) => new Map(p).set(qKey, r));
      });
    }
  };

  const toggleQuestion = (qKey: string, chapter_id: string, qIndex: number, isCompleted: boolean) => {
    if (!isCompleted) return;
    if (expandedQ === qKey) { setExpandedQ(null); return; }
    setExpandedQ(qKey);
    loadQuestion(qKey, chapter_id, qIndex);
  };

  const handleCaughtUp = (
    qKey: string,
    chapter_id: string,
    qIndex: number,
    student_id: string,
    type: 'catchup' | 'mastery'
  ) => {
    startT(async () => {
      const result = await toggleStudentCaughtUp({
        student_id, chapter_id, question_index: qIndex, type,
      });
      if (result.success) {
        toast.success(result.action === 'added' ? 'Marked as caught up' : 'Removed');
        // Refresh catchup data for this question
        const fresh = await getCatchupForQuestion({ chapter_id, question_index: qIndex });
        setCatchupData((p) => new Map(p).set(qKey, fresh));
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!chapter) return null;

  const total = chapter.questions.length;
  const done  = chapter.questions.filter((q) => q.is_completed).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const days  = daysBetween(chapter.start_date, chapter.end_date);

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setExpandedQ(null); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        {/* Header */}
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-left text-base leading-snug">
                {chapter.order_index ? `Chapter ${chapter.order_index}: ` : ''}
                {chapter.chapter_name}
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-left">
                {chapter.subject_name ?? '—'}
                {chapter.section ? ` · Section ${chapter.section}` : ''}
              </SheetDescription>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
              <div className="text-2xl font-bold">{pct}%</div>
              <div className="text-xs text-muted-foreground">Taught</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
              <div className="text-2xl font-bold">{done}/{total}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
              <div className="text-2xl font-bold">{days ?? '—'}</div>
              <div className="text-xs text-muted-foreground">Days taken</div>
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {fmt(chapter.start_date)} → {fmt(chapter.end_date)}
            {chapter.is_completed && (
              <Badge className="ml-1 bg-emerald-600 hover:bg-emerald-600 text-xs">Completed</Badge>
            )}
          </div>
        </SheetHeader>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No questions added to this chapter yet.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Questions — click a taught question to view attendance &amp; mark caught up
              </p>
              {chapter.questions.map((q, i) => {
                const qKey       = `${chapter.chapter_id}-${i}`;
                const isExpanded = expandedQ === qKey;
                const attendance = dayData.get(qKey);
                const catchup    = catchupData.get(qKey);

                return (
                  <div key={qKey} className="overflow-hidden rounded-lg border">
                    <button
                      type="button"
                      disabled={!q.is_completed}
                      onClick={() => toggleQuestion(qKey, chapter.chapter_id, i, q.is_completed)}
                      className={cn(
                        'flex w-full items-start gap-3 p-3 text-left text-sm transition-colors',
                        q.is_completed ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
                        isExpanded && 'bg-accent'
                      )}
                    >
                      {q.is_completed
                        ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        : <Circle       className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}

                      <span className={cn('flex-1', !q.is_completed && 'text-muted-foreground')}>
                        {q.text}
                      </span>

                      <div className="flex shrink-0 items-center gap-2">
                        {q.is_completed && q.taught_date && (
                          <span className="text-xs text-muted-foreground">{fmt(q.taught_date)}</span>
                        )}
                        {!q.is_completed && (
                          <Badge variant="outline" className="text-[10px]">Pending</Badge>
                        )}
                        {q.is_completed && (
                          <ChevronRight className={cn(
                            'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )} />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t bg-muted/20 px-4 py-3">
                        {attendance === 'loading' || !attendance ? (
                          <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                            Loading attendance…
                          </div>
                        ) : attendance === 'error' ? (
                          <p className="py-2 text-xs text-muted-foreground">Could not load attendance.</p>
                        ) : !attendance.taught_date ? (
                          <p className="py-2 text-xs text-muted-foreground">No date available.</p>
                        ) : (
                          <AttendanceInline
                            data={attendance}
                            catchup={catchup}
                            chapter_id={chapter.chapter_id}
                            question_index={i}
                            qKey={qKey}
                            onCaughtUp={handleCaughtUp}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────────────
   INLINE ATTENDANCE
──────────────────────────────────────────────────────────────────*/
function AttendanceInline({
  data, catchup, chapter_id, question_index, qKey, onCaughtUp,
}: {
  data: QuestionDayAttendance;
  catchup: { catchup: CatchupStudentInfo[]; mastery: CatchupStudentInfo[] } | undefined;
  chapter_id: string;
  question_index: number;
  qKey: string;
  onCaughtUp: (qKey: string, chapter_id: string, qIndex: number, student_id: string, type: 'catchup' | 'mastery') => void;
}) {
  const total = data.present.length + data.absent.length + data.notMarked.length;

  // IDs of students who are caught up or mastered
  const caughtUpIds = new Set(catchup?.catchup.map((c) => c.student_id) ?? []);
  const masteryIds  = new Set(catchup?.mastery.map((c) => c.student_id) ?? []);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-xs">
        <span className="font-semibold text-emerald-600 dark:text-emerald-500">
          ✓ {data.present.length} present
        </span>
        <span className="font-semibold text-rose-600 dark:text-rose-500">
          ✗ {data.absent.length} absent
        </span>
        {data.notMarked.length > 0 && (
          <span className="text-muted-foreground">{data.notMarked.length} not marked</span>
        )}
        <span className="ml-auto text-muted-foreground">{total} students</span>
      </div>

      {/* Absent — with Mark Caught Up button */}
      {data.absent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <UserX className="h-3.5 w-3.5 text-rose-500" />
            Absent — mark caught up if student covered the topic later
          </div>
          <div className="space-y-1.5">
            {data.absent.map((s) => {
              const isCaughtUp = caughtUpIds.has(s.student_id);
              return (
                <div key={s.student_id} className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2">
                  <span className="text-sm">
                    <span className="font-medium">#{s.roll_number}</span>{' '}
                    {s.full_name}
                  </span>
                  <Button
                    size="sm"
                    variant={isCaughtUp ? 'default' : 'outline'}
                    className={cn(
                      'h-7 gap-1.5 text-xs',
                      isCaughtUp && 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                    onClick={() => onCaughtUp(qKey, chapter_id, question_index, s.student_id, 'catchup')}
                  >
                    <RefreshCcw className="h-3 w-3" />
                    {isCaughtUp ? 'Caught Up ✓' : 'Mark Caught Up'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Present */}
      {data.present.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
            Present
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.present.map((s) => (
              <Badge key={s.student_id} variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-400">
                #{s.roll_number} {s.full_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Already caught up summary */}
      {(catchup?.catchup.length ?? 0) > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            ✓ {catchup!.catchup.length} student{catchup!.catchup.length !== 1 ? 's' : ''} caught up
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {catchup!.catchup.map((c) => (
              <span key={c.student_id} className="text-xs text-muted-foreground">
                #{c.roll_number} {c.full_name} ({c.caught_up_date})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not marked */}
      {data.notMarked.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> Not marked
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.notMarked.map((s) => (
              <Badge key={s.student_id} variant="secondary" className="text-xs">
                #{s.roll_number} {s.full_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="text-xs text-muted-foreground">No students found for this section and date.</p>
      )}
    </div>
  );
}
