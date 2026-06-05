'use client';

import { toast } from 'sonner';

import { useState, useTransition } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  BookOpen, Layers, GraduationCap, Filter, CheckCircle2, Clock,
  BarChart3, UserCheck, UserX, ChevronRight, HelpCircle, RefreshCw, Undo2, Star,
} from 'lucide-react';
import {
  getSubjectsForGrade,
  getChapterProgressForSubjectSection,
  getChapterAttendanceDetail,
  markStudentCatchup,
  markStudentMastery,
  markStudentCaughtUpMastered,
  undoStudentMark,
} from '@/lib/actions/analytics-actions';
import type {
  GradeSection, SubjectForFilter, ChapterProgress, ChapterAttendanceDetail,
  StudentEntry,
} from '@/lib/actions/analytics-actions';

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Chart configs (shadcn style) ──────────────────────────────────────────

// Chart colors — map to CSS variables so light/dark theme both work
const attendancePieConfig = {
  present:             { label: 'Present',              color: 'var(--chart-1)' },
  mastered:            { label: 'Present + Mastered',   color: 'var(--chart-2)' },
  caught_up:           { label: 'Caught Up',            color: 'var(--chart-3)' },
  absent:              { label: 'Absent',               color: 'var(--chart-4)' },
  caught_up_mastered:  { label: 'Caught Up + Mastered', color: 'var(--chart-5)' },
  not_marked:          { label: 'Not Marked',           color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

const questionBarConfig = {
  present:             { label: 'Present',              color: 'var(--chart-1)' },
  mastered:            { label: 'Present + Mastered',   color: 'var(--chart-2)' },
  caught_up:           { label: 'Caught Up',            color: 'var(--chart-3)' },
  absent:              { label: 'Absent',               color: 'var(--chart-4)' },
  caught_up_mastered:  { label: 'Caught Up + Mastered', color: 'var(--chart-5)' },
  not_marked:          { label: 'Not Marked',           color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

// ── Main Client Component ──────────────────────────────────────────────────

export function AnalyticsClient({ gradesWithSections }: { gradesWithSections: GradeSection[] }) {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subjects, setSubjects] = useState<SubjectForFilter[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isLoadingSubjects, startSubjectsTransition] = useTransition();
  const [chapters, setChapters] = useState<ChapterProgress[]>([]);
  const [isLoadingChapters, startChaptersTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chapterDetail, setChapterDetail] = useState<ChapterAttendanceDetail | null>(null);
  const [isLoadingDetail, startDetailTransition] = useTransition();

  const currentGrade = gradesWithSections.find((g) => g.grade === selectedGrade);
  const availableSections = currentGrade?.sections ?? [];
  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  const completedChapters = chapters.filter((c) => c.is_completed).length;
  const pendingChapters = chapters.length - completedChapters;
  const totalQ = chapters.reduce((s, c) => s + c.total_questions, 0);
  const doneQ = chapters.reduce((s, c) => s + c.completed_questions, 0);

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedSection('');
    setSubjects([]);
    setSelectedSubjectId('');
    setChapters([]);
    startSubjectsTransition(async () => {
      const data = await getSubjectsForGrade(grade);
      setSubjects(data);
    });
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    setSelectedSubjectId('');
    setChapters([]);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    if (!selectedSection) return;
    startChaptersTransition(async () => {
      const data = await getChapterProgressForSubjectSection(subjectId, selectedSection);
      setChapters(data);
    });
  };

  const handleChapterClick = (chapter: ChapterProgress) => {
    if (!selectedGrade || !selectedSection) return;
    setChapterDetail(null);
    setDialogOpen(true);
    startDetailTransition(async () => {
      const data = await getChapterAttendanceDetail(
        chapter.chapter_id, selectedGrade, selectedSection
      );
      setChapterDetail(data);
    });
  };

  return (
    <div className="space-y-6">

      {/* ── Filter Card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filter
          </CardTitle>
          <CardDescription>Select a Grade, Section, and Subject to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* Grade */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                Grade
              </label>
              <Select value={selectedGrade} onValueChange={handleGradeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradesWithSections.map((g) => (
                    <SelectItem key={g.grade} value={g.grade}>Grade {g.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Section
              </label>
              <Select
                value={selectedSection}
                onValueChange={handleSectionChange}
                disabled={!selectedGrade || availableSections.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedGrade ? 'Select grade first' :
                    availableSections.length === 0 ? 'No sections' : 'Select section'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map((s) => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Subject
              </label>
              <Select
                value={selectedSubjectId}
                onValueChange={handleSubjectChange}
                disabled={!selectedSection || subjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedGrade ? 'Select grade first' :
                    isLoadingSubjects ? 'Loading...' :
                    !selectedSection ? 'Select section first' :
                    subjects.length === 0 ? 'No subjects found' : 'Select subject'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>
                      <div className="flex items-center gap-2">
                        {s.color_code && (
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color_code }} />
                        )}
                        {s.subject_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter badges */}
          {(selectedGrade || selectedSection || selectedSubjectId) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Viewing:</span>
              {selectedGrade && (
                <Badge variant="secondary" className="gap-1.5">
                  <GraduationCap className="h-3 w-3" />
                  Grade {selectedGrade}
                </Badge>
              )}
              {selectedSection && (
                <Badge variant="secondary" className="gap-1.5">
                  <Layers className="h-3 w-3" />
                  Section {selectedSection}
                </Badge>
              )}
              {selectedSubject && (
                <Badge variant="secondary" className="gap-1.5">
                  {selectedSubject.color_code && (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedSubject.color_code }} />
                  )}
                  {selectedSubject.subject_name}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {!selectedSubjectId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Select a Grade, Section, and Subject
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Apply filters to view chapter progress and attendance details
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {selectedSubjectId && isLoadingChapters && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              <p className="text-sm text-muted-foreground">Loading chapters...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Data ─────────────────────────────────────────────────────── */}
      {selectedSubjectId && !isLoadingChapters && chapters.length > 0 && (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Chapters</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{chapters.length}</div>
                <p className="mt-1 text-xs text-muted-foreground">in this subject</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedChapters}</div>
                <p className="mt-1 text-xs text-muted-foreground">chapters done</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingChapters}</div>
                <p className="mt-1 text-xs text-muted-foreground">in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Questions Taught</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {doneQ}
                  <span className="text-lg font-normal text-muted-foreground">/{totalQ}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">questions covered</p>
              </CardContent>
            </Card>
          </div>

          {/* Chapter list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chapters</CardTitle>
              <CardDescription>
                Click on a chapter to view its attendance breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-6">
              {chapters.map((chapter) => {
                const pct = chapter.total_questions > 0
                  ? Math.round((chapter.completed_questions / chapter.total_questions) * 100)
                  : 0;
                return (
                  <button
                    key={chapter.chapter_id}
                    type="button"
                    onClick={() => handleChapterClick(chapter)}
                    className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">
                            {chapter.order_index ? `Ch ${chapter.order_index}: ` : ''}
                            {chapter.chapter_name}
                          </span>
                          {chapter.is_completed ? (
                            <Badge variant="outline" className="text-xs border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all${chapter.is_completed ? '' : ' bg-primary'}`}
                              style={{
                                width: `${pct}%`,
                                backgroundColor: chapter.is_completed ? '#16a34a' : undefined,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
                            {pct}%
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{chapter.completed_questions} done · {chapter.pending_questions} pending</span>
                          {chapter.start_date && (
                            <span>{formatDate(chapter.start_date)} → {formatDate(chapter.end_date)}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── No chapters ────────────────────────────────────────────────── */}
      {selectedSubjectId && !isLoadingChapters && chapters.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No chapters found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No chapters found for this subject
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Chapter Detail Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-[96vw] sm:w-[90vw] md:w-[85vw] lg:max-w-5xl p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
          {/* Sticky header */}
          <DialogHeader className="px-5 sm:px-7 pt-6 sm:pt-7 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="truncate">{chapterDetail?.chapter_name ?? 'Chapter Attendance'}</span>
            </DialogTitle>
            <DialogDescription className="mt-1">
              Grade {selectedGrade} · Section {selectedSection} · Per-question attendance detail
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
            {isLoadingDetail ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-muted border-t-foreground" />
                <p className="text-sm text-muted-foreground">Loading attendance data...</p>
              </div>
            ) : chapterDetail ? (
              <ChapterDetailView detail={chapterDetail} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Could not load attendance data.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Chapter Detail ────────────────────────────────────────────────────────

function ChapterDetailView({ detail }: { detail: ChapterAttendanceDetail }) {
  const [selectedQIndex, setSelectedQIndex] = useState<number | null>(null);
  const [localDetail, setLocalDetail] = useState(detail);
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const taughtQs = localDetail.questions.filter((q) => q.taught_date);
  const selectedQ = selectedQIndex !== null ? localDetail.questions[selectedQIndex] : null;

  // Aggregate counts for pie
  const presentCount      = taughtQs.length > 0 ? Math.round(taughtQs.reduce((s, q) => s + q.present.filter(p => !p.mastered).length, 0) / taughtQs.length) : 0;
  const masteredCount     = taughtQs.length > 0 ? Math.round(taughtQs.reduce((s, q) => s + q.present.filter(p => p.mastered).length, 0) / taughtQs.length) : 0;
  const absentCount       = taughtQs.length > 0 ? Math.round(taughtQs.reduce((s, q) => s + q.absent.filter(a => !a.caught_up && !a.caught_up_mastered).length, 0) / taughtQs.length) : 0;
  const caughtUpCount     = taughtQs.length > 0 ? Math.round(taughtQs.reduce((s, q) => s + q.absent.filter(a => a.caught_up && !a.caught_up_mastered).length, 0) / taughtQs.length) : 0;
  const cumMasteredCount  = taughtQs.length > 0 ? Math.round(taughtQs.reduce((s, q) => s + q.absent.filter(a => a.caught_up_mastered).length, 0) / taughtQs.length) : 0;
  const notMarkedCount    = taughtQs.length > 0 ? Math.round(taughtQs.reduce((s, q) => s + q.not_marked.length, 0) / taughtQs.length) : 0;

  const pieData = [
    { name: 'present',            value: presentCount     },
    { name: 'mastered',           value: masteredCount    },
    { name: 'absent',             value: absentCount      },
    { name: 'caught_up',          value: caughtUpCount    },
    { name: 'caught_up_mastered', value: cumMasteredCount },
    { name: 'not_marked',         value: notMarkedCount   },
  ].filter((d) => d.value > 0);

  // Bar data per taught question — 5 stacks
  const barData = taughtQs.map((q) => ({
    name:               `Q${q.index + 1}`,
    present:            q.present.filter(p => !p.mastered).length,
    mastered:           q.present.filter(p => p.mastered).length,
    absent:             q.absent.filter(a => !a.caught_up && !a.caught_up_mastered).length,
    caught_up:          q.absent.filter(a => a.caught_up && !a.caught_up_mastered).length,
    caught_up_mastered: q.absent.filter(a => a.caught_up_mastered).length,
    not_marked:         q.not_marked.length,
    fullText:           q.text,
  }));

  // Toggle catch-up for an absent student
  const handleCatchup = (student: StudentEntry, question_index: number) => {
    const key = `catchup-${student.student_id}-${question_index}`;
    setBusyKey(key);
    startTransition(async () => {
      let result;
      if (student.caught_up && student.catchup_id) {
        result = await undoStudentMark(student.catchup_id);
      } else {
        result = await markStudentCatchup({
          student_id: student.student_id,
          chapter_id: localDetail.chapter_id,
          question_index,
        });
      }
      if (result.success) {
        setLocalDetail((prev) => ({
          ...prev,
          questions: prev.questions.map((q) => {
            if (q.index !== question_index) return q;
            return {
              ...q,
              absent: q.absent.map((s) => {
                if (s.student_id !== student.student_id) return s;
                if (student.caught_up) {
                  return { student_id: s.student_id, full_name: s.full_name, roll_number: s.roll_number, caught_up: false };
                }
                return { ...s, caught_up: true, catchup_id: result.catchup_id, caught_up_date: new Date().toISOString().split('T')[0] };
              }),
            };
          }),
        }));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setBusyKey(null);
    });
  };

  // Toggle mastery for a present student
  const handleMastery = (student: StudentEntry, question_index: number) => {
    const key = `mastery-${student.student_id}-${question_index}`;
    setBusyKey(key);
    startTransition(async () => {
      let result;
      if (student.mastered && student.mastery_id) {
        result = await undoStudentMark(student.mastery_id);
      } else {
        result = await markStudentMastery({
          student_id: student.student_id,
          chapter_id: localDetail.chapter_id,
          question_index,
        });
      }
      if (result.success) {
        setLocalDetail((prev) => ({
          ...prev,
          questions: prev.questions.map((q) => {
            if (q.index !== question_index) return q;
            return {
              ...q,
              present: q.present.map((s) => {
                if (s.student_id !== student.student_id) return s;
                if (student.mastered) {
                  return { student_id: s.student_id, full_name: s.full_name, roll_number: s.roll_number, mastered: false };
                }
                return { ...s, mastered: true, mastery_id: result.catchup_id, mastery_date: new Date().toISOString().split('T')[0] };
              }),
            };
          }),
        }));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setBusyKey(null);
    });
  };

  // Toggle mastery for an absent-but-caught-up student
  const handleCaughtUpMastery = (student: StudentEntry, question_index: number) => {
    const key = `cum-${student.student_id}-${question_index}`;
    setBusyKey(key);
    startTransition(async () => {
      let result;
      if (student.caught_up_mastered && student.caught_up_mastered_id) {
        result = await undoStudentMark(student.caught_up_mastered_id);
      } else {
        result = await markStudentCaughtUpMastered({
          student_id: student.student_id,
          chapter_id: localDetail.chapter_id,
          question_index,
        });
      }
      if (result.success) {
        setLocalDetail((prev) => ({
          ...prev,
          questions: prev.questions.map((q) => {
            if (q.index !== question_index) return q;
            return {
              ...q,
              absent: q.absent.map((s) => {
                if (s.student_id !== student.student_id) return s;
                if (student.caught_up_mastered) {
                  return { ...s, caught_up_mastered: false, caught_up_mastered_id: undefined };
                }
                return { ...s, caught_up_mastered: true, caught_up_mastered_id: result.catchup_id, caught_up_mastered_date: new Date().toISOString().split('T')[0] };
              }),
            };
          }),
        }));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setBusyKey(null);
    });
  };

  return (
    <div className="space-y-8">

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Present</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{localDetail.present_percent}%</div>
            <p className="mt-1 text-xs text-muted-foreground">{localDetail.present_count} students avg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Absent</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{localDetail.absent_percent}%</div>
            <p className="mt-1 text-xs text-muted-foreground">{localDetail.absent_count} students avg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Class Size</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{localDetail.total_students}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {taughtQs.length} question{taughtQs.length !== 1 ? 's' : ''} taught
            </p>
          </CardContent>
        </Card>
      </div>

      {taughtQs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="mt-3 text-sm font-medium">No questions taught yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            When the teacher marks questions as taught, attendance will appear here
          </p>
        </div>
      ) : (
        <>
          {/* ── Charts ── */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

            {pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average Attendance</CardTitle>
                  <CardDescription>Average attendance throughout this chapter</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={attendancePieConfig} className="mx-auto aspect-square max-h-[240px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={88} paddingAngle={3}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={`var(--color-${entry.name})`} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {barData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Per-Question Breakdown</CardTitle>
                  <CardDescription>All statuses per question</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={questionBarConfig}
                    className="w-full"
                    style={{ height: Math.max(160, barData.length * 48 + 60) }}
                  >
                    <BarChart accessibilityLayer data={barData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={32} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) => {
                              const d = payload?.[0]?.payload as typeof barData[0] | undefined;
                              return d?.fullText ?? '';
                            }}
                          />
                        }
                      />
                      <Bar dataKey="present"            fill="var(--color-present)"            name="Present"             radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="mastered"           fill="var(--color-mastered)"           name="Present + Mastered"  radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="caught_up"          fill="var(--color-caught_up)"          name="Caught Up"           radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="caught_up_mastered" fill="var(--color-caught_up_mastered)" name="Caught Up + Mastered" radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="absent"             fill="var(--color-absent)"             name="Absent"              radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="not_marked"         fill="var(--color-not_marked)"         name="Not Marked"          radius={[0, 2, 2, 0]} stackId="a" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Question list ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">Questions</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Click on a taught question to see the student list and mark catch-ups
              </p>
            </div>

            <div className="space-y-2">
              {localDetail.questions.map((q) => {
                const isSelected = selectedQIndex === q.index;
                const total = q.present.length + q.absent.length + q.not_marked.length;
                const pct = total > 0 ? Math.round((q.present.length / total) * 100) : 0;
                const caughtUpCount        = q.absent.filter((s) => s.caught_up && !s.caught_up_mastered).length;
                const caughtUpMasteredCount = q.absent.filter((s) => s.caught_up_mastered).length;
                const masteredCount        = q.present.filter((s) => s.mastered).length;

                return (
                  <div key={q.index} className="rounded-lg border overflow-hidden">
                    <button
                      type="button"
                      disabled={!q.taught_date}
                      onClick={() => setSelectedQIndex(isSelected ? null : q.index)}
                      className={[
                        'w-full flex items-start gap-3 p-4 text-left transition-colors',
                        q.taught_date ? 'hover:bg-accent cursor-pointer' : 'cursor-default opacity-50',
                        isSelected ? 'bg-accent' : '',
                      ].join(' ')}
                    >
                      <div className="shrink-0 mt-0.5">
                        {q.taught_date
                          ? <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--chart-1)' }} />
                          : <Clock className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm leading-relaxed">{q.text}</p>
                        {q.taught_date ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>{formatDate(q.taught_date)}</span>
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" /> {q.present.length} present
                            </span>
                            <span className="flex items-center gap-1">
                              <UserX className="h-3 w-3" /> {q.absent.length} absent
                            </span>
                            {caughtUpCount > 0 && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <RefreshCw className="h-3 w-3" /> {caughtUpCount} caught up
                              </span>
                            )}
                            {caughtUpMasteredCount > 0 && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Star className="h-3 w-3 text-emerald-600" /> {caughtUpMasteredCount} caught up + mastered
                              </span>
                            )}
                            {masteredCount > 0 && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <Star className="h-3 w-3" /> {masteredCount} mastered
                              </span>
                            )}
                            <Badge variant="secondary" className="text-xs h-5 px-1.5">
                              {pct}% present
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Pending — not taught yet</p>
                        )}
                      </div>
                      {q.taught_date && (
                        <ChevronRight className={`shrink-0 h-4 w-4 text-muted-foreground mt-0.5 transition-transform duration-200 ${isSelected ? 'rotate-90' : ''}`} />
                      )}
                    </button>

                    {/* Expanded student list */}
                    {isSelected && selectedQ && (
                      <div className="border-t bg-muted/40 px-4 py-5 space-y-5">

                        {/* Present — with mastery buttons */}
                        {selectedQ.present.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Present
                              <Badge variant="secondary" className="ml-1">{selectedQ.present.length}</Badge>
                              <span className="text-xs font-normal text-muted-foreground">
                                — mark mastery if student answered correctly when tested
                              </span>
                            </p>
                            <div className="space-y-2">
                              {selectedQ.present.map((s) => {
                                const key = `mastery-${s.student_id}-${selectedQ.index}`;
                                const isBusy = isPending && busyKey === key;
                                return (
                                  <div
                                    key={s.student_id}
                                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                                      s.mastered ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {s.mastered ? (
                                        <Star className="h-4 w-4 shrink-0 text-emerald-600 fill-emerald-600" />
                                      ) : (
                                        <UserCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      )}
                                      <span className="text-sm font-medium">
                                        #{s.roll_number} {s.full_name}
                                      </span>
                                      {s.mastered && s.mastery_date && (
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                          Mastered · {formatDate(s.mastery_date)}
                                        </Badge>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleMastery(s, selectedQ.index)}
                                      className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                          s.mastered
                                          ? 'border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                                          : 'border-emerald-600/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400'
                                      }`}
                                    >
                                      {isBusy ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                      ) : s.mastered ? (
                                        <><Undo2 className="h-3 w-3" /> Undo</>
                                      ) : (
                                        <><Star className="h-3 w-3" /> Mark Mastered</>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Absent — with catch-up and mastery buttons */}
                        {selectedQ.absent.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold flex items-center gap-2">
                              <UserX className="h-4 w-4" />
                              Absent
                              <Badge variant="outline" className="ml-1">{selectedQ.absent.length}</Badge>
                              <span className="text-xs font-normal text-muted-foreground">
                                — mark catch-up, then mastery
                              </span>
                            </p>
                            <div className="space-y-2">
                              {selectedQ.absent.map((s) => {
                                const catchupKey = `catchup-${s.student_id}-${selectedQ.index}`;
                                const cumKey     = `cum-${s.student_id}-${selectedQ.index}`;
                                const isCatchupBusy = isPending && busyKey === catchupKey;
                                const isCumBusy     = isPending && busyKey === cumKey;

                                return (
                                  <div
                                    key={s.student_id}
                                    className={`rounded-lg border px-3 py-2.5 transition-colors ${
                                      s.caught_up_mastered
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : s.caught_up
                                          ? 'bg-primary/5 border-primary/20'
                                          : 'bg-background'
                                    }`}
                                  >
                                    {/* Student name + badges */}
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                      {s.caught_up_mastered
                                        ? <Star className="h-4 w-4 shrink-0 text-emerald-600 fill-emerald-600" />
                                        : s.caught_up
                                          ? <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
                                          : <UserX className="h-4 w-4 shrink-0 text-muted-foreground" />
                                      }
                                      <span className="text-sm font-medium">#{s.roll_number} {s.full_name}</span>
                                      {s.caught_up && s.caught_up_date && (
                                        <Badge variant="secondary" className="text-xs">
                                          Caught up · {formatDate(s.caught_up_date)}
                                        </Badge>
                                      )}
                                      {s.caught_up_mastered && s.caught_up_mastered_date && (
                                        <Badge variant="secondary" className="text-xs">
                                          ⭐ Mastered · {formatDate(s.caught_up_mastered_date)}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap gap-2">
                                      {/* Catch-up button */}
                                      <button
                                        type="button"
                                        disabled={isCatchupBusy || !!s.caught_up_mastered}
                                        onClick={() => handleCatchup(s, selectedQ.index)}
                                        title={s.caught_up_mastered ? 'Remove mastery first to undo catch-up' : undefined}
                                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                                          s.caught_up
                                            ? 'border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                                            : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                                        }`}
                                      >
                                        {isCatchupBusy
                                          ? <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                          : s.caught_up
                                            ? <><Undo2 className="h-3 w-3" /> Undo Catch-up</>
                                            : <><RefreshCw className="h-3 w-3" /> Mark Caught Up</>
                                        }
                                      </button>

                                      {/* Mastery button — only visible when caught up */}
                                      {s.caught_up && (
                                        <button
                                          type="button"
                                          disabled={isCumBusy}
                                          onClick={() => handleCaughtUpMastery(s, selectedQ.index)}
                                          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                            s.caught_up_mastered
                                              ? 'border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                                              : 'border-emerald-600/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400'
                                          }`}
                                        >
                                          {isCumBusy
                                            ? <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                            : s.caught_up_mastered
                                              ? <><Undo2 className="h-3 w-3" /> Undo Mastery</>
                                              : <><Star className="h-3 w-3" /> Mark Mastered</>
                                          }
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Not marked */}
                        {selectedQ.not_marked.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                              <HelpCircle className="h-4 w-4" />
                              Not Marked
                              <Badge variant="secondary" className="ml-1">{selectedQ.not_marked.length}</Badge>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedQ.not_marked.map((s) => (
                                <Badge key={s.student_id} variant="secondary">
                                  #{s.roll_number} {s.full_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
