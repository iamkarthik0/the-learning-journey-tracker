'use client';

import { lazy, Suspense, useMemo, useState } from 'react';
import { Plus, Users, UserCheck, UserX, BookOpen, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentsTable } from './students-table';

const GRADES = [
  '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

// Lazy load the form dialog — only fetched when user clicks Add/Edit
const StudentFormDialog = lazy(() =>
  import('./student-form-dialog').then((m) => ({
    default: m.StudentFormDialog,
  }))
);

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

type StudentsPageClientProps = {
  initialStudents: Student[];
  selectedGrade?: string | null;
  selectedSection?: string | null;
};

export function StudentsPageClient({ initialStudents, selectedGrade, selectedSection }: StudentsPageClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>(selectedGrade || '');
  const [sectionFilter, setSectionFilter] = useState<string>(selectedSection || '');

  // Get available sections from students
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    initialStudents.forEach((s) => {
      if (s.section) set.add(s.section);
    });
    return Array.from(set).sort();
  }, [initialStudents]);

  const handleGradeChange = (value: string) => {
    setGradeFilter(value);
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (value && value !== 'all') {
      params.set('grade', value);
    } else {
      params.delete('grade');
    }
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  const handleSectionChange = (value: string) => {
    setSectionFilter(value);
    // Update URL
    const params = new URLSearchParams(window.location.search);
    if (value && value !== 'all') {
      params.set('section', value);
    } else {
      params.delete('section');
    }
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  const hasActiveFilters =
    search.trim() ||
    (gradeFilter && gradeFilter !== 'all') ||
    (sectionFilter && sectionFilter !== 'all');

  const clearFilters = () => {
    setSearch('');
    setGradeFilter('all');
    setSectionFilter('all');
    // Clear URL params
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setDialogOpen(true);
  };

  const handleSaveComplete = () => {
    setRefreshKey((k) => k + 1);
    setEditingStudent(null);
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingStudent(null);
  };

  // Calculate stats based on filters
  const stats = useMemo(() => {
    let filteredStudents = initialStudents;
    
    // Apply combined search filter (name OR roll number)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filteredStudents = filteredStudents.filter((s) =>
        s.full_name.toLowerCase().includes(q) || String(s.roll_number).includes(q)
      );
    }
    
    // Apply grade filter
    if (gradeFilter && gradeFilter !== 'all') {
      filteredStudents = filteredStudents.filter((s) => s.grade_level === gradeFilter);
    }
    
    // Apply section filter
    if (sectionFilter && sectionFilter !== 'all') {
      filteredStudents = filteredStudents.filter((s) => s.section === sectionFilter);
    }
    
    const total = filteredStudents.length;
    const active = filteredStudents.filter((s) => s.status === 'active').length;
    const inactive = total - active;
    
    // Get unique grades and sections for Scope card
    const grades = new Set<string>();
    const sections = new Set<string>();
    initialStudents.forEach((s) => {
      if (s.grade_level) grades.add(s.grade_level);
      if (s.section) sections.add(s.section);
    });
    
    // Use selected filters or show all
    const gradesList = gradeFilter && gradeFilter !== 'all' ? [gradeFilter] : Array.from(grades).sort();
    const sectionsList = sectionFilter && sectionFilter !== 'all' ? [sectionFilter] : Array.from(sections).sort();
    
    return { total, active, inactive, gradesList, sectionsList };
  }, [initialStudents, search, gradeFilter, sectionFilter]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header with Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
              Students
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage student records, filter by grade and section.
            </p>
          </div>
        </div>

        {/* Add Student Button - Top Right */}
        <Button onClick={handleAddNew} size="lg" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.active}</div>
          </CardContent>
        </Card>

        {/* Inactive Students */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>

        {/* Scope Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scope
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-wrap gap-1.5">
                {stats.gradesList.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No grades</span>
                ) : (
                  stats.gradesList.map((grade) => (
                    <Badge key={grade} variant="secondary" className="text-xs">
                      {grade}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-wrap gap-1.5">
                {stats.sectionsList.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    No sections
                  </span>
                ) : (
                  stats.sectionsList.map((section) => (
                    <Badge key={section} variant="secondary" className="text-xs">
                      {section}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section - Below Stats Cards */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Filter Students</CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  Search by name or roll number, filter by grade and section
                </CardDescription>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Inputs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Combined Search - Name or Roll Number */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4 text-muted-foreground" />
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name or roll number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            {/* Grade Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Grade
              </label>
              <Select value={gradeFilter || 'all'} onValueChange={handleGradeChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select grade" />
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
            </div>

            {/* Section Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Section
              </label>
              <Select value={sectionFilter || 'all'} onValueChange={handleSectionChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select section" />
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
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Active:
              </span>
              {search.trim() && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <Search className="h-3.5 w-3.5" />
                  {search.trim()}
                  <button
                    onClick={() => setSearch('')}
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {gradeFilter && gradeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <BookOpen className="h-3.5 w-3.5" />
                  Grade {gradeFilter}
                  <button
                    onClick={() => handleGradeChange('all')}
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {sectionFilter && sectionFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <Users className="h-3.5 w-3.5" />
                  Section {sectionFilter}
                  <button
                    onClick={() => handleSectionChange('all')}
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <StudentsTable 
        initialStudents={initialStudents}
        onEdit={handleEdit} 
        refreshKey={refreshKey}
        search={search}
        gradeFilter={gradeFilter}
        sectionFilter={sectionFilter}
      />

      {/* Form Dialog — lazy loaded, only rendered when needed */}
      {dialogOpen && (
        <Suspense fallback={null}>
          <StudentFormDialog
            open={dialogOpen}
            onOpenChange={handleOpenChange}
            editingStudent={editingStudent}
            onSaveComplete={handleSaveComplete}
          />
        </Suspense>
      )}
    </div>
  );
}
