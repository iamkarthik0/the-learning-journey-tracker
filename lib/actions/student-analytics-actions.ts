'use server';

import { studentAdapter } from '@/lib/adapters/student.adapter';
import { studentAttendanceAdapter } from '@/lib/adapters/student-attendance.adapter';
import { chapterAdapter } from '@/lib/adapters/chapter.adapter';
import { subjectAdapter } from '@/lib/adapters/subject.adapter';

// Helper: do dates ke beech kitne din (inclusive)
function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1; // inclusive
}

export type QuestionAnalytics = {
  text: string;
  is_completed: boolean; // teacher ne padhaya ya nahi
  taught_date?: string | null; // kis din padha gaya
};

export type ChapterAnalytics = {
  chapter_id: string;
  chapter_name: string;
  subject_id: string;
  subject_name: string | null;
  order_index: number | null;
  is_completed: boolean;
  start_date: string | null;
  end_date: string | null;
  days_taken: number | null; // chapter khatam hone me kitne din
  total_questions: number;
  completed_questions: number;
  pending_questions: number;
  questions: QuestionAnalytics[];
};

// Ek class-day ka record us subject ke liye
export type SubjectDayRecord = {
  date: string;
  status: 'present' | 'absent';
  was_taught: boolean; // us din ye subject padha gaya tha?
};

export type SubjectAnalytics = {
  subject_id: string;
  subject_name: string;
  total_class_days: number; // is subject ke kitne din class hui (records me)
  present_days: number;
  absent_days: number;
  attendance_percent: number;
  day_records: SubjectDayRecord[];
};

export type StudentAnalytics = {
  student: {
    student_id: string;
    full_name: string;
    roll_number: number;
    grade_level: string | null;
    section: string | null;
    status: string | null;
  };
  overall: {
    total_days_marked: number;
    present_days: number;
    absent_days: number;
    attendance_percent: number;
  };
  subjects: SubjectAnalytics[];
  chapters: ChapterAnalytics[];
};

export async function getStudentAnalytics(
  student_id: string
): Promise<StudentAnalytics | null> {
  try {
    const student = await studentAdapter.findById(student_id);
    if (!student) return null;

    const [attendanceRecords, allChapters, allSubjects] = await Promise.all([
      studentAttendanceAdapter.findAllByStudentId(student_id),
      chapterAdapter.findAll(),
      subjectAdapter.findAll(),
    ]);

    const subjectNameMap = new Map<string, string>();
    allSubjects.forEach((s) => subjectNameMap.set(s.subject_id, s.subject_name));

    // ---- OVERALL ATTENDANCE ----
    const presentDays = attendanceRecords.filter((r) => r.status === 'present').length;
    const absentDays = attendanceRecords.filter((r) => r.status === 'absent').length;
    const totalMarked = presentDays + absentDays;

    // ---- PER-SUBJECT ATTENDANCE (day by day) ----
    // Har record me subject_status array hota hai: [{subject_id, is_completed}]
    // is_completed yahan = us din wo subject class me padha gaya
    const subjectDayMap = new Map<string, SubjectDayRecord[]>();

    for (const record of attendanceRecords) {
      const subjectStatus = record.subject_status
        ? (typeof record.subject_status === 'string'
            ? JSON.parse(record.subject_status)
            : record.subject_status)
        : [];

      for (const ss of subjectStatus as Array<{
        subject_id: string;
        is_completed: boolean;
      }>) {
        if (!subjectDayMap.has(ss.subject_id)) {
          subjectDayMap.set(ss.subject_id, []);
        }
        subjectDayMap.get(ss.subject_id)!.push({
          date: record.attendance_date,
          status: record.status === 'absent' ? 'absent' : 'present',
          was_taught: !!ss.is_completed,
        });
      }
    }

    const subjects: SubjectAnalytics[] = Array.from(subjectDayMap.entries())
      .map(([subject_id, dayRecords]) => {
        const sorted = [...dayRecords].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        const present = sorted.filter((d) => d.status === 'present').length;
        const absent = sorted.filter((d) => d.status === 'absent').length;
        const total = sorted.length;
        return {
          subject_id,
          subject_name: subjectNameMap.get(subject_id) ?? 'Unknown',
          total_class_days: total,
          present_days: present,
          absent_days: absent,
          attendance_percent: total > 0 ? Math.round((present / total) * 100) : 0,
          day_records: sorted,
        };
      })
      .sort((a, b) => a.subject_name.localeCompare(b.subject_name));

    // ---- CHAPTERS (sirf student ke grade ke subjects ke) ----
    // Student ke grade ke subjects
    const gradeSubjectIds = new Set(
      allSubjects
        .filter((s) => !s.grade_level || s.grade_level === student.grade_level)
        .map((s) => s.subject_id)
    );

    const chapters: ChapterAnalytics[] = allChapters
      .filter((c) => gradeSubjectIds.has(c.subject_id))
      .map((c) => {
        const questions = c.questions ?? [];
        const completed = questions.filter((q) => q.is_completed).length;
        const total = questions.length;
        const daysTaken =
          c.start_date && c.end_date
            ? daysBetween(c.start_date, c.end_date)
            : null;

        return {
          chapter_id: c.chapter_id,
          chapter_name: c.chapter_name,
          subject_id: c.subject_id,
          subject_name: c.subject_name,
          order_index: c.order_index,
          is_completed: !!c.is_completed,
          start_date: c.start_date,
          end_date: c.end_date,
          days_taken: daysTaken,
          total_questions: total,
          completed_questions: completed,
          pending_questions: total - completed,
          questions: questions.map((q) => ({
            text: q.text,
            is_completed: q.is_completed,
            taught_date: q.taught_date ?? null,
          })),
        };
      })
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

    return {
      student: {
        student_id: student.student_id,
        full_name: student.full_name,
        roll_number: student.roll_number,
        grade_level: student.grade_level,
        section: student.section,
        status: student.status,
      },
      overall: {
        total_days_marked: totalMarked,
        present_days: presentDays,
        absent_days: absentDays,
        attendance_percent:
          totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0,
      },
      subjects,
      chapters,
    };
  } catch (error) {
    console.error('Error building student analytics:', error);
    return null;
  }
}

