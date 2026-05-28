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
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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
      // Reset section when grade changes
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

        // Fetch the student details
        const student = await getStudentById(editingRecord.student_id);
        
        if (!student) {
          toast.error('Student not found');
          setIsLoading(false);
          return;
        }

        // Set the grade and section, then start
        setSelectedGrade(student.grade_level || '');
        setSelectedSection(student.section || '');
        setStudents([student]);
        setIsStarted(true);
        setCurrentStudentIndex(0);

        // Parse subject_status
        const subjectStatus = editingRecord.subject_status
          ? (typeof editingRecord.subject_status === 'string'
              ? JSON.parse(editingRecord.subject_status)
              : editingRecord.subject_status)
          : [];

        // Set attendance data
        setAttendanceData({
          [student.student_id]: {
            status: editingRecord.status,
            subject_status: subjectStatus,
          },
        });

        setIsLoading(false);
        toast.info('Editing attendance record');
      } else {
        // Reset edit mode
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

    // Use section-aware fetch when sections exist for the grade
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

    // Check if ALL students of this grade+section already have attendance for today
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
      // Reset and close dialog
      setSelectedGrade('');
      setSelectedSection('');
      setIsStarted(false);
      onAlreadyComplete?.();
      return;
    }

    // Sort students by roll number in ascending order
    const sortedStudents = fetchedStudents.sort((a, b) => a.roll_number - b.roll_number);

    // Filter subjects by selected grade
    const gradeSubjects = allSubjects.filter(
      (subject) => subject.grade_level === selectedGrade
    );

    setStudents(sortedStudents);
    setIsStarted(true);
    setCurrentStudentIndex(0);

    // Initialize attendance data for all students
    const initialData: typeof attendanceData = {};
    const today = new Date().toISOString().split('T')[0];

    for (const student of sortedStudents) {
      // Try to fetch existing attendance for today
      const existingAttendance = await getAttendanceByStudentIdAndDate(student.student_id, today);

      // If existing attendance has subject_status, use it; otherwise auto-attach all grade subjects
      let subjectStatus: SubjectStatus[] = [];

      if (existingAttendance?.subject_status) {
        subjectStatus = typeof existingAttendance.subject_status === 'string'
          ? JSON.parse(existingAttendance.subject_status)
          : existingAttendance.subject_status;
      } else {
        // Auto-attach all subjects of this grade
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
    const alreadyExists = currentData.subject_status.some(
      (s) => s.subject_id === subject_id
    );

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
      attendance_date: editingRecord?.attendance_date, // Use existing date if editing
    });

    if (result.success) {
      toast.success(result.message);
      // Notify parent that a record was saved (so table can refresh live)
      onRecordSaved?.();
      
      // If in edit mode, call onSaveComplete and exit
      if (isEditMode && onSaveComplete) {
        onSaveComplete();
        // Reset state
        setIsEditMode(false);
        setIsStarted(false);
        setSelectedGrade('');
        setSelectedSection('');
        setStudents([]);
        setAttendanceData({});
        setCurrentStudentIndex(0);
        return;
      }
      
      // Move to next student (normal mode)
      if (currentStudentIndex < students.length - 1) {
        setCurrentStudentIndex(currentStudentIndex + 1);
      } else {
        // All students completed - notify parent and close
        toast.success('All students completed!');
        onSaveComplete?.();
        
        // Reset to initial state
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
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Start Attendance Tracking</CardTitle>
          <CardDescription>Select grade and section to begin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Grade Level</label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGrade && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              {availableSections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No sections found for Grade {selectedGrade}. Will load all students.
                </p>
              ) : (
                <Select
                  value={selectedSection}
                  onValueChange={setSelectedSection}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={
              !selectedGrade ||
              isLoading ||
              (availableSections.length > 0 && !selectedSection)
            }
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Start Attendance'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentStudent || !attendanceData[currentStudent.student_id]) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading student data...</p>
        </CardContent>
      </Card>
    );
  }

  const currentData = attendanceData[currentStudent.student_id] || {
    status: 'present' as 'present' | 'absent',
    subject_status: [],
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {isEditMode && <Badge variant="secondary" className="mr-2">Editing</Badge>}
              {currentStudent.full_name} (Roll #{currentStudent.roll_number})
            </CardTitle>
            <CardDescription>
              Grade {currentStudent.grade_level} - Section {currentStudent.section}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {isEditMode ? 'Edit Mode' : `${currentStudentIndex + 1} / ${students.length}`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Attendance Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Attendance Status</label>
          <div className="flex gap-4">
            <Button
              variant={currentData.status === 'present' ? 'default' : 'outline'}
              onClick={() => handleStatusChange('present')}
              className="flex-1"
            >
              Present
            </Button>
            <Button
              variant={currentData.status === 'absent' ? 'destructive' : 'outline'}
              onClick={() => handleStatusChange('absent')}
              className="flex-1"
            >
              Absent
            </Button>
          </div>
        </div>

        {/* Subjects Attached */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Subjects Attached</label>
            <Badge variant="outline" className="text-xs">
              {currentData.subject_status.length} attached
            </Badge>
          </div>

          {/* Current Subjects (no toggle, only remove) */}
          {currentData.subject_status.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No subjects attached. Add from the dropdown below.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentData.subject_status.map((subjectStatus) => {
                const color = getSubjectColor(subjectStatus.subject_id);
                const name = getSubjectName(subjectStatus.subject_id);
                return (
                  <div
                    key={subjectStatus.subject_id}
                    className="group inline-flex items-center gap-1.5 rounded-md border pl-2.5 pr-1 py-1 text-sm transition-colors"
                    style={{
                      borderColor: color,
                      backgroundColor: color + '15',
                      color: color,
                    }}
                  >
                    <span className="font-medium">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subjectStatus.subject_id)}
                      aria-label={`Remove ${name}`}
                      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-sm transition-colors hover:bg-foreground/10"
                      style={{ color }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Subject Dropdown - Only show if there are subjects to add */}
          {(() => {
            const availableSubjects = allSubjects.filter(
              (subject) =>
                subject.grade_level === selectedGrade &&
                !currentData.subject_status.some(
                  (s) => s.subject_id === subject.subject_id
                )
            );
            if (availableSubjects.length === 0) {
              return (
                <p className="text-xs text-muted-foreground italic">
                  All grade subjects attached
                </p>
              );
            }
            return (
              <Select
                value=""
                onValueChange={(value) => {
                  if (value) handleAddSubject(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="+ Add subject..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem
                      key={subject.subject_id}
                      value={subject.subject_id}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: subject.color_code || '#6b7280',
                          }}
                        />
                        {subject.subject_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}

          <p className="text-xs text-muted-foreground">
            Click <X className="inline h-3 w-3" /> to remove a subject
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 pt-4">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAndNext} className="flex-1">
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStudentIndex === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleSaveAndNext} className="flex-1">
                {currentStudentIndex === students.length - 1 ? 'Save & Finish' : 'Save & Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
