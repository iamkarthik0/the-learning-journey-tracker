'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { BookOpen, ListChecks } from 'lucide-react';

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

const subjectChartConfig = {
  percent: {
    label: 'Completion %',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const chapterChartConfig = {
  percent: {
    label: 'Questions taught %',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function AnalyticsCharts({
  subjects,
  chapters,
}: {
  subjects: SubjectLite[];
  chapters: ChapterLite[];
}) {
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

  // ---- CHAPTER-WISE: har chapter ka questions-taught % ----
  const chapterData = useMemo(() => {
    return chapters
      .map((ch) => {
        const total = ch.questions.length;
        const done = ch.questions.filter((q) => q.is_completed).length;
        return {
          label:
            (ch.order_index ? `Ch ${ch.order_index}: ` : '') + ch.chapter_name,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
          done,
          total,
          is_completed: ch.is_completed,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [chapters]);

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

  // Dynamic height: har bar ke liye thodi height (horizontal bars)
  const subjectChartHeight = Math.max(160, subjectData.length * 44 + 40);
  const chapterChartHeight = Math.max(160, chapterData.length * 40 + 40);

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
        {/* Subject-wise completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subject Completion</CardTitle>
            <CardDescription>
              Har subject ke saare chapters ke questions ka taught %
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={subjectChartConfig}
              className="w-full"
              style={{ height: subjectChartHeight }}
            >
              <BarChart
                accessibilityLayer
                data={subjectData}
                layout="vertical"
                margin={{ left: 8, right: 32 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <span>
                          {value}% taught ({item.payload.done}/
                          {item.payload.total})
                        </span>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="percent"
                  radius={[0, 4, 4, 0]}
                  fill="var(--color-percent)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chapter-wise completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chapter Progress</CardTitle>
            <CardDescription>
              Har chapter me kitne % questions taught hue (green = completed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chapterChartConfig}
              className="w-full"
              style={{ height: chapterChartHeight }}
            >
              <BarChart
                accessibilityLayer
                data={chapterData}
                layout="vertical"
                margin={{ left: 8, right: 32 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => (
                        <span>
                          {value}% taught ({item.payload.done}/
                          {item.payload.total})
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                  {chapterData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.is_completed
                          ? 'var(--chart-1)'
                          : 'var(--chart-2)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
