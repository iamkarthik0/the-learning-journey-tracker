'use server';

import { revalidatePath } from 'next/cache';
import { studentAdapter } from '@/lib/adapters/student.adapter';
import { subjectAdapter } from '@/lib/adapters/subject.adapter';
import { chapterAdapter } from '@/lib/adapters/chapter.adapter';
import { studentAttendanceAdapter } from '@/lib/adapters/student-attendance.adapter';
import { catchupAdapter } from '@/lib/adapters/student-question-catchup.adapter';

// ── Types ──────────────────────────────────────────────────────────────────

export type GradeSection = {
  grade: string;
  sections: string[];
};

export type SubjectForFilter = {
  subject_id: string;
  subject_name: string;
  color_code: string | null;
};

export type ChapterProgress = {
  chapter_id: string;
  chapter_name: string;
  order_index: number | null;
  is_completed: boolean;
  start_date: string | null;
  end_date: string | null;
  total_questions: number;
  completed_questions: number;
  pending_questions: number;
  questions: {
    index: number;
    text: string;
    is_completed: boolean;
    taught_date: string | null;
  }[];
};

export type StudentEntry = {
  student_id: string;
  full_name: string;
  roll_number: number;
  // Absent student flags
  caught_up?: boolean;
  catchup_id?: string;
  caught_up_date?: string;
  caught_up_mastered?: boolean;
  caught_up_mastered_id?: string;
  caught_up_mastered_date?: string;
  // Present student flags
  mastered?: boolean;
  mastery_id?: string;
  mastery_date?: string;
};

export type QuestionDetail = {
  index: number;
  text: string;
  taught_date: string | null;
  present: StudentEntry[];
  absent: StudentEntry[];   // includes caught_up flag
  not_marked: StudentEntry[];
};

export type ChapterAttendanceDetail = {
  chapter_id: string;
  chapter_name: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  not_marked_count: number;
  present_percent: number;
  absent_percent: number;
  questions: QuestionDetail[];
};

// ── Actions ────────────────────────────────────────────────────────────────

/** All unique grades + their sections (from active students) */
export async function getGradesWithSections(): Promise<GradeSection[]> {
  try {
    const students = await studentAdapter.findAll();
    const map = new Map<string, Set<string>>();

    for (const s of students) {
      if (!s.grade_level || s.status !== 'active') continue;
      if (!map.has(s.grade_level)) map.set(s.grade_level, new Set());
      if (s.section) map.get(s.grade_level)!.add(s.section);
    }

    const GRADE_ORDER = [
      '1st','2nd','3rd','4th','5th','6th',
      '7th','8th','9th','10th','11th','12th',
    ];
    return Array.from(map.entries())
      .map(([grade, secs]) => ({
        grade,
        sections: Array.from(secs).sort(),
      }))
      .sort((a, b) => {
        const ai = GRADE_ORDER.indexOf(a.grade);
        const bi = GRADE_ORDER.indexOf(b.grade);
        if (ai !== -1 && bi !== -1) return ai - bi;
        return a.grade.localeCompare(b.grade);
      });
  } catch (e) {
    console.error(e);
    return [];
  }
}

