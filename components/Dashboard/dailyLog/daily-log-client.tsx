'use client';

import { useState, useTransition } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  CheckCircle2, Circle, RotateCcw, Filter, GraduationCap,
  Layers, BookOpen, BookMarked,
} from 'lucide-react';
import {
  toggleChapterQuestion,
  setChapterCompletion,
} from '@/lib/actions/chapter-actions';
import {
  getSubjectsForGrade,
} from '@/lib/actions/analytics-actions';
import type { ChapterWithSubject } from '@/lib/adapters/chapter.adapter';
import type { GradeSection, SubjectForFilter } from '@/lib/actions/analytics-actions';

type Props = {
  chapters: ChapterWithSubject[];
  gradesWithSections: GradeSection[];
};

function formatTaughtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function DailyLogClient({ chapters, gradesWithSections }: Props) {
  // ── Filter state ──────────────────────────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjects, setSubjects] = useState<SubjectForFilter[]>([]);
  const [isLoadingSubjects, startSubjectsTransition] = useTransition();

  // ── Question/chapter mutation state ───────────────────────────────────
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────
  const currentGrade = gradesWithSections.find((g) => g.grade === selectedGrade);
  const availableSections = currentGrade?.sections ?? [];
  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  // Filter chapters: matching subject + section
  const filteredChapters = selectedSubjectId && selectedSection
    ? chapters.filter(
        (c) =>
          c.subject_id === selectedSubjectId &&
          c.section?.toUpperCase() === selectedSection.toUpperCase()
      )
    : [];

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedSection('');
    setSelectedSubjectId('');
    setSubjects([]);
    startSubjectsTransition(async () => {
      const data = await getSubjectsForGrade(grade);
      setSubjects(data);
    });
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    setSelectedSubjectId('');
  };

  const handleToggleQuestion = (
    chapter_id: string,
    question_index: number,
    is_completed: boolean
  ) => {
    const key = `${chapter_id}-${question_index}`;
    setBusyKey(key);
    startTransition(async () => {
      const result = await toggleChapterQuestion({ chapter_id, question_index, is_completed });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      setBusyKey(null);
    });
  };

  const handleChapterCompletion = (chapter_id: string, is_completed: boolean) => {
    const key = `chapter-${chapter_id}`;
    setBusyKey(key);
    startTransition(async () => {
      const result = await setChapterCompletion({ chapter_id, is_completed });
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
      setBusyKey(null);
    });
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Filter Card ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filter
          </CardTitle>
          <CardDescription>
            Select a Grade, Section, and Subject to view chapters
          </CardDescription>
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
                    <SelectItem key={g.grade} value={g.grade}>
                      Grade {g.grade}
                    </SelectItem>
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
                    availableSections.length === 0 ? 'No sections' :
                    'Select section'
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
                onValueChange={setSelectedSubjectId}
                disabled={!selectedSection || subjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedGrade ? 'Select grade first' :
                    isLoadingSubjects ? 'Loading...' :
                    !selectedSection ? 'Select section first' :
                    subjects.length === 0 ? 'No subjects found' :
                    'Select subject'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={s.subject_id}>
                      <div className="flex items-center gap-2">
                        {s.color_code && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color_code }}
                          />
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
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedSubject.color_code }}
                    />
                  )}
                  {selectedSubject.subject_name}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Empty / prompt state ──────────────────────────────────────── */}
      {!selectedSubjectId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookMarked className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Select a Grade, Section, and Subject
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chapters and questions for that class will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── No chapters found ─────────────────────────────────────────── */}
      {selectedSubjectId && filteredChapters.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No chapters found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No chapters found for this subject and section. Create them from the Teacher Dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Chapter list ──────────────────────────────────────────────── */}
      {selectedSubjectId && filteredChapters.length > 0 && (
        <div className="space-y-4">
          {filteredChapters.map((chapter) => {
            const questions = chapter.questions ?? [];
            const total = questions.length;
            const done = questions.filter((q) => q.is_completed).length;
            const allDone = total > 0 && done === total;
            const chapterBusy = busyKey === `chapter-${chapter.chapter_id}`;

            return (
              <Card key={chapter.chapter_id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        <span>
                          {chapter.order_index ? `Ch ${chapter.order_index}: ` : ''}
                          {chapter.chapter_name}
                        </span>
                        {chapter.is_completed && (
                          <Badge variant="outline" className="border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {chapter.subject_name ?? 'Unknown subject'}
                        {chapter.section ? ` · Section ${chapter.section}` : ''}
                        {' · '}
                        {done}/{total} questions taught
                      </CardDescription>
                    </div>

                    {/* Chapter complete / reopen */}
                    {chapter.is_completed ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending && chapterBusy}
                        onClick={() => handleChapterCompletion(chapter.chapter_id, false)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        Reopen
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={(isPending && chapterBusy) || !allDone}
                        title={!allDone ? 'Mark all questions taught first' : undefined}
                        onClick={() => handleChapterCompletion(chapter.chapter_id, true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Mark Complete
                      </Button>
                    )}
                  </div>

                  {/* Progress bar */}
                  {total > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${(done / total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {done} of {total} questions taught
                        {allDone && done > 0 && (
                          <span className="ml-2 font-medium text-foreground">· All done!</span>
                        )}
                      </p>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  {total === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No questions added to this chapter yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {questions.map((q, index) => {
                        const qBusy = busyKey === `${chapter.chapter_id}-${index}`;
                        return (
                          <li key={index}>
                            <button
                              type="button"
                              disabled={isPending && qBusy}
                              onClick={() =>
                                handleToggleQuestion(chapter.chapter_id, index, !q.is_completed)
                              }
                              className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent disabled:opacity-60"
                            >
                              {q.is_completed ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                              ) : (
                                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                              )}
                              <span className={[
                                'flex-1 text-sm',
                                q.is_completed ? 'text-muted-foreground line-through' : '',
                              ].join(' ')}>
                                {q.text}
                              </span>
                              {q.is_completed && q.taught_date && (
                                <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                                  {formatTaughtDate(q.taught_date)}
                                </Badge>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
