'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Pencil,
  CalendarCheck,
  BookOpen,
} from 'lucide-react';
import {
  getTodayAttendance,
  getAttendanceByDate,
} from '@/lib/actions/student-attendance-actions';
import { getStudents } from '@/lib/actions/student-actions';
import { getSubjects } from '@/lib/actions/subject-actions';
import { AttendanceRecordsTableSkeleton } from './attendance-records-table-skeleton';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

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
  search?: string;
  rollFilter?: string;
  gradeFilter?: string;
  sectionFilter?: string;
  statusFilter?: string;
  selectedDate?: Date;
};

export function AttendanceRecordsTable({
  onEdit,
  refreshKey,
  search = '',
  rollFilter = '',
  gradeFilter = '',
  sectionFilter = '',
  statusFilter = 'all',
  selectedDate = new Date(),
}: AttendanceRecordsTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [, startTransition] = useTransition();

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

  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter((r) => {
      // Combined search - matches name OR roll number
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = r.full_name.toLowerCase().includes(q);
        const matchesRoll = String(r.roll_number).includes(q);
        if (!matchesName && !matchesRoll) return false;
      }
      if (gradeFilter && gradeFilter !== 'all' && r.grade_level !== gradeFilter) return false;
      if (sectionFilter && sectionFilter !== 'all' && r.section !== sectionFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      // rollFilter is same as search now (combined input)
      if (rollFilter.trim() && rollFilter !== search) {
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

  const dateLabel = useMemo(() => {
    if (!mounted) return '';
    return selectedDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [mounted, selectedDate]);

  // Show full skeleton on initial load (matches final UI dimensions)
  if (isInitialLoading) {
    return <AttendanceRecordsTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                {isToday(selectedDate) ? "Today's Attendance" : 'Attendance'}
              </CardTitle>
              <CardDescription className="my-4">
                {mounted && dateLabel && <>{dateLabel} · </>}Showing {sortedFiltered.length} of {records.length} records
              </CardDescription>
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
            </div>
          ) : (
            <>
              {/* Mobile + tablet card view */}
              <div className="space-y-3 lg:hidden">
                {paginatedRecords.map((record) => (
                  <div
                    key={record.attendance_id}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="font-mono py-1 px-3 rounded-md">
                            Roll {record.roll_number}
                          </Badge>
                          <Badge variant="secondary" className="py-1 px-3 rounded-md">
                          Grade {record.grade_level || 'N/A'}
                          </Badge>
                          {record.section && (
                            <Badge variant="secondary" className="py-1 px-3 rounded-md">
                              Section {record.section}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              record.status === 'present'
                                ? 'default'
                                : 'secondary'
                            }
                            className="rounded-md py-1"
                          >
                            {record.status}
                          </Badge>
                      </div>
                        <h3 className="my-4 font-semibold truncate  mx-2">
                          {record.full_name}
                        </h3>
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
              <div className="hidden lg:block">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[80px]">Roll No</TableHead>
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
                              {record.roll_number}
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
                                  : 'secondary'
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