/** Subjects for a given grade */
export async function getSubjectsForGrade(
  grade: string
): Promise<SubjectForFilter[]> {
  try {
    const all = await subjectAdapter.findAll();
    return all
      .filter((s) => s.grade_level === grade)
      .map((s) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        color_code: s.color_code ?? null,
      }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

/** Chapter progress (questions done/pending) for a subject + section */
export async function getChapterProgressForSubjectSection(
  subject_id: string,
  section: string
): Promise<ChapterProgress[]> {
  try {
    const raw = await chapterAdapter.findBySubject(subject_id);
    const filtered = raw.filter(
      (c) => !c.section || c.section.toUpperCase() === section.toUpperCase()
    );

    return filtered
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((c) => {
        const qs = c.questions ?? [];
        const completed = qs.filter((q) => q.is_completed).length;
        return {
          chapter_id: c.chapter_id,
          chapter_name: c.chapter_name,
          order_index: c.order_index,
          is_completed: !!c.is_completed,
          start_date: c.start_date ?? null,
          end_date: c.end_date ?? null,
          total_questions: qs.length,
          completed_questions: completed,
          pending_questions: qs.length - completed,
          questions: qs.map((q, i) => ({
            index: i,
            text: q.text,
            is_completed: q.is_completed,
            taught_date: q.taught_date ?? null,
          })),
        };
      });
  } catch (e) {
    console.error(e);
    return [];
  }
}

/** Full attendance detail for every question in a chapter, with catch-up info */
export async function getChapterAttendanceDetail(
  chapter_id: string,
  grade: string,
  section: string
): Promise<ChapterAttendanceDetail | null> {
  try {
    const chapter = await chapterAdapter.findById(chapter_id);
    if (!chapter) return null;

    // Active students for this grade+section
    const allStudents = await studentAdapter.findAll();
    const classStudents = allStudents.filter(
      (s) =>
        s.status === 'active' &&
        s.grade_level === grade &&
        s.section?.toUpperCase() === section.toUpperCase()
    );

    const [allAttendance, catchupRecords] = await Promise.all([
      studentAttendanceAdapter.findAll(),
      catchupAdapter.findByChapter(chapter_id),
    ]);

    // Build lookups keyed by "student_id-question_index"
    const catchupMap     = new Map<string, { catchup_id: string; caught_up_date: string }>();
    const masteryMap     = new Map<string, { mastery_id: string; mastery_date: string }>();
    const cumMasteryMap  = new Map<string, { id: string; date: string }>(); // caught_up_mastered

    for (const c of catchupRecords) {
      const key = `${c.student_id}-${c.question_index}`;
      if (c.type === 'catchup') {
        catchupMap.set(key, { catchup_id: c.catchup_id, caught_up_date: c.caught_up_date });
      } else if (c.type === 'mastery') {
        masteryMap.set(key, { mastery_id: c.catchup_id, mastery_date: c.caught_up_date });
      } else if (c.type === 'caught_up_mastered') {
        cumMasteryMap.set(key, { id: c.catchup_id, date: c.caught_up_date });
      }
    }

    const qs = chapter.questions ?? [];

    const questions: QuestionDetail[] = qs.map((q, i) => {
      if (!q.taught_date) {
        return {
          index: i,
          text: q.text,
          taught_date: null,
          present: [],
          absent: [],
          not_marked: classStudents.map((s) => ({
            student_id: s.student_id,
            full_name: s.full_name,
            roll_number: s.roll_number,
          })),
        };
      }

      const dayRecords = allAttendance.filter(
        (r) => r.attendance_date === q.taught_date
      );
      const recordMap = new Map(dayRecords.map((r) => [r.student_id, r]));

      const present: StudentEntry[] = [];
      const absent: StudentEntry[] = [];
      const not_marked: StudentEntry[] = [];

      for (const s of classStudents) {
        const rec = recordMap.get(s.student_id);
        const base: StudentEntry = {
          student_id: s.student_id,
          full_name: s.full_name,
          roll_number: s.roll_number,
        };

        if (!rec) {
          not_marked.push(base);
        } else if (rec.status === 'absent') {
          const catchup    = catchupMap.get(`${s.student_id}-${i}`);
          const cumMastery = cumMasteryMap.get(`${s.student_id}-${i}`);
          absent.push({
            ...base,
            caught_up: !!catchup,
            catchup_id: catchup?.catchup_id,
            caught_up_date: catchup?.caught_up_date,
            caught_up_mastered: !!cumMastery,
            caught_up_mastered_id: cumMastery?.id,
            caught_up_mastered_date: cumMastery?.date,
          });
        } else {
          const mastery = masteryMap.get(`${s.student_id}-${i}`);
          present.push({
            ...base,
            mastered: !!mastery,
            mastery_id: mastery?.mastery_id,
            mastery_date: mastery?.mastery_date,
          });
        }
      }

      const sortFn = (a: StudentEntry, b: StudentEntry) =>
        a.roll_number - b.roll_number;
      present.sort(sortFn);
      absent.sort(sortFn);
      not_marked.sort(sortFn);

      return { index: i, text: q.text, taught_date: q.taught_date, present, absent, not_marked };
    });

    // Chapter-level aggregates
    const taughtQs = questions.filter((q) => q.taught_date);
    const totalStudents = classStudents.length;

    let sumPresent = 0, sumAbsent = 0, sumNotMarked = 0;
    for (const q of taughtQs) {
      sumPresent += q.present.length;
      sumAbsent += q.absent.length;
      sumNotMarked += q.not_marked.length;
    }

    const totalSlots = taughtQs.length * totalStudents || 1;

    return {
      chapter_id,
      chapter_name: chapter.chapter_name,
      total_students: totalStudents,
      present_count: taughtQs.length > 0 ? Math.round(sumPresent / taughtQs.length) : 0,
      absent_count: taughtQs.length > 0 ? Math.round(sumAbsent / taughtQs.length) : 0,
      not_marked_count: taughtQs.length > 0 ? Math.round(sumNotMarked / taughtQs.length) : 0,
      present_percent: Math.round((sumPresent / totalSlots) * 100),
      absent_percent: Math.round((sumAbsent / totalSlots) * 100),
      questions,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ── Catchup & Mastery toggle ───────────────────────────────────────────────

export type CatchupResult = { success: boolean; message: string; catchup_id?: string };

/** Mark an absent student as caught up on a specific question */
export async function markStudentCatchup(data: {
  student_id: string;
  chapter_id: string;
  question_index: number;
}): Promise<CatchupResult> {
  try {
    const existing = await catchupAdapter.findOne({ ...data, type: 'catchup' });
    if (existing) {
      return { success: true, message: 'Already marked as caught up', catchup_id: existing.catchup_id };
    }
    const record = await catchupAdapter.create({ ...data, type: 'catchup' });
    revalidatePath('/dashboard/analytics');
    return { success: true, message: 'Marked as caught up', catchup_id: record.catchup_id };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Failed to mark catch-up' };
  }
}

/** Mark a present student as having mastered a question */
export async function markStudentMastery(data: {
  student_id: string;
  chapter_id: string;
  question_index: number;
}): Promise<CatchupResult> {
  try {
    const existing = await catchupAdapter.findOne({ ...data, type: 'mastery' });
    if (existing) {
      return { success: true, message: 'Already marked as mastered', catchup_id: existing.catchup_id };
    }
    const record = await catchupAdapter.create({ ...data, type: 'mastery' });
    revalidatePath('/dashboard/analytics');
    return { success: true, message: 'Marked as mastered ⭐', catchup_id: record.catchup_id };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Failed to mark mastery' };
  }
}

/** Mark an absent+caught-up student as having also mastered the question */
export async function markStudentCaughtUpMastered(data: {
  student_id: string;
  chapter_id: string;
  question_index: number;
}): Promise<CatchupResult> {
  try {
    const existing = await catchupAdapter.findOne({ ...data, type: 'caught_up_mastered' });
    if (existing) {
      return { success: true, message: 'Already marked as mastered', catchup_id: existing.catchup_id };
    }
    const record = await catchupAdapter.create({ ...data, type: 'caught_up_mastered' });
    revalidatePath('/dashboard/analytics');
    return { success: true, message: 'Marked as mastered after catch-up ⭐', catchup_id: record.catchup_id };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Failed to mark mastery' };
  }
}

/** Undo any mark (catchup or mastery) by its ID */
export async function undoStudentMark(catchup_id: string): Promise<CatchupResult> {
  try {
    await catchupAdapter.delete(catchup_id);
    revalidatePath('/dashboard/analytics');
    return { success: true, message: 'Mark removed' };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Failed to remove mark' };
  }
}
