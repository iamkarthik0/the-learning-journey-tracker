'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Pencil,
  Users,
} from 'lucide-react';
import { getStudents } from '@/lib/actions/student-actions';
import { StudentsTableSkeleton } from './students-table-skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

type Student = {
  student_id: string;
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
  sourced_id: string | null;
  status: string | null;
  created_at: string | null;
};

const GRADES = [
  '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

type StudentsTableProps = {
  initialStudents: Student[];
  onEdit?: (student: Student) => void;
  refreshKey?: number;
  search: string;
  gradeFilter: string;
  sectionFilter: string;
};

export function StudentsTable({ 
  initialStudents, 
  onEdit, 
  refreshKey,
  search,
  gradeFilter,
  sectionFilter
}: StudentsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Only refetch when refreshKey changes (after add/edit)
  useEffect(() => {
    if (refreshKey === 0) return; // Skip initial mount
    
    let cancelled = false;
    const loadStudents = async () => {
      const data = await getStudents();
      if (cancelled) return;
      const sorted = [...data].sort((a, b) => {
        const ga = a.grade_level || '';
        const gb = b.grade_level || '';
        if (ga !== gb) return ga.localeCompare(gb);
        return a.roll_number - b.roll_number;
      });
      startTransition(() => {
        setStudents(sorted);
      });
    };
    loadStudents();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Get unique sections from students for the section filter
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.section) set.add(s.section);
    });
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Combined search - Name OR Roll Number
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const nameMatch = s.full_name.toLowerCase().includes(q);
        const rollMatch = String(s.roll_number).includes(q);
        if (!nameMatch && !rollMatch) return false;
      }
      // Grade filter
      if (gradeFilter && gradeFilter !== 'all' && s.grade_level !== gradeFilter) return false;
      // Section filter
      if (sectionFilter && sectionFilter !== 'all' && s.section !== sectionFilter) return false;
      return true;
    });
  }, [students, search, gradeFilter, sectionFilter]);

  // Reset to page 1 whenever filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, gradeFilter, sectionFilter, pageSize]);

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Build page numbers with ellipsis (e.g., 1 ... 4 5 6 ... 10)
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
    (gradeFilter && gradeFilter !== 'all') ||
    (sectionFilter && sectionFilter !== 'all');

  // Show full skeleton on initial load to prevent layout shift
  if (isInitialLoading) {
    return <StudentsTableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students Directory
              </CardTitle>
              <CardDescription>
                Showing {filteredStudents.length} of {students.length} students
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {students.length === 0 ? 'No students yet' : 'No matches found'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {students.length === 0
                  ? 'Create your first student using the form above'
                  : 'Try adjusting your filters'}
              </p>

            </div>
          ) : (
            <>
              {/* Mobile + tablet card view */}
              <div className="space-y-3 lg:hidden">
                {paginatedStudents.map((student) => (
                  <div
                    key={student.student_id}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            #{student.roll_number}
                          </Badge>
                          <Badge
                            variant={
                              student.status === 'active' ? 'default' : 'outline'
                            }
                          >
                            {student.status}
                          </Badge>
                        </div>
                        <h3 className="mt-2 font-semibold">{student.full_name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Grade {student.grade_level || 'N/A'}
                          {student.section ? ` · Section ${student.section}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit?.(student)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden lg:block">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[80px]">Roll #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[80px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => (
                        <TableRow key={student.student_id}>
                          <TableCell className="font-mono font-medium">
                            <Badge variant="secondary">
                              #{student.roll_number}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.full_name}
                          </TableCell>
                          <TableCell>
                            {student.grade_level ? (
                              <Badge variant="outline">
                                {student.grade_level}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.section ? (
                              <Badge variant="outline">{student.section}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.created_at
                              ? new Date(student.created_at).toLocaleDateString('en-GB', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit?.(student)}
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
                      {filteredStudents.length === 0 ? 0 : startIndex + 1}
                    </span>
                    {' – '}
                    <span className="font-medium text-foreground">{endIndex}</span>
                    {' of '}
                    <span className="font-medium text-foreground">
                      {filteredStudents.length}
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
                          safePage === 1
                            ? 'pointer-events-none opacity-50'
                            : ''
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
