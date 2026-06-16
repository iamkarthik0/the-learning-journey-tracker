'use server';

import { studentAdapter } from '@/lib/adapters/student.adapter';
import { teacherAdapter } from '@/lib/adapters/teacher.adapter';
import { subjectAdapter } from '@/lib/adapters/subject.adapter';
import { chapterAdapter } from '@/lib/adapters/chapter.adapter';
import { studentAttendanceAdapter } from '@/lib/adapters/student-attendance.adapter';

const GRADE_ORDER = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

export type PrincipalDashboardData = {
  // Summary cards
  totals: {
    active_students: number;
    inactive_students: number;
    teachers: number;
    subjects: number;
    total_chapters: number;
    completed_chapters: number;
    chapter_completion_pct: number;
    total_questions: number;
    taught_questions: number;
    question_taught_pct: number;
  };

  // Today's attendance
  today: {
    date: string;
    present: number;
    absent: number;
    total_marked: number;
    attendance_pct: number;
  };

  // Last 7 days trend [{date, present, absent, pct}]
  attendance_trend: Array<{
    date: string;        // "15 Jun"
    present: number;
    absent: number;
    pct: number;
  }>;

  // Subject-wise chapter completion
  subject_progress: Array<{
    subject_name: string;
    grade_level: string | null;
    completed: number;
    in_progress: number;
    total: number;
    completion_pct: number;
    questions_pct: number;
  }>;

  // Grade+Section attendance rates
  section_attendance: Array<{
    label: string;  // "Grade 5 · A"
    grade: string;
    section: string;
    present_pct: number;
    total_students: number;
    total_records: number;
  }>;

  // Grade-wise student count
  grade_distribution: Array<{
    grade: string;
    count: number;
  }>;
};

export async function getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
  const [students, teachers, subjects, chapters, allAttendance] = await Promise.all([
    studentAdapter.findAll(),
    teacherAdapter.findAll(),
    subjectAdapter.findAll(),
    chapterAdapter.findAll(),
    studentAttendanceAdapter.findAll(),
  ]);

  // ── TOTALS ──────────────────────────────────────────────────────
  const activeStudents   = students.filter((s) => s.status === 'active');
  const inactiveStudents = students.filter((s) => s.status !== 'active');

  let totalQ = 0, taughtQ = 0;
  let completedChapters = 0;
  for (const ch of chapters) {
    if (ch.is_completed) completedChapters++;
    for (const q of ch.questions ?? []) {
      totalQ++;
      if (q.is_completed) taughtQ++;
    }
  }

  // ── TODAY ────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = allAttendance.filter((r) => r.attendance_date === today);
  const todayPresent  = todayRecords.filter((r) => r.status === 'present').length;
  const todayAbsent   = todayRecords.filter((r) => r.status === 'absent').length;
  const todayTotal    = todayPresent + todayAbsent;

  // ── 7-DAY TREND ──────────────────────────────────────────────────
  const attendance_trend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const label   = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const recs = allAttendance.filter((r) => r.attendance_date === dateStr);
    const p = recs.filter((r) => r.status === 'present').length;
    const a = recs.filter((r) => r.status === 'absent').length;
    const total = p + a;
    return { date: label, present: p, absent: a, pct: total > 0 ? Math.round((p / total) * 100) : 0 };
  });

  // ── SUBJECT PROGRESS ─────────────────────────────────────────────
  const subjectMap = new Map<string, { name: string; grade: string | null; chs: typeof chapters }>();
  for (const ch of chapters) {
    const sub = subjects.find((s) => s.subject_id === ch.subject_id);
    const key = ch.subject_id;
    if (!subjectMap.has(key)) {
      subjectMap.set(key, { name: sub?.subject_name ?? ch.subject_name ?? 'Unknown', grade: sub?.grade_level ?? null, chs: [] });
    }
    subjectMap.get(key)!.chs.push(ch);
  }

  const subject_progress = Array.from(subjectMap.values())
    .map(({ name, grade, chs }) => {
      const total     = chs.length;
      const completed = chs.filter((c) => c.is_completed).length;
      const inProg    = total - completed;
      let sq = 0, tq = 0;
      for (const c of chs) { for (const q of c.questions ?? []) { sq++; if (q.is_completed) tq++; } }
      return {
        subject_name: name,
        grade_level: grade,
        completed,
        in_progress: inProg,
        total,
        completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
        questions_pct:  sq > 0 ? Math.round((tq / sq) * 100) : 0,
      };
    })
    .sort((a, b) => b.completion_pct - a.completion_pct);

  // ── SECTION ATTENDANCE ────────────────────────────────────────────
  const sectionMap = new Map<string, { grade: string; section: string; studentIds: Set<string> }>();
  for (const s of activeStudents) {
    if (!s.grade_level || !s.section) continue;
    const key = `${s.grade_level}::${s.section}`;
    if (!sectionMap.has(key)) sectionMap.set(key, { grade: s.grade_level, section: s.section, studentIds: new Set() });
    sectionMap.get(key)!.studentIds.add(s.student_id);
  }

  const section_attendance = Array.from(sectionMap.entries())
    .map(([, { grade, section, studentIds }]) => {
      const recs = allAttendance.filter((r) => studentIds.has(r.student_id));
      const p = recs.filter((r) => r.status === 'present').length;
      const a = recs.filter((r) => r.status === 'absent').length;
      const total = p + a;
      return {
        label: `${grade} · ${section}`,
        grade,
        section,
        present_pct: total > 0 ? Math.round((p / total) * 100) : 0,
        total_students: studentIds.size,
        total_records: total,
      };
    })
    .sort((a, b) => {
      const gi = GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
      return gi !== 0 ? gi : a.section.localeCompare(b.section);
    });

  // ── GRADE DISTRIBUTION ────────────────────────────────────────────
  const gradeCount = new Map<string, number>();
  for (const s of activeStudents) {
    if (s.grade_level) gradeCount.set(s.grade_level, (gradeCount.get(s.grade_level) ?? 0) + 1);
  }
  const grade_distribution = Array.from(gradeCount.entries())
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade));

  return {
    totals: {
      active_students:        activeStudents.length,
      inactive_students:      inactiveStudents.length,
      teachers:               teachers.length,
      subjects:               subjects.length,
      total_chapters:         chapters.length,
      completed_chapters:     completedChapters,
      chapter_completion_pct: chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0,
      total_questions:        totalQ,
      taught_questions:       taughtQ,
      question_taught_pct:    totalQ > 0 ? Math.round((taughtQ / totalQ) * 100) : 0,
    },
    today: {
      date:            today,
      present:         todayPresent,
      absent:          todayAbsent,
      total_marked:    todayTotal,
      attendance_pct:  todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0,
    },
    attendance_trend,
    subject_progress,
    section_attendance,
    grade_distribution,
  };
}