// ---- CHAPTER-LEVEL ATTENDANCE OVERVIEW ----
// Ek chapter ke saare taught_dates pe aggregate attendance
export type ChapterAttendanceOverview = {
  chapter_id: string;
  chapter_name: string;
  subject_name: string | null;
  section: string | null;
  grade_level: string | null;
  // Unique class days (dates jab koi question padha gaya)
  total_class_days: number;
  // Across all class days — per-student total marks
  total_student_days: number; // classStudents.length × class_days
  present_count: number;
  absent_count: number;
  not_marked_count: number;
  present_percent: number;
  absent_percent: number;
  // Day-wise breakdown for detail view
  day_breakdown: Array<{
    date: string;
    present: number;
    absent: number;
    not_marked: number;
    total_students: number;
  }>;
};

export async function getChapterAttendanceOverview(
  chapter_id: string
): Promise<ChapterAttendanceOverview | null> {
  try {
    const chapter = await chapterAdapter.findById(chapter_id);
    if (!chapter) return null;

    const allSubjects = await subjectAdapter.findAll();
    const subject = allSubjects.find((s) => s.subject_id === chapter.subject_id);
    const gradeLevel = subject?.grade_level ?? null;
    const section    = chapter.section ?? null;

    // Get unique taught_dates from questions
    const questions = chapter.questions ?? [];
    const taughtDates = Array.from(
      new Set(
        questions
          .map((q) => q.taught_date)
          .filter((d): d is string => !!d)
      )
    ).sort();

    if (taughtDates.length === 0) {
      return {
        chapter_id,
        chapter_name: chapter.chapter_name,
        subject_name: subject?.subject_name ?? chapter.subject_name,
        section,
        grade_level: gradeLevel,
        total_class_days: 0,
        total_student_days: 0,
        present_count: 0,
        absent_count: 0,
        not_marked_count: 0,
        present_percent: 0,
        absent_percent: 0,
        day_breakdown: [],
      };
    }

    // Students in this grade+section
    const allStudents = await studentAdapter.findAll();
    const classStudents = allStudents.filter(
      (s) =>
        s.status === 'active' &&
        (!gradeLevel || s.grade_level === gradeLevel) &&
        (!section    || s.section    === section)
    );
    const totalStudents = classStudents.length;
    const studentIdSet  = new Set(classStudents.map((s) => s.student_id));

    // All attendance records — filter to those dates
    const allAttendance = await studentAttendanceAdapter.findAll();
    const dateSet = new Set(taughtDates);
    const relevantRecords = allAttendance.filter(
      (r) => dateSet.has(r.attendance_date) && studentIdSet.has(r.student_id)
    );

    // Group by date
    const byDate = new Map<string, Map<string, 'present' | 'absent'>>();
    for (const rec of relevantRecords) {
      if (!byDate.has(rec.attendance_date)) {
        byDate.set(rec.attendance_date, new Map());
      }
      byDate
        .get(rec.attendance_date)!
        .set(rec.student_id, rec.status === 'absent' ? 'absent' : 'present');
    }

    let totalPresent = 0;
    let totalAbsent  = 0;
    let totalNotMarked = 0;

    const day_breakdown = taughtDates.map((date) => {
      const dayMap = byDate.get(date) ?? new Map();
      let p = 0, a = 0, nm = 0;
      for (const s of classStudents) {
        const status = dayMap.get(s.student_id);
        if (!status)           nm++;
        else if (status === 'present') p++;
        else                   a++;
      }
      totalPresent   += p;
      totalAbsent    += a;
      totalNotMarked += nm;
      return { date, present: p, absent: a, not_marked: nm, total_students: totalStudents };
    });

    const totalStudentDays = taughtDates.length * totalStudents;
    const marked = totalPresent + totalAbsent;

    return {
      chapter_id,
      chapter_name: chapter.chapter_name,
      subject_name: subject?.subject_name ?? chapter.subject_name,
      section,
      grade_level: gradeLevel,
      total_class_days: taughtDates.length,
      total_student_days: totalStudentDays,
      present_count:    totalPresent,
      absent_count:     totalAbsent,
      not_marked_count: totalNotMarked,
      present_percent:  marked > 0 ? Math.round((totalPresent / marked) * 100) : 0,
      absent_percent:   marked > 0 ? Math.round((totalAbsent  / marked) * 100) : 0,
      day_breakdown,
    };
  } catch (error) {
    console.error('Error fetching chapter attendance overview:', error);
    return null;
  }
}
// Ek question ke taught_date pe us subject/grade ke saare students ka present/absent status
export type QuestionDayStudent = {
  student_id: string;
  full_name: string;
  roll_number: number;
  section: string | null;
  status: 'present' | 'absent' | 'not-marked';
};

