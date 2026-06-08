'use client';

import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, GraduationCap, Layers } from 'lucide-react';
import { AnalyticsCharts } from './analytics-charts';
import { ChapterAnalyticsClient } from './student-analytics-client';

type SubjectLite = {
  subject_id: string;
  subject_name: string;
  grade_level: string | null;
};

type QuestionLite = {
  text: string;
  is_completed: boolean;
  taught_date?: string | null;
};

type ChapterLite = {
  chapter_id: string;
  subject_id: string;
  subject_name: string | null;
  chapter_name: string;
  section: string | null;
  order_index: number | null;
  is_completed: boolean;
  start_date: string | null;
  end_date: string | null;
  questions: QuestionLite[];
};

const GRADE_ORDER = [
  '1st','2nd','3rd','4th','5th','6th',
  '7th','8th','9th','10th','11th','12th',
];

export function AnalyticsPageClient({
  subjects,
  chapters,
}: {
  subjects: SubjectLite[];
  chapters: ChapterLite[];
}) {
  // ── Sorted unique grades ─────────────────────────────────────────
  const grades = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => { if (s.grade_level) set.add(s.grade_level); });
    return Array.from(set).sort(
      (a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
    );
  }, [subjects]);

  // ── Defaults — first available grade/subject/section ────────────
  const defaultGrade = grades[0] ?? '';

  const firstSubjectForGrade = useMemo(
    () => subjects.find((s) => s.grade_level === defaultGrade)?.subject_id ?? '',
    [subjects, defaultGrade]
  );

  const firstSectionForSubject = useMemo(() => {
    const ch = chapters.find(
      (c) => c.subject_id === firstSubjectForGrade && c.section
    );
    return ch?.section ?? '';
  }, [chapters, firstSubjectForGrade]);

  // ── Filter state — no 'all', starts with first available ────────
  const [gradeFilter,   setGradeFilter]   = useState(defaultGrade);
  const [subjectFilter, setSubjectFilter] = useState(firstSubjectForGrade);
  const [sectionFilter, setSectionFilter] = useState(firstSectionForSubject);

  // ── Cascading dropdown lists ─────────────────────────────────────
  const subjectsForDropdown = useMemo(
    () => subjects.filter((s) => s.grade_level === gradeFilter),
    [subjects, gradeFilter]
  );

  const sectionsForDropdown = useMemo(() => {
    const set = new Set<string>();
    chapters
      .filter(
        (c) =>
          c.subject_id === subjectFilter &&
          c.section != null
      )
      .forEach((c) => set.add(c.section!));
    return Array.from(set).sort();
  }, [chapters, subjectFilter]);

  // ── Filtered data ────────────────────────────────────────────────
  const filteredSubjects = useMemo(
    () => subjects.filter((s) => s.subject_id === subjectFilter),
    [subjects, subjectFilter]
  );

  const filteredChapters = useMemo(
    () =>
      chapters.filter(
        (c) =>
          c.subject_id === subjectFilter &&
          (sectionFilter === '' || c.section === sectionFilter)
      ),
    [chapters, subjectFilter, sectionFilter]
  );

  // ── Handlers — cascade resets ────────────────────────────────────
  const handleGradeChange = (v: string) => {
    setGradeFilter(v);
    // Reset to first subject of new grade
    const firstSubject =
      subjects.find((s) => s.grade_level === v)?.subject_id ?? '';
    setSubjectFilter(firstSubject);
    // Reset to first section of that subject
    const firstSection =
      chapters.find((c) => c.subject_id === firstSubject && c.section)
        ?.section ?? '';
    setSectionFilter(firstSection);
  };

  const handleSubjectChange = (v: string) => {
    setSubjectFilter(v);
    // Reset to first section of new subject
    const firstSection =
      chapters.find((c) => c.subject_id === v && c.section)?.section ?? '';
    setSectionFilter(firstSection);
  };

  const activeSubject = subjects.find((s) => s.subject_id === subjectFilter);

  return (
    <div className="space-y-6">
      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Grade */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              Grade
            </label>
            <Select value={gradeFilter} onValueChange={handleGradeChange}>
              <SelectTrigger className="h-10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grades.map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Subject
            </label>
            <Select value={subjectFilter} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectsForDropdown.map((s) => (
                  <SelectItem key={s.subject_id} value={s.subject_id}>
                    {s.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Section
            </label>
            <Select
              value={sectionFilter || '__none__'}
              onValueChange={(v) => setSectionFilter(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="h-10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectionsForDropdown.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No sections
                  </SelectItem>
                ) : (
                  sectionsForDropdown.map((s) => (
                    <SelectItem key={s} value={s}>
                      Section {s}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary line */}
        {activeSubject && (
          <p className="mt-3 text-xs text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {activeSubject.subject_name}
            </span>
            {sectionFilter && (
              <>
                {' · '}
                <span className="font-medium text-foreground">
                  Section {sectionFilter}
                </span>
              </>
            )}
            {' · '}
            <span className="font-medium text-foreground">
              {filteredChapters.length}
            </span>{' '}
            chapter{filteredChapters.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Charts ────────────────────────────────────────────────── */}
      <AnalyticsCharts subjects={filteredSubjects} chapters={filteredChapters} />

      {/* ── Chapter list ──────────────────────────────────────────── */}
      <ChapterAnalyticsClient
        subjects={filteredSubjects}
        chapters={filteredChapters}
      />
    </div>
  );
}
