'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Circle,
  BookOpen,
  CalendarDays,
  UserCheck,
  UserX,
  HelpCircle,
  Library,
  Layers,
  GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { getQuestionDayAttendance } from '@/lib/actions/student-analytics-actions';
import type { QuestionDayAttendance } from '@/lib/actions/student-analytics-actions';

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

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// Subject -> Section -> Chapters tree
type SectionGroup = {
  section: string;
  chapters: ChapterLite[];
};
type SubjectGroup = {
  subject_id: string;
  subject_name: string;
  grade_level: string | null;
  sections: SectionGroup[];
};

export function ChapterAnalyticsClient({
  subjects,
  chapters,
}: {
  subjects: SubjectLite[];
  chapters: ChapterLite[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dayData, setDayData] = useState<QuestionDayAttendance | null>(null);
  const [dayQuestionText, setDayQuestionText] = useState('');
  const [isLoadingDay, startDayTransition] = useTransition();

  const subjectMeta = useMemo(() => {
    const m = new Map<string, SubjectLite>();
    subjects.forEach((s) => m.set(s.subject_id, s));
    return m;
  }, [subjects]);

  const tree = useMemo<SubjectGroup[]>(() => {
    const subjectMap = new Map<string, SubjectGroup>();

    for (const ch of chapters) {
      const meta = subjectMeta.get(ch.subject_id);
      const subjectId = ch.subject_id;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject_id: subjectId,
          subject_name: meta?.subject_name ?? ch.subject_name ?? 'Unknown',
          grade_level: meta?.grade_level ?? null,
          sections: [],
        });
      }
      const subjGroup = subjectMap.get(subjectId)!;

      const sectionKey = ch.section || 'No section';
      let sectionGroup = subjGroup.sections.find(
        (s) => s.section === sectionKey
      );
      if (!sectionGroup) {
        sectionGroup = { section: sectionKey, chapters: [] };
        subjGroup.sections.push(sectionGroup);
      }
      sectionGroup.chapters.push(ch);
    }

    const groups = Array.from(subjectMap.values());
    groups.sort((a, b) => {
      const ga = a.grade_level || '';
      const gb = b.grade_level || '';
      if (ga !== gb) return ga.localeCompare(gb);
      return a.subject_name.localeCompare(b.subject_name);
    });
    groups.forEach((g) => {
      g.sections.sort((a, b) => a.section.localeCompare(b.section));
      g.sections.forEach((s) =>
        s.chapters.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      );
    });
    return groups;
  }, [chapters, subjectMeta]);

  const openQuestionDay = (
    chapter_id: string,
    question_index: number,
    questionText: string,
    isCompleted: boolean
  ) => {
    if (!isCompleted) return;
    setDayQuestionText(questionText);
    setDayData(null);
    setDialogOpen(true);
    startDayTransition(async () => {
      const data = await getQuestionDayAttendance({
        chapter_id,
        question_index,
      });
      setDayData(data);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Library className="h-5 w-5" />
            Subjects & Chapters
          </CardTitle>
          <CardDescription>
            Open a subject → choose a section → open a chapter → click a question to view attendance for that day
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Library className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">No chapters found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create subjects and chapters from the Teacher Dashboard first
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tree.map((subj) => (
                <SubjectCollapsible
                  key={subj.subject_id}
                  subject={subj}
                  onQuestionClick={openQuestionDay}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question-day attendance dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg w-[96vw] sm:w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 text-base">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="wrap-break-word">{dayQuestionText}</span>
            </DialogTitle>
            <DialogDescription>
              {dayData?.taught_date
                ? `Is question ke din (${formatDate(dayData.taught_date)}) ki class attendance`
                : 'Attendance for the day this question was taught'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDay ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-4 border-muted border-t-primary" />
              Loading...
            </div>
          ) : !dayData ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Could not load attendance.
            </p>
          ) : !dayData.taught_date ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              This question has not been taught yet, so no date is available.
            </p>
          ) : (
            <QuestionDayView data={dayData} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// SUBJECT level collapsible
function SubjectCollapsible({
  subject: subj,
  onQuestionClick,
}: {
  subject: SubjectGroup;
  onQuestionClick: (
    chapter_id: string,
    question_index: number,
    questionText: string,
    isCompleted: boolean
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalChapters = subj.sections.reduce(
    (acc, s) => acc + s.chapters.length,
    0
  );

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-left sm:p-4">
        <ChevronRight
          className={
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ' +
            (open ? 'rotate-90' : '')
          }
        />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{subj.subject_name}</span>
            {subj.grade_level && (
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="h-3 w-3" />
                Grade {subj.grade_level}
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {subj.sections.length} section
            {subj.sections.length !== 1 ? 's' : ''} · {totalChapters} chapter
            {totalChapters !== 1 ? 's' : ''}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-2 border-t p-2 sm:p-3">
          {subj.sections.map((sec) => (
            <SectionCollapsible
              key={sec.section}
              section={sec}
              onQuestionClick={onQuestionClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// SECTION level collapsible
function SectionCollapsible({
  section: sec,
  onQuestionClick,
}: {
  section: SectionGroup;
  onQuestionClick: (
    chapter_id: string,
    question_index: number,
    questionText: string,
    isCompleted: boolean
  ) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border bg-muted/30"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-left">
        <ChevronRight
          className={
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ' +
            (open ? 'rotate-90' : '')
          }
        />
        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">
          {sec.section === 'No section' ? 'No section' : `Section ${sec.section}`}
        </span>
        <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
          {sec.chapters.length} chapter{sec.chapters.length !== 1 ? 's' : ''}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-3 border-t p-2 sm:p-3">
          {sec.chapters.map((ch) => (
            <ChapterBlock
              key={ch.chapter_id}
              chapter={ch}
              onQuestionClick={onQuestionClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Ek chapter ka block (progress + questions)
function ChapterBlock({
  chapter: ch,
  onQuestionClick,
}: {
  chapter: ChapterLite;
  onQuestionClick: (
    chapter_id: string,
    question_index: number,
    questionText: string,
    isCompleted: boolean
  ) => void;
}) {
  const total = ch.questions.length;
  const done = ch.questions.filter((q) => q.is_completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysTaken = daysBetween(ch.start_date, ch.end_date);

  return (
    <div className="rounded-lg border bg-background p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="wrap-break-word">
              {ch.order_index ? `Ch ${ch.order_index}: ` : ''}
              {ch.chapter_name}
            </span>
            {ch.is_completed ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary">In Progress</Badge>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {done}/{total} questions taught
          </div>
        </div>
        <div className="text-left text-xs text-muted-foreground sm:text-right">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatDate(ch.start_date)} → {formatDate(ch.end_date)}
          </div>
          {daysTaken != null && (
            <div className="mt-1 font-medium text-foreground">
              {daysTaken} day{daysTaken !== 1 ? 's' : ''} taken
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {ch.questions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {ch.questions.map((q, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={!q.is_completed}
                onClick={() =>
                  onQuestionClick(ch.chapter_id, i, q.text, q.is_completed)
                }
                className={
                  'flex w-full items-start gap-2 rounded-md border bg-muted/30 p-2 text-left text-sm transition-colors ' +
                  (q.is_completed
                    ? 'cursor-pointer hover:bg-accent'
                    : 'cursor-default')
                }
                title={
                  q.is_completed
                    ? 'Click to see who was present that day'
                    : 'Question not taught yet'
                }
              >
                {q.is_completed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={
                    'min-w-0 wrap-break-word ' +
                    (q.is_completed ? 'text-muted-foreground' : '')
                  }
                >
                  {q.text}
                </span>
                {q.is_completed && q.taught_date ? (
                  <Badge
                    variant="outline"
                    className="ml-auto shrink-0 text-[10px]"
                  >
                    {formatDate(q.taught_date)}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="ml-auto shrink-0 text-[10px]"
                  >
                    Pending
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Question-day attendance ke present/absent/not-marked groups
function QuestionDayView({ data }: { data: QuestionDayAttendance }) {
  const totalClass =
    data.present.length + data.absent.length + data.notMarked.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            {data.present.length}
          </div>
          <div className="text-xs text-muted-foreground">Present</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
            {data.absent.length}
          </div>
          <div className="text-xs text-muted-foreground">Absent</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-2xl font-bold text-muted-foreground">
            {data.notMarked.length}
          </div>
          <div className="text-xs text-muted-foreground">Not marked</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {data.subject_name ?? 'Subject'}
        {data.grade_level ? ` · Grade ${data.grade_level}` : ''}
        {data.section ? ` · Section ${data.section}` : ''} · {totalClass}{' '}
        students
      </p>

      {/* Absent students - sabse zaroori, upar */}
      {data.absent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserX className="h-4 w-4 text-rose-600 dark:text-rose-500" />
            Absent ({data.absent.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.absent.map((s) => (
              <Badge
                key={s.student_id}
                variant="outline"
                className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
              >
                #{s.roll_number} {s.full_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Present students */}
      {data.present.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
            Present ({data.present.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.present.map((s) => (
              <Badge
                key={s.student_id}
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                #{s.roll_number} {s.full_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Not marked */}
      {data.notMarked.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Not marked ({data.notMarked.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.notMarked.map((s) => (
              <Badge key={s.student_id} variant="secondary">
                #{s.roll_number} {s.full_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {totalClass === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No students or attendance records found for this section and date.
        </p>
      )}
    </div>
  );
}