export type QuestionDayAttendance = {
  taught_date: string | null;
  subject_id: string;
  subject_name: string | null;
  grade_level: string | null;
  section: string | null;
  present: QuestionDayStudent[];
  absent: QuestionDayStudent[];
  notMarked: QuestionDayStudent[];
};

export async function getQuestionDayAttendance(data: {
  chapter_id: string;
  question_index: number;
}): Promise<QuestionDayAttendance | null> {
  try {
    const chapter = await chapterAdapter.findById(data.chapter_id);
    if (!chapter) return null;

    const questions = chapter.questions ?? [];
    const question = questions[data.question_index];
    if (!question) return null;

    // Subject info nikalo (grade ke liye)
    const allSubjects = await subjectAdapter.findAll();
    const subject = allSubjects.find((s) => s.subject_id === chapter.subject_id);
    const gradeLevel = subject?.grade_level ?? null;
    const section = chapter.section ?? null;

    const taughtDate = question.taught_date ?? null;

    // Agar question abhi taught nahi hua (koi date nahi), to attendance match nahi ho sakti
    if (!taughtDate) {
      return {
        taught_date: null,
        subject_id: chapter.subject_id,
        subject_name: subject?.subject_name ?? chapter.subject_name,
        grade_level: gradeLevel,
        section,
        present: [],
        absent: [],
        notMarked: [],
      };
    }

    // Us grade + section ke active students
    const allStudents = await studentAdapter.findAll();
    const classStudents = allStudents.filter(
      (s) =>
        s.status === 'active' &&
        (!gradeLevel || s.grade_level === gradeLevel) &&
        (!section || s.section === section)
    );

    // Us date ke saare attendance records
    const allAttendance = await studentAttendanceAdapter.findAll();
    const dayRecords = allAttendance.filter(
      (r) => r.attendance_date === taughtDate
    );
    const recordMap = new Map<string, (typeof dayRecords)[number]>();
    dayRecords.forEach((r) => recordMap.set(r.student_id, r));

    const present: QuestionDayStudent[] = [];
    const absent: QuestionDayStudent[] = [];
    const notMarked: QuestionDayStudent[] = [];

    for (const s of classStudents) {
      const rec = recordMap.get(s.student_id);
      const base = {
        student_id: s.student_id,
        full_name: s.full_name,
        roll_number: s.roll_number,
        section: s.section,
      };
      if (!rec) {
        notMarked.push({ ...base, status: 'not-marked' });
      } else if (rec.status === 'absent') {
        absent.push({ ...base, status: 'absent' });
      } else {
        present.push({ ...base, status: 'present' });
      }
    }

    const sortFn = (a: QuestionDayStudent, b: QuestionDayStudent) =>
      a.roll_number - b.roll_number;
    present.sort(sortFn);
    absent.sort(sortFn);
    notMarked.sort(sortFn);

    return {
      taught_date: taughtDate,
      subject_id: chapter.subject_id,
      subject_name: subject?.subject_name ?? chapter.subject_name,
      grade_level: gradeLevel,
      section,
      present,
      absent,
      notMarked,
    };
  } catch (error) {
    console.error('Error fetching question-day attendance:', error);
    return null;
  }
}
