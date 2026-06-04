'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getStudentsByGradeWithAttendance, getStudentsByGradeAndSectionWithAttendance, getSectionsByGrade, getAllSubjects, saveAttendance, getAttendanceByStudentIdAndDate } from '@/lib/actions/student-attendance-actions';
import { getStudentById } from '@/lib/actions/student-actions';
import { X, ChevronLeft, ChevronRight, Check, CheckCircle2, XCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type Student = {
  student_id: string;
  roll_number: number;
  full_name: string;
  grade_level: string | null;
  section: string | null;
  status: string | null;
  hasAttendanceToday?: boolean;
  todayAttendance?: any;
};

type Subject = {
  subject_id: string;
  subject_name: string;
  color_code: string | null;
  grade_level?: string | null;
};

type SubjectStatus = {
  subject_id: string;
  is_completed: boolean;
};

type AttendanceTrackerProps = {
  editingRecord?: any;
  onSaveComplete?: () => void;
  onRecordSaved?: () => void;
  onAlreadyComplete?: () => void;
  className?: string;
};

export function AttendanceTracker({ editingRecord, onSaveComplete, onRecordSaved, onAlreadyComplete, className }: AttendanceTrackerProps = {}) {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [attendanceData, setAttendanceData] = useState<{
    [student_id: string]: {
      status: 'present' | 'absent';
      subject_status: SubjectStatus[];
    };
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const grades = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  // Fetch all subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      const subjects = await getAllSubjects();
      setAllSubjects(subjects);
    };
    fetchSubjects();
  }, []);

  // Fetch available sections when grade changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedGrade) {
        setAvailableSections([]);
        setSelectedSection('');
        return;
      }
      const sections = await getSectionsByGrade(selectedGrade);
      setAvailableSections(sections);
      setSelectedSection('');
    };
    fetchSections();
  }, [selectedGrade]);

  // Handle edit mode when editingRecord changes
  useEffect(() => {
    const loadEditMode = async () => {
      if (editingRecord) {
        setIsLoading(true);
        setIsEditMode(true);

        const student = await getStudentById(editingRecord.student_id);
        
        if (!student) {
          toast.error('Student not found');
          setIsLoading(false);
          return;
        }

        setSelectedGrade(student.grade_level || '');
        setSelectedSection(student.section || '');
        setStudents([student]);
        setIsStarted(true);
        setCurrentStudentIndex(0);

        const subjectStatus = editingRecord.subject_status
          ? (typeof editingRecord.subject_status === 'string'
              ? JSON.parse(editingRecord.subject_status)
              : editingRecord.subject_status)
          : [];

        setAttendanceData({
          [student.student_id]: {
            status: editingRecord.status,
            subject_status: subjectStatus,
          },
        });

        setIsLoading(false);
        toast.info('Editing attendance record');
      } else {
        if (isEditMode) {
          setIsEditMode(false);
          setIsStarted(false);
          setSelectedGrade('');
          setSelectedSection('');
          setStudents([]);
          setAttendanceData({});
          setCurrentStudentIndex(0);
        }
      }
    };

    loadEditMode();
  }, [editingRecord]);

  const handleStart = async () => {
    if (!selectedGrade) {
      toast.error('Please select a grade level');
      return;
    }
    if (availableSections.length > 0 && !selectedSection) {
      toast.error('Please select a section');
      return;
    }

    setIsLoading(true);

    const fetchedStudents = selectedSection
      ? await getStudentsByGradeAndSectionWithAttendance(selectedGrade, selectedSection)
      : await getStudentsByGradeWithAttendance(selectedGrade);

    if (fetchedStudents.length === 0) {
      toast.error(
        selectedSection
          ? `No students found for Grade ${selectedGrade} - Section ${selectedSection}`
          : `No students found for Grade ${selectedGrade}`
      );
      setIsLoading(false);
      return;
    }

    const allMarked = fetchedStudents.every((s) => s.hasAttendanceToday);
    if (allMarked) {
      const scope = selectedSection
        ? `Grade ${selectedGrade} - Section ${selectedSection}`
        : `Grade ${selectedGrade}`;
      toast.info(
        `All students in ${scope} have already been marked for today. To make changes, edit a record from the table below.`,
        { duration: 5000 }
      );
      setIsLoading(false);
      setSelectedGrade('');
      setSelectedSection('');
      setIsStarted(false);
      onAlreadyComplete?.();
      return;
    }

    const sortedStudents = fetchedStudents.sort((a, b) => a.roll_number - b.roll_number);
    const gradeSubjects = allSubjects.filter((subject) => subject.grade_level === selectedGrade);

    setStudents(sortedStudents);
    setIsStarted(true);
    setCurrentStudentIndex(0);

    const initialData: typeof attendanceData = {};
    const today = new Date().toISOString().split('T')[0];

    for (const student of sortedStudents) {
      const existingAttendance = await getAttendanceByStudentIdAndDate(student.student_id, today);

      let subjectStatus: SubjectStatus[] = [];

      if (existingAttendance?.subject_status) {
        subjectStatus = typeof existingAttendance.subject_status === 'string'
          ? JSON.parse(existingAttendance.subject_status)
          : existingAttendance.subject_status;
      } else {
        subjectStatus = gradeSubjects.map((subject) => ({
          subject_id: subject.subject_id,
          is_completed: true,
        }));
      }

      initialData[student.student_id] = {
        status: existingAttendance?.status as 'present' | 'absent' || 'present',
        subject_status: subjectStatus,
      };
    }
    setAttendanceData(initialData);
    setIsLoading(false);

    const attendanceCount = sortedStudents.filter(s => s.hasAttendanceToday).length;
    const remaining = sortedStudents.length - attendanceCount;
    if (attendanceCount > 0) {
      toast.success(`${remaining} students remaining (${attendanceCount} already marked today)`);
    } else {
      toast.success(`${sortedStudents.length} students loaded with ${gradeSubjects.length} subjects`);
    }
  };

  const currentStudent = students[currentStudentIndex];

  const handleStatusChange = (status: 'present' | 'absent') => {
    if (!currentStudent) return;

    setAttendanceData((prev) => ({
      ...prev,
      [currentStudent.student_id]: {
        ...prev[currentStudent.student_id],
        status,
      },
    }));
  };

  const handleAddSubject = (subject_id: string) => {
    if (!currentStudent) return;

    const currentData = attendanceData[currentStudent.student_id];
    const alreadyExists = currentData.subject_status.some((s) => s.subject_id === subject_id);

    if (alreadyExists) {
      toast.error('Subject already attached');
      return;
    }

    setAttendanceData((prev) => ({
      ...prev,
      [currentStudent.student_id]: {
        ...prev[currentStudent.student_id],
        subject_status: [
          ...prev[currentStudent.student_id].subject_status,
          { subject_id, is_completed: true },
        ],
      },
    }));
  };

  const handleRemoveSubject = (subject_id: string) => {
    if (!currentStudent) return;

    setAttendanceData((prev) => ({
      ...prev,
      [currentStudent.student_id]: {
        ...prev[currentStudent.student_id],
        subject_status: prev[currentStudent.student_id].subject_status.filter(
          (s) => s.subject_id !== subject_id
        ),
      },
    }));
  };

  const handleSaveAndNext = async () => {
    if (!currentStudent) return;

    const data = attendanceData[currentStudent.student_id];
    const result = await saveAttendance({
      student_id: currentStudent.student_id,
      status: data.status,
      subject_status: data.subject_status,
      attendance_date: editingRecord?.attendance_date,
    });

    if (result.success) {
      toast.success(result.message);
      onRecordSaved?.();
      
      if (isEditMode && onSaveComplete) {
        onSaveComplete();
        setIsEditMode(false);
        setIsStarted(false);
        setSelectedGrade('');
        setSelectedSection('');
        setStudents([]);
        setAttendanceData({});
        setCurrentStudentIndex(0);
        return;
      }
      
      if (currentStudentIndex < students.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
      } else {
        toast.success('All students completed!');
        onSaveComplete?.();
        
        setIsStarted(false);
        setCurrentStudentIndex(0);
        setStudents([]);
        setAttendanceData({});
        setSelectedGrade('');
        setSelectedSection('');
      }
    } else {
      toast.error(result.message);
    }
  };

  const handlePrevious = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
    }
  };

  const handleCancelEdit = () => {
    if (onSaveComplete) {
      onSaveComplete();
    }
    setIsEditMode(false);
    setIsStarted(false);
    setSelectedGrade('');
    setSelectedSection('');
    setStudents([]);
    setAttendanceData({});
    setCurrentStudentIndex(0);
    toast.info('Edit cancelled');
  };

  const getSubjectName = (subject_id: string) => {
    return allSubjects.find((s) => s.subject_id === subject_id)?.subject_name || 'Unknown';
  };

  const getSubjectColor = (subject_id: string) => {
    return allSubjects.find((s) => s.subject_id === subject_id)?.color_code || '#6b7280';
  };

  if (!isStarted) {
    return (
      <div className={cn("w-full", className)}>
        {/* Header */}
        <div className="rounded-t-xl border border-b-0 bg-muted/40 p-6 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Ready to Start
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Start Attendance Tracking
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Select grade and section to begin marking attendance
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 rounded-b-xl border border-t-0 bg-card p-6 sm:p-8">
          {/* Grade Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                1
              </div>
              Grade Level
            </label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="h-12 w-full text-sm sm:text-base">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade} className="text-sm sm:text-base">
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Selection */}
          {selectedGrade && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="flex items-center gap-2 text-sm font-medium">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  2
                </div>
                Section
              </label>
              {availableSections.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/40 p-4">
                  <p className="mb-1 text-sm font-medium">No sections available</p>
                  <p className="text-xs text-muted-foreground">
                    No sections found for Grade {selectedGrade}. All students will
                    be loaded.
                  </p>
                </div>
              ) : (
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="h-12 w-full text-sm sm:text-base">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((section) => (
                      <SelectItem key={section} value={section} className="text-sm sm:text-base">
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={!selectedGrade || isLoading || (availableSections.length > 0 && !selectedSection)}
            size="lg"
            className="mt-2 w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading Students...
              </div>
            ) : (
              'Start Attendance'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStudent || !attendanceData[currentStudent.student_id]) {
    return (
      <div className={cn("w-full rounded-xl border bg-card", className)}>
        <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-center text-sm font-medium text-muted-foreground sm:text-base">
            Loading student data...
          </p>
        </div>
      </div>
    );
  }

  const currentData = attendanceData[currentStudent.student_id] || {
    status: 'present' as 'present' | 'absent',
    subject_status: [],
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Student Header */}
      <div className="rounded-t-xl border border-b-0 bg-muted/40 p-6 sm:p-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {isEditMode && (
              <Badge variant="secondary" className="mb-2">
                Editing
              </Badge>
            )}
            <h2 className="mb-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {currentStudent.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Roll #{currentStudent.roll_number}</Badge>
              <Badge variant="outline">Grade {currentStudent.grade_level}</Badge>
              {currentStudent.section && (
                <Badge variant="outline">Section {currentStudent.section}</Badge>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <Badge variant="secondary" className="px-3 py-1.5 text-sm">
              {isEditMode
                ? 'Edit Mode'
                : `${currentStudentIndex + 1} / ${students.length}`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 rounded-b-xl border border-t-0 bg-card p-6 sm:p-8 sm:space-y-8">
        {/* Attendance Status */}
        <div className="space-y-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
            <label className="text-base font-semibold">Attendance Status</label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => handleStatusChange('present')}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm font-semibold transition-all sm:h-20 sm:text-base",
                currentData.status === 'present'
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-card hover:bg-accent"
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Present</span>
            </button>
            <button
              onClick={() => handleStatusChange('absent')}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm font-semibold transition-all sm:h-20 sm:text-base",
                currentData.status === 'absent'
                  ? "border-rose-600 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  : "bg-card hover:bg-accent"
              )}
            >
              <XCircle className="h-5 w-5" />
              <span>Absent</span>
            </button>
          </div>
        </div>

        {/* Subjects Attached */}
        <div className="space-y-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <label className="text-base font-semibold">Subjects</label>
            </div>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {currentData.subject_status.length} attached
            </Badge>
          </div>

          {currentData.subject_status.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center">
              <p className="mb-1 text-sm font-medium">No subjects attached</p>
              <p className="text-xs text-muted-foreground">
                Add subjects from the dropdown below
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {currentData.subject_status.map((subjectStatus) => {
                const color = getSubjectColor(subjectStatus.subject_id);
                const name = getSubjectName(subjectStatus.subject_id);
                return (
                  <div
                    key={subjectStatus.subject_id}
                    className="inline-flex items-center gap-2 rounded-lg border py-1.5 pl-3 pr-1.5 text-xs font-medium sm:text-sm"
                    style={{
                      borderColor: color,
                      backgroundColor: color + '18',
                      color: color,
                    }}
                  >
                    <span className="max-w-[120px] truncate sm:max-w-none">
                      {name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subjectStatus.subject_id)}
                      aria-label={`Remove ${name}`}
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-foreground/10"
                      style={{ color }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {(() => {
            const availableSubjects = allSubjects.filter(
              (subject) =>
                subject.grade_level === selectedGrade &&
                !currentData.subject_status.some((s) => s.subject_id === subject.subject_id)
            );
            if (availableSubjects.length === 0) {
              return (
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    All grade subjects attached
                  </p>
                </div>
              );
            }
            return (
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) handleAddSubject(value);
                }}
              >
                <SelectTrigger className="h-12 w-full text-sm sm:text-base">
                  <SelectValue placeholder="Add subject..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id} className="text-sm sm:text-base">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: subject.color_code || '#6b7280',
                          }}
                        />
                        <span className="truncate font-medium">{subject.subject_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}

          <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            <X className="h-3.5 w-3.5 shrink-0" />
            <span>Click the × button to remove a subject</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:pt-6">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                size="lg"
                className="order-2 w-full sm:order-1 sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAndNext}
                size="lg"
                className="order-1 w-full sm:order-2 sm:flex-1"
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStudentIndex === 0}
                size="lg"
                className="w-full sm:flex-1"
              >
                <ChevronLeft className="mr-1 h-5 w-5" />
                Previous
              </Button>
              <Button
                onClick={handleSaveAndNext}
                size="lg"
                className="w-full sm:flex-1"
              >
                {currentStudentIndex === students.length - 1 ? (
                  'Save & Finish'
                ) : (
                  <>
                    Save & Next
                    <ChevronRight className="ml-1 h-5 w-5" />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
