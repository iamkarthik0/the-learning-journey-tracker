'use server';

import { revalidatePath } from 'next/cache';
import { studentAttendanceAdapter, SubjectStatus } from '@/lib/adapters/student-attendance.adapter';
import { studentAdapter } from '@/lib/adapters/student.adapter';
import { subjectAdapter } from '@/lib/adapters/subject.adapter';

export type AttendanceFormState = {
  success: boolean;
  message: string;
};

// Get students by grade level with today's attendance status
export async function getStudentsByGradeWithAttendance(grade_level: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allStudents = await studentAdapter.findAll();
    const filteredStudents = allStudents.filter(
      (student) => student.grade_level === grade_level && student.status === 'active'
    );

    // Check if attendance exists for today
    const studentsWithAttendance = await Promise.all(
      filteredStudents.map(async (student) => {
        const attendance = await studentAttendanceAdapter.findByStudentIdAndDate(
          student.student_id,
          today
        );
        return {
          ...student,
          hasAttendanceToday: !!attendance,
          todayAttendance: attendance,
        };
      })
    );

    return studentsWithAttendance;
  } catch (error) {
    console.error('Error fetching students by grade:', error);
    return [];
  }
}

// Get students by grade + section with today's attendance status
export async function getStudentsByGradeAndSectionWithAttendance(
  grade_level: string,
  section: string
) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allStudents = await studentAdapter.findAll();
    const filteredStudents = allStudents.filter(
      (student) =>
        student.grade_level === grade_level &&
        student.section === section &&
        student.status === 'active'
    );

    const studentsWithAttendance = await Promise.all(
      filteredStudents.map(async (student) => {
        const attendance = await studentAttendanceAdapter.findByStudentIdAndDate(
          student.student_id,
          today
        );
        return {
          ...student,
          hasAttendanceToday: !!attendance,
          todayAttendance: attendance,
        };
      })
    );

    return studentsWithAttendance;
  } catch (error) {
    console.error('Error fetching students by grade and section:', error);
    return [];
  }
}

// Get list of unique sections for a given grade (active students only)
export async function getSectionsByGrade(grade_level: string) {
  try {
    const allStudents = await studentAdapter.findAll();
    const sections = new Set<string>();
    allStudents.forEach((s) => {
      if (
        s.grade_level === grade_level &&
        s.status === 'active' &&
        s.section
      ) {
        sections.add(s.section);
      }
    });
    return Array.from(sections).sort();
  } catch (error) {
    console.error('Error fetching sections by grade:', error);
    return [];
  }
}

// Get all subjects
export async function getAllSubjects() {
  try {
    return await subjectAdapter.findAll();
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

// Create or update attendance
export async function saveAttendance(data: {
  student_id: string;
  status: 'present' | 'absent';
  subject_status: SubjectStatus[];
  attendance_date?: string;
}): Promise<AttendanceFormState> {
  try {
    const today = data.attendance_date || new Date().toISOString().split('T')[0];

    // Check if attendance already exists for this student on this date
    const existingAttendance = await studentAttendanceAdapter.findByStudentIdAndDate(
      data.student_id,
      today
    );

    if (existingAttendance) {
      // Update existing attendance
      await studentAttendanceAdapter.update(existingAttendance.attendance_id, {
        status: data.status,
        subject_status: data.subject_status,
      });
    } else {
      // Create new attendance
      await studentAttendanceAdapter.create({
        student_id: data.student_id,
        status: data.status,
        subject_status: data.subject_status,
        attendance_date: today,
      });
    }

    revalidatePath('/dashboard/attendance');

    return {
      success: true,
      message: 'Attendance saved successfully!',
    };
  } catch (error) {
    console.error('Error saving attendance:', error);
    return {
      success: false,
      message: 'Failed to save attendance',
    };
  }
}

// Get attendance by student ID and date
export async function getAttendanceByStudentIdAndDate(
  student_id: string,
  attendance_date?: string
) {
  try {
    const today = attendance_date || new Date().toISOString().split('T')[0];
    return await studentAttendanceAdapter.findByStudentIdAndDate(student_id, today);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return undefined;
  }
}

// Get attendance by student ID
export async function getAttendanceByStudentId(student_id: string) {
  try {
    return await studentAttendanceAdapter.findByStudentId(student_id);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return undefined;
  }
}

// Get all attendance records for today
export async function getTodayAttendance() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allRecords = await studentAttendanceAdapter.findAll();
    return allRecords.filter((record) => record.attendance_date === today);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    return [];
  }
}

// Get all attendance records for a specific date (YYYY-MM-DD)
export async function getAttendanceByDate(attendance_date: string) {
  try {
    const allRecords = await studentAttendanceAdapter.findAll();
    return allRecords.filter((record) => record.attendance_date === attendance_date);
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    return [];
  }
}

// Get all attendance records
export async function getAllAttendance() {
  try {
    return await studentAttendanceAdapter.findAll();
  } catch (error) {
    console.error('Error fetching all attendance:', error);
    return [];
  }
}

// Get attendance statistics for today
export async function getAttendanceStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allStudents = await studentAdapter.findAll();
    const activeStudents = allStudents.filter((s) => s.status === 'active');
    const totalStudents = activeStudents.length;

    const todayRecords = await getAttendanceByDate(today);
    const presentToday = todayRecords.filter((r) => r.status === 'present').length;
    const absentToday = todayRecords.filter((r) => r.status === 'absent').length;

    const attendanceRate = totalStudents > 0 
      ? Math.round((presentToday / totalStudents) * 100) 
      : 0;

    return {
      totalStudents,
      presentToday,
      absentToday,
      attendanceRate,
    };
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return {
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0,
    };
  }
}
