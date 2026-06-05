'use client';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardCheck, Play, Filter, Calendar as CalendarIcon, BookOpen, Layers, X, Search, CheckCircle2 } from 'lucide-react';
import { AttendanceRecordsTable } from '@/components/Dashboard/attendance/attendance-records-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

// Lazy load the heavy AttendanceTracker — only loaded when user opens the dialog
const AttendanceTracker = lazy(() =>
  import('@/components/Dashboard/attendance/attendance-tracker').then((m) => ({
    default: m.AttendanceTracker,
  }))
);

function TrackerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  );
}

export function AttendancePageClient({ 
  showButtonOnly = false, 
  hideButton = false,
  selectedGrade,
  selectedSection,
  selectedDate: initialDate
}: { 
  showButtonOnly?: boolean; 
  hideButton?: boolean;
  selectedGrade?: string | null;
  selectedSection?: string | null;
  selectedDate?: string;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter states — URL params se initialize karo taaki page wapas aane pe reset na ho
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>(
    selectedGrade || searchParams.get('grade') || ''
  );
  const [sectionFilter, setSectionFilter] = useState<string>(
    selectedSection || searchParams.get('section') || ''
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const dateParam = initialDate || searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format date to YYYY-MM-DD
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

  // Update URL params when filters change — preserve karo dusre page se wapas aane pe
  const updateURLParams = (grade: string, section: string, date?: Date) => {
    const params = new URLSearchParams();

    if (grade && grade !== 'all') {
      params.set('grade', grade);
    }

    if (section && section !== 'all') {
      params.set('section', section);
    }

    if (date && !isToday(date)) {
      const dateKey = formatDateKey(date);
      params.set('date', dateKey);
    }

    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  const handleGradeChange = (value: string) => {
    const grade = value === 'all' ? '' : value;
    setGradeFilter(grade);
    updateURLParams(grade, sectionFilter, selectedDate);
  };

  const handleSectionChange = (value: string) => {
    const section = value === 'all' ? '' : value;
    setSectionFilter(section);
    updateURLParams(gradeFilter, section, selectedDate);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setDatePickerOpen(false);
      updateURLParams(gradeFilter, sectionFilter, date);
    }
  };

  const hasActiveFilters =
    search.trim() ||
    (gradeFilter && gradeFilter !== 'all') ||
    (sectionFilter && sectionFilter !== 'all') ||
    statusFilter !== 'all' ||
    !isToday(selectedDate);

  const clearFilters = () => {
    const today = new Date();
    setSearch('');
    setGradeFilter('');
    setSectionFilter('');
    setStatusFilter('all');
    setSelectedDate(today);
    router.push(window.location.pathname, { scroll: false });
  };

  const dateButtonLabel = useMemo(() => {
    if (!mounted) return '';
    if (isToday(selectedDate)) return 'Today';
    return selectedDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [mounted, selectedDate]);

  // Open dialog automatically whenever an edit is requested
  useEffect(() => {
    if (editingRecord) setDialogOpen(true);
  }, [editingRecord]);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setDialogOpen(true);
  };

  const handleStartNew = () => {
    setEditingRecord(null);
    setDialogOpen(true);
  };

  const handleSaveComplete = () => {
    setRefreshKey((k) => k + 1);
    setEditingRecord(null);
    setDialogOpen(false);
    // Refresh server component data (stats cards)
    router.refresh();
  };

  const handleAlreadyComplete = () => {
    // Don't close the dialog — just let the tracker show the message and reset itself
    // User can close the dialog manually if they want
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingRecord(null);
  };

  const handleRecordSaved = () => {
    // Sirf records table refresh karo, dialog band mat karo
    setRefreshKey((k) => k + 1);
  };

  // If only showing button, render just the button
  if (showButtonOnly) {
    return (
      <>
        <Button 
          onClick={handleStartNew} 
          size="lg" 
          className="w-full shrink-0 sm:w-auto"
        >
          <Play className="mr-2 h-5 w-5" />
          Start Attendance
        </Button>

        {/* Tracker Dialog */}
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            className="max-w-3xl lg:max-w-5xl w-[96vw] sm:w-[90vw] md:w-full p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col"
          >
            <DialogHeader className="px-5 sm:px-7 pt-6 sm:pt-8 pb-4 border-b">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                {editingRecord ? 'Edit Attendance Record' : 'Mark Student Attendance'}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base mt-2">
                {editingRecord
                  ? 'Update attendance status and subject completion for this student.'
                  : 'Select grade and section, then mark attendance for each student with subject tracking.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-6 sm:pb-8 pt-6">
              {dialogOpen && (
                <Suspense fallback={<TrackerSkeleton />}>
                  <AttendanceTracker
                    editingRecord={editingRecord}
                    onSaveComplete={handleSaveComplete}
                    onRecordSaved={handleRecordSaved}
                    onAlreadyComplete={handleAlreadyComplete}
                    className="border-0 shadow-none p-0 bg-transparent"
                  />
                </Suspense>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {/* Filters Section - Below Stats Cards */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Filter className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Filter Attendance</CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  Filter by date, search, grade, section, and status
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
          {/* Filter Inputs - Single Row with all filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Date Picker */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                Date
              </label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-11',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateButtonLabel || 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
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
                        const today = new Date();
                        handleDateChange(today);
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

            {/* Combined Search - Name or Roll Number */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4 text-muted-foreground" />
                Search Name or Roll Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Student name or roll number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11"
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
                  <SelectValue placeholder="All Grades" />
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
                <Layers className="h-4 w-4 text-muted-foreground" />
                Section
              </label>
              <Select value={sectionFilter || 'all'} onValueChange={handleSectionChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {['A', 'B', 'C', 'D', 'E'].map((s) => (
                    <SelectItem key={s} value={s}>
                      Section {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
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
              {!isToday(selectedDate) && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateButtonLabel}
                  <button
                    onClick={() => {
                      const today = new Date();
                      handleDateChange(today);
                    }}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {search.trim() && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <Search className="h-3.5 w-3.5" />
                  {search.trim()}
                  <button
                    onClick={() => setSearch('')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
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
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {sectionFilter && sectionFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <Layers className="h-3.5 w-3.5" />
                  Section {sectionFilter}
                  <button
                    onClick={() => handleSectionChange('all')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {statusFilter === 'present' ? 'Present' : 'Absent'}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Records table - pass all filters as props */}
      <AttendanceRecordsTable 
        onEdit={handleEdit} 
        refreshKey={refreshKey}
        search={search}
        rollFilter={search}
        gradeFilter={gradeFilter}
        sectionFilter={sectionFilter}
        statusFilter={statusFilter}
        selectedDate={selectedDate}
      />

      {/* Tracker Dialog - Improved Design */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-3xl lg:max-w-5xl w-[96vw] sm:w-[90vw] md:w-full p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col"
        >
          <DialogHeader className="px-5 sm:px-7 pt-6 sm:pt-8 pb-4 border-b">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              {editingRecord ? 'Edit Attendance Record' : 'Mark Student Attendance'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base mt-2">
              {editingRecord
                ? 'Update attendance status and subject completion for this student.'
                : 'Select grade and section, then mark attendance for each student with subject tracking.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-6 sm:pb-8 pt-6">
            {dialogOpen && (
              <Suspense fallback={<TrackerSkeleton />}>
                <AttendanceTracker
                  editingRecord={editingRecord}
                  onSaveComplete={handleSaveComplete}
                  onRecordSaved={handleRecordSaved}
                  onAlreadyComplete={handleAlreadyComplete}
                  className="border-0 shadow-none p-0 bg-transparent"
                />
              </Suspense>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
