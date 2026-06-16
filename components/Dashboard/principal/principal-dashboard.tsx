'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, PieChart, Pie, Label, Cell,
} from 'recharts';
import {
  Users, GraduationCap, BookOpen, ListChecks,
  TrendingUp, UserCheck, UserX, CheckCircle2, Filter, X,
} from 'lucide-react';
import type { PrincipalDashboardData } from '@/lib/actions/principal-dashboard-actions';

const GRADE_ORDER = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

/* ── Chart configs ── */
const trendConfig: ChartConfig = {
  present: { label: 'Present', color: 'var(--chart-1)' },
  absent:  { label: 'Absent',  color: 'var(--chart-2)' },
};
const gradeConfig: ChartConfig = {
  count: { label: 'Students', color: 'var(--chart-1)' },
};
const chapterDonutConfig: ChartConfig = {
  completed:  { label: 'Completed',   color: 'var(--chart-1)' },
  inProgress: { label: 'In Progress', color: 'var(--chart-2)' },
};

/* ── Stat Card ── */
function StatCard({
  title, value, sub, icon: Icon, color,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold tracking-tight ${color ?? ''}`}>{value}</div>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Main ── */
export function PrincipalDashboard({ data }: { data: PrincipalDashboardData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { totals, today, attendance_trend, subject_progress, section_attendance, grade_distribution } = data;

  /* Filter state */
  const [gradeF,   setGradeF]   = useState('all');
  const [sectionF, setSectionF] = useState('all');
  const [subjectF, setSubjectF] = useState('all');

  /* Unique options */
  const grades = useMemo(
    () => grade_distribution.map((g) => g.grade),
    [grade_distribution]
  );

  const sections = useMemo(() => {
    const set = new Set<string>();
    section_attendance
      .filter((s) => gradeF === 'all' || s.grade === gradeF)
      .forEach((s) => set.add(s.section));
    return Array.from(set).sort();
  }, [section_attendance, gradeF]);

  const subjectOptions = useMemo(() => {
    return subject_progress
      .filter((s) => gradeF === 'all' || s.grade_level === gradeF)
      .map((s) => s.subject_name);
  }, [subject_progress, gradeF]);

  const hasFilter = gradeF !== 'all' || sectionF !== 'all' || subjectF !== 'all';

  const clearFilters = () => { setGradeF('all'); setSectionF('all'); setSubjectF('all'); };

  const handleGradeChange = (v: string) => {
    setGradeF(v);
    setSectionF('all');
    setSubjectF('all');
  };

  /* ── Filtered data computations ── */

  // Filtered totals from section_attendance (grade+section scoped student counts)
  const filteredStats = useMemo(() => {
    let activeStudents = totals.active_students;
    if (gradeF !== 'all' || sectionF !== 'all') {
      const relevant = section_attendance.filter((s) => {
        if (gradeF !== 'all' && s.grade !== gradeF) return false;
        if (sectionF !== 'all' && s.section !== sectionF) return false;
        return true;
      });
      activeStudents = relevant.reduce((sum, s) => sum + s.total_students, 0);
    }
    return activeStudents;
  }, [gradeF, sectionF, section_attendance, totals]);

  // Filtered subject_progress
  const filteredSubjectProgress = useMemo(() =>
    subject_progress.filter((s) => {
      if (gradeF !== 'all' && s.grade_level !== gradeF) return false;
      if (subjectF !== 'all' && s.subject_name !== subjectF) return false;
      return true;
    }),
    [subject_progress, gradeF, subjectF]
  );

  // Filtered grade distribution
  const filteredGradeDist = useMemo(() =>
    grade_distribution.filter((g) => gradeF === 'all' || g.grade === gradeF),
    [grade_distribution, gradeF]
  );

  // Filtered chapter totals
  const filteredChapterTotals = useMemo(() => {
    const subs = new Set(filteredSubjectProgress.map((s) => s.subject_name));
    let total = 0, done = 0, tq = 0, taught = 0;
    for (const s of filteredSubjectProgress) {
      total  += s.total;
      done   += s.completed;
      tq     += s.total  * (s.questions_pct / 100 * (s.total > 0 ? 1 : 0)); // approx
    }
    // Simpler: use raw values
    for (const s of filteredSubjectProgress) { total  += 0; } // already counted above, reset
    let rt = 0, rd = 0;
    for (const s of filteredSubjectProgress) { rt += s.total; rd += s.completed; }
    const pct = rt > 0 ? Math.round((rd / rt) * 100) : totals.chapter_completion_pct;
    return { total: rt || totals.total_chapters, done: rd || totals.completed_chapters, pct };
  }, [filteredSubjectProgress, totals]);

  // Chapter donut data
  const chapterDonutData = useMemo(() => [
    { name: 'completed',  value: filteredChapterTotals.done,                             fill: 'var(--color-completed)'  },
    { name: 'inProgress', value: filteredChapterTotals.total - filteredChapterTotals.done, fill: 'var(--color-inProgress)' },
  ].filter((d) => d.value > 0), [filteredChapterTotals]);

  return (
    <div className="space-y-6">

      {/* ── FILTER BAR ─────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2 shrink-0 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filter
          </div>

          {/* Grade */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Grade
            </label>
            <Select value={gradeF} onValueChange={handleGradeChange}>
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Section
            </label>
            <Select value={sectionF} onValueChange={setSectionF}>
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Subject
            </label>
            <Select value={subjectF} onValueChange={setSubjectF}>
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}
              className="h-9 gap-1.5 self-end text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── ROW 1: Summary stat cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard title="Active Students"
          value={filteredStats || totals.active_students}
          sub={!hasFilter && totals.inactive_students > 0 ? `${totals.inactive_students} inactive` : undefined}
          icon={Users} />
        <StatCard title="Teachers" value={totals.teachers} icon={GraduationCap} />
        <StatCard title="Subjects"
          value={subjectF !== 'all' ? 1 : gradeF !== 'all' ? filteredSubjectProgress.length : totals.subjects}
          icon={BookOpen} />
        <StatCard title="Chapters Done"
          value={`${filteredChapterTotals.done}/${filteredChapterTotals.total}`}
          sub={`${filteredChapterTotals.pct}% completion`} icon={CheckCircle2} />
        <StatCard title="Questions Taught"
          value={`${totals.question_taught_pct}%`}
          sub={`${totals.taught_questions}/${totals.total_questions} taught`}
          icon={ListChecks} />
      </div>

      {/* ── ROW 2: Today + 7-day trend ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid grid-cols-1 gap-4">
          <StatCard title="Present Today" value={today.present}
            sub={`${today.attendance_pct}% attendance`} icon={UserCheck}
            color="text-emerald-600 dark:text-emerald-500" />
          <StatCard title="Absent Today" value={today.absent}
            sub={`${today.total_marked} total marked`} icon={UserX}
            color="text-rose-600 dark:text-rose-500" />
        </div>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Attendance Trend — Last 7 Days
            </CardTitle>
            <CardDescription>Daily present vs absent across school</CardDescription>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <ChartContainer config={trendConfig} className="h-[160px] w-full">
                <AreaChart data={attendance_trend} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-present)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-absent)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-absent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="present" stroke="var(--color-present)" strokeWidth={2} fill="url(#gPresent)" />
                  <Area type="monotone" dataKey="absent"  stroke="var(--color-absent)"  strokeWidth={2} fill="url(#gAbsent)" />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : <div className="h-[160px] animate-pulse rounded-lg bg-muted" />}
          </CardContent>
        </Card>
      </div>

      {/* ── ROW 3: Chapter donut + Grade distribution ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle className="text-base">Chapter Completion</CardTitle>
            <CardDescription>
              {hasFilter ? 'Filtered' : 'All subjects'} — completed vs in-progress
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-2">
            {mounted ? (
              <ChartContainer config={chapterDonutConfig} className="mx-auto aspect-square max-h-[220px]">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={chapterDonutData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={2}>
                    <Label content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                              {filteredChapterTotals.pct}%
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-sm">
                              done
                            </tspan>
                          </text>
                        );
                      }
                    }} />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : <div className="h-[220px] animate-pulse rounded-lg bg-muted" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Students by Grade</CardTitle>
            <CardDescription>Active student count per grade</CardDescription>
          </CardHeader>
          <CardContent>
            {mounted && filteredGradeDist.length > 0 ? (
              <ChartContainer config={gradeConfig}
                style={{ height: Math.max(160, filteredGradeDist.length * 32 + 24) }} className="w-full">
                <BarChart data={filteredGradeDist} layout="vertical" margin={{ left: 4, right: 24 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="grade" tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            ) : <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
              No data for selected filter
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
