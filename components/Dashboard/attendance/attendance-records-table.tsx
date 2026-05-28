'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Search,
  Filter,
  Pencil,
  X,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  BookOpen,
  CalendarIcon,
  Layers,
  Hash,
} from 'lucide-react';
import {
  getTodayAttendance,
  getAttendanceByDate,
} from '@/lib/actions/student-attendance-actions';
import { getStudents } from '@/lib/actions/student-actions';
import { getSubjects } from '@/lib/actions/subject-actions';
import { AttendanceRecordsTableSkeleton } from './attendance-records-table-skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const GRADES = [
  '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

type Student = {
  student_id: string;
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
};

type Subject = {
  subject_id: string;
  subject_name: string;
  color_code: string | null;
};

type AttendanceRecord = {
  attendance_id: string;
  student_id: string;
  status: 'present' | 'absent' | string | null;
  subject_status: any;
  attendance_date: string;
};

type EnrichedRecord = AttendanceRecord & {
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
  subjectsArray: Array<{ subject_id: string; is_completed: boolean }>;
};

type AttendanceRecordsTableProps = {
  onEdit?: (record: AttendanceRecord) => void;
  refreshKey?: number;
};

export function AttendanceRecordsTable({
  onEdit,
  refreshKey,
}: AttendanceRecordsTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rollFilter, setRollFilter] = useState('');

  // Date filter
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Format date to YYYY-MM-DD using local timezone (avoids UTC shift)
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Mounted state to avoid SSR/CSR locale mismatch for the date label
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (isInitialLoading) {
      // first load — keep skeleton visible
    } else {
      setIsRefetching(true);
    }
    const dateKey = formatDateKey(selectedDate);
    const useToday = isToday(selectedDate);

    const [recordsData, studentsData, subjectsData] = await Promise.all([
      useToday ? getTodayAttendance() : getAttendanceByDate(dateKey),
      getStudents(),
      getSubjects(),
    ]);
    startTransition(() => {
      setRecords(recordsData);
      setStudents(studentsData);
      setSubjects(subjectsData);
      setIsInitialLoading(false);
      setIsRefetching(false);
    });
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, selectedDate]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.student_id, s));
    return map;
  }, [students]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.subject_id, s));
    return map;
  }, [subjects]);

  // Enrich records with student details
  const enrichedRecords: EnrichedRecord[] = useMemo(() => {
    return records.map((r) => {
      const student = studentMap.get(r.student_id);
      const subjectsArray = r.subject_status
        ? typeof r.subject_status === 'string'
          ? JSON.parse(r.subject_status)
          : r.subject_status
        : [];
      return {
        ...r,
        full_name: student?.full_name ?? 'Unknown',
        roll_number: student?.roll_number ?? 0,
        grade_level: student?.grade_level ?? null,
        section: student?.section ?? null,
        subjectsArray,
      };
    });
  }, [records, studentMap]);

  // Sections from records
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => {
      if (r.section) set.add(r.section);
    });
    return Array.from(set).sort();
  }, [enrichedRecords]);

  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter((r) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!r.full_name.toLowerCase().includes(q)) return false;
      }
      if (gradeFilter !== 'all' && r.grade_level !== gradeFilter) return false;
      if (sectionFilter !== 'all' && r.section !== sectionFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (rollFilter.trim()) {
        if (!String(r.roll_number).includes(rollFilter.trim())) return false;
      }
      return true;
    });
  }, [enrichedRecords, search, gradeFilter, sectionFilter, statusFilter, rollFilter]);

  // Sorted by roll number ascending
  const sortedFiltered = useMemo(
    () =>
      [...filteredRecords].sort((a, b) => {
        if ((a.grade_level || '') !== (b.grade_level || '')) {
          return (a.grade_level || '').localeCompare(b.grade_level || '');
        }
        return a.roll_number - b.roll_number;
      }),
    [filteredRecords]
  );

  // Reset to page 1 on filter or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, gradeFilter, sectionFilter, statusFilter, rollFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedFiltered.length);
  const paginatedRecords = sortedFiltered.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const pageNumbers = useMemo<(number | 'ellipsis')[]>(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  const hasActiveFilters =
    search.trim() ||
    gradeFilter !== 'all' ||
    sectionFilter !== 'all' ||
    statusFilter !== 'all' ||
    rollFilter.trim();

  const clearFilters = () => {
    setSearch('');
    setGradeFilter('all');
    setSectionFilter('all');
    setStatusFilter('all');
    setRollFilter('');
  };

  // Stats — filter-aware (based on currently filtered records)
  const stats = useMemo(() => {
    const total = sortedFiltered.length;
    const present = sortedFiltered.filter((r) => r.status === 'present').length;
    const absent = sortedFiltered.filter((r) => r.status === 'absent').length;
    const grades = new Set(
      sortedFiltered.map((r) => r.grade_level).filter(Boolean)
    );
    const sections = new Set(
      sortedFiltered.map((r) => r.section).filter(Boolean)
    );
    return {
      total,
      present,
      absent,
      gradesCount: grades.size,
      sectionsCount: sections.size,
      gradesList: Array.from(grades) as string[],
      sectionsList: Array.from(sections) as string[],
    };
  }, [sortedFiltered]);

  // Active filter context (chips shown on cards)
  const activeContext = useMemo(() => {
    const chips: { label: string; value: string }[] = [];
    if (gradeFilter !== 'all') chips.push({ label: 'Grade', value: gradeFilter });
    if (sectionFilter !== 'all')
      chips.push({ label: 'Section', value: sectionFilter });
    if (statusFilter !== 'all')
      chips.push({ label: 'Status', value: statusFilter });
    return chips;
  }, [gradeFilter, sectionFilter, statusFilter]);

  // Helper to render the "Grades" stat — shows the grade label when only one is shown
  const gradesCardContent = useMemo(() => {
    if (gradeFilter !== 'all') {
      return { value: gradeFilter, suffix: 'grade' };
    }
    if (stats.gradesCount === 1 && stats.gradesList[0]) {
      return { value: stats.gradesList[0], suffix: 'grade' };
    }
    return { value: String(stats.gradesCount), suffix: stats.gradesCount === 1 ? 'grade' : 'grades' };
  }, [gradeFilter, stats]);

  const sectionsCardContent = useMemo(() => {
    if (sectionFilter !== 'all') {
      return { value: sectionFilter, suffix: 'section' };
    }
    if (stats.sectionsCount === 1 && stats.sectionsList[0]) {
      return { value: stats.sectionsList[0], suffix: 'section' };
    }
    return {
      value: String(stats.sectionsCount),
      suffix: stats.sectionsCount === 1 ? 'section' : 'sections',
    };
  }, [sectionFilter, stats]);

  const dateLabel = useMemo(() => {
    if (!mounted) return '';
    return selectedDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [mounted, selectedDate]);

  const dateButtonLabel = useMemo(() => {
    if (!mounted) return '';
    if (isToday(selectedDate)) return 'Today';
    return selectedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [mounted, selectedDate]);

  // Show full skeleton on initial load (matches final UI dimensions)
  if (isInitialLoading) {
    return <AttendanceRecordsTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Filter Context Bar */}
      {activeContext.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Showing:
          </span>
          {activeContext.map((chip) => (
            <Badge
              key={chip.label}
              variant="secondary"
              className="font-normal capitalize"
            >
              <span className="text-muted-foreground mr-1">{chip.label}:</span>
              <span className="font-semibold text-foreground">{chip.value}</span>
            </Badge>
          ))}
          {(search.trim() || rollFilter.trim()) && (
            <Badge variant="outline" className="font-normal">
              {search.trim() && (
                <>
                  <Search className="h-3 w-3 mr-1" />"{search.trim()}"
                </>
              )}
              {search.trim() && rollFilter.trim() && (
                <span className="mx-1">·</span>
              )}
              {rollFilter.trim() && (
                <>
                  <Hash className="h-3 w-3 mr-1" />
                  {rollFilter.trim()}
                </>
              )}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-2 text-xs ml-auto"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Total */}
        <Card className="border-l-4 border-l-blue-500 transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Marked
                </p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                {hasActiveFilters && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    of {records.length} on this date
                  </p>
                )}
              </div>
              <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                <CalendarCheck className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Present */}
        <Card className="border-l-4 border-l-emerald-500 transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Present
                </p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  {stats.present}
                </p>
                {stats.total > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {Math.round((stats.present / stats.total) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="rounded-full bg-emerald-500/10 p-2 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Absent */}
        <Card className="border-l-4 border-l-rose-500 transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Absent
                </p>
                <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                  {stats.absent}
                </p>
                {stats.total > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {Math.round((stats.absent / stats.total) * 100)}% of total
                  </p>
                )}
              </div>
              <div className="rounded-full bg-rose-500/10 p-2 shrink-0">
                <XCircle className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade & Section */}
        <Card className="border-l-4 border-l-purple-500 transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Scope
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {/* Grade Badge */}
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 border-purple-500/30"
                    >
                      {gradesCardContent.value === '0'
                        ? '—'
                        : gradesCardContent.value}
                    </Badge>
                  </div>
                  {/* Section Badge */}
                  <div className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-purple-500" />
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/15 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 border-purple-500/30"
                    >
                      {sectionsCardContent.value === '0'
                        ? '—'
                        : sectionsCardContent.value}
                    </Badge>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {gradesCardContent.suffix} · {sectionsCardContent.suffix}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                {isToday(selectedDate) ? "Today's Attendance" : 'Attendance'}
              </CardTitle>
              <CardDescription>
                {mounted && dateLabel && <>{dateLabel} · </>}Showing {sortedFiltered.length} of {records.length} records
              </CardDescription>
            </div>

            {/* Date Picker */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full sm:w-auto justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateButtonLabel || 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setDatePickerOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  captionLayout="dropdown"
                  startMonth={new Date(2000, 0)}
                  endMonth={new Date()}
                  defaultMonth={selectedDate}
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2 border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(new Date());
                      setDatePickerOpen(false);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDatePickerOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Input
              type="number"
              placeholder="Roll number..."
              value={rollFilter}
              onChange={(e) => setRollFilter(e.target.value)}
            />

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter row */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Status:
              </span>
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'present' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('present')}
                className={
                  statusFilter === 'present'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : ''
                }
              >
                Present
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'absent' ? 'destructive' : 'outline'}
                onClick={() => setStatusFilter('absent')}
              >
                Absent
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isRefetching ? (
            <div className="space-y-2 opacity-60 transition-opacity">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {records.length === 0
                  ? isToday(selectedDate)
                    ? 'No attendance records yet for today'
                    : 'No attendance records for this date'
                  : 'No matches found'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {records.length === 0
                  ? isToday(selectedDate)
                    ? 'Click "Start Attendance" to mark records'
                    : 'Try selecting a different date'
                  : 'Try adjusting your filters'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="space-y-3 md:hidden">
                {paginatedRecords.map((record) => (
                  <div
                    key={record.attendance_id}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            #{record.roll_number}
                          </Badge>
                          <Badge
                            variant={
                              record.status === 'present'
                                ? 'default'
                                : 'destructive'
                            }
                            className={
                              record.status === 'present'
                                ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 dark:text-emerald-400'
                                : ''
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                        <h3 className="mt-2 font-semibold truncate">
                          {record.full_name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Grade {record.grade_level || 'N/A'}
                          {record.section ? ` · Section ${record.section}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(record)}
                        className="h-8 w-8 ml-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    {record.subjectsArray.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {record.subjectsArray.map((sub) => {
                          const subInfo = subjectMap.get(sub.subject_id);
                          const color = subInfo?.color_code ?? '#6b7280';
                          return (
                            <Badge
                              key={sub.subject_id}
                              variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: color + '20',
                                borderColor: color,
                                color: color,
                              }}
                            >
                              {subInfo?.subject_name ?? 'Unknown'}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[80px]">Roll #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead className="w-[80px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRecords.map((record) => (
                        <TableRow key={record.attendance_id}>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              #{record.roll_number}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.full_name}
                          </TableCell>
                          <TableCell>
                            {record.grade_level ? (
                              <Badge variant="outline">
                                {record.grade_level}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.section ? (
                              <Badge variant="outline">{record.section}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === 'present'
                                  ? 'default'
                                  : 'outline'
                              }
                              className={
                                record.status === 'present'
                                  ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-700 hover:bg-rose-500/20 border-rose-500/30 dark:text-rose-400'
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.subjectsArray.length === 0 ? (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[280px]">
                                {record.subjectsArray.slice(0, 3).map((sub) => {
                                  const subInfo = subjectMap.get(sub.subject_id);
                                  const color = subInfo?.color_code ?? '#6b7280';
                                  return (
                                    <Badge
                                      key={sub.subject_id}
                                      variant="outline"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: color + '20',
                                        borderColor: color,
                                        color: color,
                                      }}
                                    >
                                      {subInfo?.subject_name ?? '?'}
                                    </Badge>
                                  );
                                })}
                                {record.subjectsArray.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{record.subjectsArray.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit?.(record)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination Footer */}
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {sortedFiltered.length === 0 ? 0 : startIndex + 1}
                    </span>
                    {' – '}
                    <span className="font-medium text-foreground">
                      {endIndex}
                    </span>
                    {' of '}
                    <span className="font-medium text-foreground">
                      {sortedFiltered.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Rows per page</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(v) => setPageSize(Number(v))}
                    >
                      <SelectTrigger className="h-8 w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20, 50, 100].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
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
                        className={
                          safePage === 1 ? 'pointer-events-none opacity-50' : ''
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          if (safePage > 1) goToPage(safePage - 1);
                        }}
                      />
                    </PaginationItem>

                    {pageNumbers.map((p, idx) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href="#"
                            isActive={p === safePage}
                            onClick={(e) => {
                              e.preventDefault();
                              goToPage(p);
                            }}
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
                        className={
                          safePage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          if (safePage < totalPages) goToPage(safePage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
