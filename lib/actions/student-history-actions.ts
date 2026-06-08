'use server';

import { studentAdapter } from '@/lib/adapters/student.adapter';
import { studentAttendanceAdapter } from '@/lib/adapters/student-attendance.adapter';
import { subjectAdapter } from '@/lib/adapters/subject.adapter';
import { chapterAdapter } from '@/lib/adapters/chapter.adapter';

export type TimeRange = '1month' | '6months' | '1year' | 'all';

export type MissedQuestion = {
  chapter_name: string;
  subject_name: string;
  question_text: string;
  taught_date: string;
};

export type DayRecord = {
  date: string;          // YYYY-MM-DD
  status: 'present' | 'absent';
  subjects: string[];    // us din ke subject names
};

export type StudentHistoryData = {
  student: {
    student_id: string;
    full_name: string;
    roll_number: number;
    grade_level: string | null;
    section: string | null;
    status: string | null;
  };
  summary: {
    total_days: number;
    present: number;
    absent: number;
    attendance_percent: number;
  };
  day_records: DayRecord[];       // table rows
  missed_questions: MissedQuestion[]; // absent the jab ye question padha
};

function getFromDate(range: TimeRange): string | null {
  if (range === 'all') return null;
  const now = new Date();
  if (range === '1month') now.setMonth(now.getMonth() - 1);
  else if (range === '6months') now.setMonth(now.getMonth() - 6);
  else if (range === '1year') now.setFullYear(now.getFullYear() - 1);
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function getStudentHistory(
  student_id: string,
  range: TimeRange = 'all'
): Promise<StudentHistoryData | null> {
  try {
    const student = await studentAdapter.findById(student_id);
    if (!student) return null;

    const fromDate = getFromDate(range);

    // Saare attendance records
    const allRecords = await studentAttendanceAdapter.findAllByStudentId(student_id);

    // Date filter apply karo
    const records = fromDate
      ? allRecords.filter((r) => r.attendance_date >= fromDate)
      : allRecords;

    // Sort by date descending (latest first)
    records.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));

    // Subject map
    const allSubjects = await subjectAdapter.findAll();
    const subjectMap = new Map(allSubjects.map((s) => [s.subject_id, s.subject_name]));

    // Day records for table
    const day_records: DayRecord[] = records.map((r) => {
      const subjectStatus: Array<{ subject_id: string; is_completed: boolean }> =
        r.subject_status
          ? (typeof r.subject_status === 'string'
              ? JSON.parse(r.subject_status)
              : r.subject_status)
          : [];

      return {
        date: r.attendance_date,
        status: (r.status as 'present' | 'absent') || 'present',
        subjects: subjectStatus
          .map((ss) => subjectMap.get(ss.subject_id) ?? '')
          .filter(Boolean),
      };
    });

    // Summary stats
    const present = day_records.filter((d) => d.status === 'present').length;
    const absent = day_records.filter((d) => d.status === 'absent').length;
    const total = present + absent;

    // Absent dates set
    const absentDates = new Set(
      day_records.filter((d) => d.status === 'absent').map((d) => d.date)
    );

    // Missed questions: jab question padha gaya tab student absent tha
    const allChapters = await chapterAdapter.findAll();
    const gradeChapters = allChapters.filter(
      (c) =>
        !student.grade_level ||
        !c.subject_name ||
        allSubjects.find(
          (s) => s.subject_id === c.subject_id && s.grade_level === student.grade_level
        )
    );

    const missed_questions: MissedQuestion[] = [];

    for (const ch of gradeChapters) {
      const questions = ch.questions ?? [];
      for (const q of questions) {
        if (!q.is_completed || !q.taught_date) continue;
        // Range filter
        if (fromDate && q.taught_date < fromDate) continue;
        // Student absent tha us din?
        if (absentDates.has(q.taught_date)) {
          missed_questions.push({
            chapter_name: ch.chapter_name,
            subject_name: ch.subject_name ?? 'Unknown',
            question_text: q.text,
            taught_date: q.taught_date,
          });
        }
      }
    }

    // Sort missed by date desc
    missed_questions.sort((a, b) => b.taught_date.localeCompare(a.taught_date));

    return {
      student: {
        student_id: student.student_id,
        full_name: student.full_name,
        roll_number: student.roll_number,
        grade_level: student.grade_level,
        section: student.section,
        status: student.status,
      },
      summary: {
        total_days: total,
        present,
        absent,
        attendance_percent: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      day_records,
      missed_questions,
    };
  } catch (err) {
    console.error('Error fetching student history:', err);
    return null;
  }
}

export async function getAllStudentsForHistory() {
  try {
    const students = await studentAdapter.findAll();
    return students
      .filter((s) => s.status === 'active')
      .sort((a, b) => {
        const ga = a.grade_level ?? '';
        const gb = b.grade_level ?? '';
        if (ga !== gb) return ga.localeCompare(gb);
        return a.roll_number - b.roll_number;
      })
      .map((s) => ({
        student_id: s.student_id,
        full_name: s.full_name,
        roll_number: s.roll_number,
        grade_level: s.grade_level,
        section: s.section,
      }));
  } catch {
    return [];
  }
}
