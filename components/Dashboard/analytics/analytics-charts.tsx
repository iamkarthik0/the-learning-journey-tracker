'use client';

import { useMemo, useEffect, useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  PieChart,
  Pie,
  Label,
} from 'recharts';
import { BookOpen, ListChecks, Users } from 'lucide-react';

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

type SubjectLite = {
  subject_id: string;
  subject_name: string;
  grade_level: string | null;
};

export function AnalyticsCharts({
  subjects,
  chapters,
}: {
  subjects: SubjectLite[];
  chapters: ChapterLite[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // ---- SUBJECT-WISE: har subject ke saare chapters ke questions ka completion % ----
  const subjectData = useMemo(() => {
    const map = new Map<
      string,
      { name: string; grade: string | null; total: number; done: number }
    >();

    for (const ch of chapters) {
      const meta = subjects.find((s) => s.subject_id === ch.subject_id);
      const key = ch.subject_id;
      if (!map.has(key)) {
        map.set(key, {
          name: meta?.subject_name ?? ch.subject_name ?? 'Unknown',
          grade: meta?.grade_level ?? null,
          total: 0,
          done: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += ch.questions.length;
      entry.done += ch.questions.filter((q) => q.is_completed).length;
    }

    return Array.from(map.values())
      .map((e) => ({
        label: e.grade ? `${e.name} (${e.grade})` : e.name,
        percent: e.total > 0 ? Math.round((e.done / e.total) * 100) : 0,
        done: e.done,
        total: e.total,
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [chapters, subjects]);

  // Overall totals
  const overall = useMemo(() => {
    let total = 0;
    let done = 0;
    let completedChapters = 0;
    for (const ch of chapters) {
      total += ch.questions.length;
      done += ch.questions.filter((q) => q.is_completed).length;
      if (ch.is_completed) completedChapters += 1;
    }
    return {
      questionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      done,
      total,
      completedChapters,
      totalChapters: chapters.length,
    };
  }, [chapters]);

  if (chapters.length === 0) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  // Dynamic height no longer needed

  return (
    <div className="space-y-6">
      {/* Overall summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Questions Taught
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overall.questionPercent}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {overall.done}/{overall.total} questions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chapters Done
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overall.completedChapters}
              <span className="text-lg text-muted-foreground">
                /{overall.totalChapters}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              completed chapters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subjects
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subjectData.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">with chapters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Questions
            </CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overall.total}</div>
            <p className="mt-1 text-xs text-muted-foreground">across chapters</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chapter completion — Donut with Text */}
        <ChapterCompletionDonut chapters={chapters} />

        {/* Chapter Attendance — question-level */}
        <ChapterAttendanceChart chapters={chapters} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CHAPTER COMPLETION DONUT — completed vs in-progress chapters
──────────────────────────────────────────────────────────────────*/
const completionChartConfig = {
  completed:   { label: 'Completed',   color: 'var(--chart-1)' },
  inProgress:  { label: 'In Progress', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function ChapterCompletionDonut({ chapters }: { chapters: ChapterLite[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const completed  = chapters.filter((c) => c.is_completed).length;
  const inProgress = chapters.length - completed;
  const pct = chapters.length > 0 ? Math.round((completed / chapters.length) * 100) : 0;

  const donutData = [
    { name: 'completed',  value: completed,  fill: 'var(--color-completed)'  },
    { name: 'inProgress', value: inProgress, fill: 'var(--color-inProgress)' },
  ].filter((d) => d.value > 0);

  if (!mounted) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-lg">Chapter Completion</CardTitle>
        <CardDescription>Completed vs in-progress chapters</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={completionChartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span>
                      {name === 'completed' ? 'Completed' : 'In Progress'}: {String(value)} chapters
                    </span>
                  )}
                />
              }
            />
            <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={72} strokeWidth={2}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {pct}%
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 26} className="fill-muted-foreground text-sm">
                          {completed}/{chapters.length} done
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CHAPTER ATTENDANCE — chapter → question select → that day's present/absent
──────────────────────────────────────────────────────────────────*/
const qAttendanceConfig = {
  present:   { label: 'Present',    color: 'var(--chart-1)' },
  absent:    { label: 'Absent',     color: 'var(--chart-2)' },
  notMarked: { label: 'Not marked', color: 'var(--chart-3)' },
} satisfies ChartConfig;

function ChapterAttendanceChart({ chapters }: { chapters: ChapterLite[] }) {
  const [mounted, setMounted] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.chapter_id ?? '');
  const [selectedQIndex,    setSelectedQIndex]    = useState<string>('');
  const [data, setData] = useState<import('@/lib/actions/student-analytics-actions').QuestionDayAttendance | null>(null);
  const [isLoading, startT] = useTransition();

  useEffect(() => setMounted(true), []);

  // Reset everything when top filter changes (chapters prop changes)
  useEffect(() => {
    setSelectedChapterId(chapters[0]?.chapter_id ?? '');
    setSelectedQIndex('');
    setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters.map((c) => c.chapter_id).join(',')]);

  // Reset question when chapter changes
  const handleChapterChange = (id: string) => {
    setSelectedChapterId(id);
    setSelectedQIndex('');
    setData(null);
  };

  const selectedChapter = chapters.find((c) => c.chapter_id === selectedChapterId);

  // Only taught questions (have taught_date)
  const taughtQuestions = useMemo(
    () =>
      (selectedChapter?.questions ?? [])
        .map((q, i) => ({ ...q, index: i }))
        .filter((q) => q.is_completed && q.taught_date),
    [selectedChapter]
  );

  const handleQuestionChange = (val: string) => {
    setSelectedQIndex(val);
    if (!selectedChapterId || val === '') { setData(null); return; }
    startT(async () => {
      const { getQuestionDayAttendance } = await import('@/lib/actions/student-analytics-actions');
      const result = await getQuestionDayAttendance({
        chapter_id: selectedChapterId,
        question_index: Number(val),
      });
      setData(result);
    });
  };

  const total    = (data?.present.length ?? 0) + (data?.absent.length ?? 0) + (data?.notMarked.length ?? 0);
  const pct      = total > 0 ? Math.round(((data?.present.length ?? 0) / total) * 100) : 0;

  const donutData = data && total > 0
    ? [
        { name: 'present',   value: data.present.length,   fill: 'var(--color-present)'   },
        { name: 'absent',    value: data.absent.length,    fill: 'var(--color-absent)'    },
        ...(data.notMarked.length > 0
          ? [{ name: 'notMarked', value: data.notMarked.length, fill: 'var(--color-notMarked)' }]
          : []),
      ]
    : [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Question Attendance
        </CardTitle>
        <CardDescription>Select a chapter and question to see who was present that day</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Chapter selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Chapter</label>
          <Select value={selectedChapterId} onValueChange={handleChapterChange}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {chapters.map((ch) => (
                <SelectItem key={ch.chapter_id} value={ch.chapter_id}>
                  {ch.order_index ? `Ch ${ch.order_index}: ` : ''}{ch.chapter_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question selector — only taught questions */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Question</label>
          <Select value={selectedQIndex} onValueChange={handleQuestionChange} disabled={taughtQuestions.length === 0}>
            <SelectTrigger className="h-9 text-sm">
              {/* Trigger shows Q{n} — same for all questions, short and clean */}
              {selectedQIndex
                ? <span className="font-medium">Q{Number(selectedQIndex) + 1}</span>
                : <SelectValue placeholder={taughtQuestions.length === 0 ? 'No taught questions' : 'Select a question'} />
              }
            </SelectTrigger>
            <SelectContent className="w-(--radix-select-trigger-width) max-w-xs sm:max-w-sm" align="start" position="popper">
              {taughtQuestions.map((q) => (
                <SelectItem
                  key={q.index}
                  value={String(q.index)}
                  className="whitespace-normal"
                >
                  {/* Q{n}: full question text */}
                  <span className="block leading-snug">
                    <span className="font-medium text-muted-foreground mr-1.5">
                      Q{q.index + 1}
                    </span>
                    {q.text}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chart area */}
        {!selectedQIndex ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <Users className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">Select a question to view attendance</p>
          </div>
        ) : isLoading || !mounted ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : !data || total === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">No attendance data for this question's date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Date */}
            <p className="text-center text-xs text-muted-foreground">
              {data.taught_date
                ? new Date(data.taught_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                : ''}
            </p>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-500">{data.present.length}</div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-xl font-bold text-rose-600 dark:text-rose-500">{data.absent.length}</div>
                <div className="text-xs text-muted-foreground">Absent</div>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <div className="text-xl font-bold">{total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            {/* Donut */}
            <ChartContainer config={qAttendanceConfig} className="mx-auto aspect-square max-h-[180px]">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={52} strokeWidth={2}>
                  <Label content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">{pct}%</tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">present</tspan>
                        </text>
                      );
                    }
                  }} />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
