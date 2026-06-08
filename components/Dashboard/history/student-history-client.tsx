'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search, User, BookOpen, GraduationCap, CalendarDays,
  CheckCircle2, XCircle, TrendingUp, ClipboardList, AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getStudentHistory,
  type TimeRange,
  type StudentHistoryData,
} from '@/lib/actions/student-history-actions';

type StudentLite = {
  student_id: string;
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
};

const GRADES = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1month',   label: '1 Month'  },
  { value: '6months',  label: '6 Months' },
  { value: '1year',    label: '1 Year'   },
  { value: 'all',      label: 'All Time' },
];

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/* ─────────────────────────────────────────────────────────────────
   MAIN CLIENT
──────────────────────────────────────────────────────────────────*/
export function StudentHistoryClient({
  initialStudents,
}: {
  initialStudents: StudentLite[];
}) {
  const [search,        setSearch]        = useState('');
  const [gradeFilter,   setGradeFilter]   = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [selectedId,    setSelectedId]    = useState('');
  const [timeRange,     setTimeRange]     = useState<TimeRange>('all');
  const [history,       setHistory]       = useState<StudentHistoryData | null>(null);
  const [isPending,     startTransition]  = useTransition();
  const [tab,           setTab]           = useState<'attendance' | 'missed'>('attendance');
  const [missedSearch,  setMissedSearch]  = useState('');

  const sections = useMemo(() => {
    const set = new Set<string>();
    initialStudents.forEach((s) => { if (s.section) set.add(s.section); });
    return Array.from(set).sort();
  }, [initialStudents]);

  const filtered = useMemo(() =>
    initialStudents.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!s.full_name.toLowerCase().includes(q) && !String(s.roll_number).includes(q)) return false;
      }
      if (gradeFilter   && gradeFilter !== 'all'   && s.grade_level !== gradeFilter)   return false;
      if (sectionFilter && sectionFilter !== 'all' && s.section     !== sectionFilter) return false;
      return true;
    }),
    [initialStudents, search, gradeFilter, sectionFilter]
  );

  const selectedStudent = useMemo(
    () => initialStudents.find((s) => s.student_id === selectedId) ?? null,
    [initialStudents, selectedId]
  );

  const load = (id: string, range: TimeRange) => {
    if (!id) { setHistory(null); return; }
    startTransition(async () => {
      const data = await getStudentHistory(id, range);
      setHistory(data);
      setTab('attendance');
      setMissedSearch('');
    });
  };

  const handleSelectStudent = (id: string) => {
    setSelectedId(id);
    load(id, timeRange);
  };

  const handleRange = (r: TimeRange) => {
    setTimeRange(r);
    if (selectedId) load(selectedId, r);
  };

  // Filtered missed questions
  const filteredMissed = useMemo(() => {
    if (!history) return [];
    const q = missedSearch.trim().toLowerCase();
    return history.missed_questions.filter((m) =>
      !q ||
      m.question_text.toLowerCase().includes(q) ||
      m.chapter_name.toLowerCase().includes(q)  ||
      m.subject_name.toLowerCase().includes(q)  ||
      m.taught_date.includes(q)
    );
  }, [history, missedSearch]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

      {/* ── LEFT: STUDENT PICKER ──────────────────────────────────── */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Find Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Name or roll number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Grade */}
            <Select value={gradeFilter || 'all'} onValueChange={(v) => setGradeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Section */}
            <Select value={sectionFilter || 'all'} onValueChange={(v) => setSectionFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Student list */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Students
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {filtered.length}
              </Badge>
            </div>
          </CardHeader>
          <div className="max-h-[420px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <User className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">No students found</p>
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((s) => {
                  const isSelected = s.student_id === selectedId;
                  return (
                    <li key={s.student_id}>
                      <button
                        type="button"
                        onClick={() => handleSelectStudent(s.student_id)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                          isSelected && 'bg-accent'
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            'truncate text-sm font-medium',
                            isSelected && 'text-primary'
                          )}>
                            {s.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Roll #{s.roll_number}
                            {s.grade_level ? ` · ${s.grade_level}` : ''}
                            {s.section ? `-${s.section}` : ''}
                          </p>
                        </div>
                        <ChevronRight className={cn(
                          'h-4 w-4 shrink-0 text-muted-foreground transition-opacity',
                          isSelected ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100'
                        )} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* ── RIGHT: HISTORY CONTENT ───────────────────────────────── */}
      <div className="space-y-6">

        {/* Loading */}
        {isPending && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )}

        {/* Empty — no student selected */}
        {!isPending && !selectedId && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <User className="h-14 w-14 text-muted-foreground/25" />
              <p className="mt-4 text-base font-semibold">No student selected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Baaye list se ek student choose karo
              </p>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {!isPending && selectedId && history && (
          <HistoryView
            history={history}
            tab={tab}
            setTab={setTab}
            timeRange={timeRange}
            onRangeChange={handleRange}
            missedSearch={missedSearch}
            setMissedSearch={setMissedSearch}
            filteredMissed={filteredMissed}
          />
        )}

        {/* Error */}
        {!isPending && selectedId && !history && (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Could not load history for this student.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HISTORY VIEW
──────────────────────────────────────────────────────────────────*/
function HistoryView({
  history, tab, setTab, timeRange, onRangeChange,
  missedSearch, setMissedSearch, filteredMissed,
}: {
  history: StudentHistoryData;
  tab: 'attendance' | 'missed';
  setTab: (t: 'attendance' | 'missed') => void;
  timeRange: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  missedSearch: string;
  setMissedSearch: (v: string) => void;
  filteredMissed: StudentHistoryData['missed_questions'];
}) {
  const { student, summary } = history;

  return (
    <div className="space-y-5">
      {/* Student header + time range */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Student info */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {student.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{student.full_name}</h2>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">Roll #{student.roll_number}</Badge>
                  {student.grade_level && <Badge variant="outline" className="text-xs">Grade {student.grade_level}</Badge>}
                  {student.section    && <Badge variant="outline" className="text-xs">Section {student.section}</Badge>}
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {student.status}
                  </Badge>
                </div>
              </div>
            </div>
            {/* Time range */}
            <div className="flex flex-wrap gap-1.5">
              {TIME_RANGES.map((r) => (
                <Button
                  key={r.value}
                  size="sm"
                  variant={timeRange === r.value ? 'default' : 'outline'}
                  onClick={() => onRangeChange(r.value)}
                  className="h-8 text-xs"
                >
                  {r.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_days}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">days marked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{summary.present}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">days present</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">{summary.absent}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">days absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.attendance_percent}%</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${summary.attendance_percent}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b pb-0">
        {([
          { id: 'attendance', label: 'Attendance History', icon: ClipboardList, count: history.day_records.length },
          { id: 'missed',     label: 'Missed Questions',   icon: AlertCircle,   count: history.missed_questions.length },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setMissedSearch(''); }}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <Badge
              variant={tab === t.id ? 'default' : 'secondary'}
              className="ml-0.5 text-xs"
            >
              {t.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Table card */}
      <Card>
        {tab === 'attendance' ? (
          <>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Day-by-day Attendance</CardTitle>
              <CardDescription>
                {history.day_records.length} records · latest first
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <AttendanceTable rows={history.day_records} />
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Missed Questions</CardTitle>
                  <CardDescription>{filteredMissed.length} questions missed while absent</CardDescription>
                </div>
                {/* Search — only on missed tab */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search questions…"
                    value={missedSearch}
                    onChange={(e) => setMissedSearch(e.target.value)}
                    className="h-9 pl-9 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <MissedTable rows={filteredMissed} />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ATTENDANCE TABLE
──────────────────────────────────────────────────────────────────*/
function AttendanceTable({ rows }: { rows: StudentHistoryData['day_records'] }) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const end        = Math.min(start + pageSize, rows.length);
  const pageRows   = rows.slice(start, end);

  // Reset to page 1 when pageSize changes
  const handlePageSize = (v: string) => {
    setPageSize(Number(v));
    setPage(1);
  };

  const pageNumbers = useMemo<(number | 'ellipsis')[]>(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push('ellipsis');
    const s = Math.max(2, safePage - 1);
    const e = Math.min(totalPages - 1, safePage + 1);
    for (let i = s; i <= e; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No attendance records</p>
        <p className="mt-1 text-xs text-muted-foreground">Try changing the time range</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[140px] pl-6">Date</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead>Subjects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="pl-6 font-medium tabular-nums text-sm">
                  {fmt(row.date)}
                </TableCell>
                <TableCell>
                  {row.status === 'present' ? (
                    <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Present
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                      <XCircle className="h-3 w-3" /> Absent
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {row.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {row.subjects.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          <BookOpen className="mr-1 h-3 w-3" />{s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col gap-4 border-t px-6 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing{' '}
            <span className="font-medium text-foreground">{rows.length === 0 ? 0 : start + 1}</span>
            {' – '}
            <span className="font-medium text-foreground">{end}</span>
            {' of '}
            <span className="font-medium text-foreground">{rows.length}</span>
          </span>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={safePage === 1}
                className={safePage === 1 ? 'pointer-events-none opacity-50' : ''}
                onClick={(e) => { e.preventDefault(); if (safePage > 1) goTo(safePage - 1); }}
              />
            </PaginationItem>

            {pageNumbers.map((p, idx) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`el-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === safePage}
                    onClick={(e) => { e.preventDefault(); goTo(p); }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={safePage === totalPages}
                className={safePage === totalPages ? 'pointer-events-none opacity-50' : ''}
                onClick={(e) => { e.preventDefault(); if (safePage < totalPages) goTo(safePage + 1); }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MISSED QUESTIONS TABLE
──────────────────────────────────────────────────────────────────*/
function MissedTable({ rows }: { rows: StudentHistoryData['missed_questions'] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
        <p className="mt-3 text-sm font-medium">No missed questions</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Student present tha ya koi question taught nahi hua abhi
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[140px] pl-6">Date</TableHead>
            <TableHead className="w-[130px]">Subject</TableHead>
            <TableHead className="w-[150px]">Chapter</TableHead>
            <TableHead>Missed Question</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} className="align-top">
              <TableCell className="pl-6 font-medium tabular-nums text-sm">
                {fmt(row.taught_date)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">{row.subject_name}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.chapter_name}</TableCell>
              <TableCell>
                <div className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span className="text-sm">{row.question_text}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
