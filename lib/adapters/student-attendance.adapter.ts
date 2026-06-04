import { getDb } from '@/lib/db/client';
import { studentAttendance } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export type StudentAttendanceRecord = typeof studentAttendance.$inferSelect;
export type SubjectStatus = {
  subject_id: string;
  is_completed: boolean;
};

class StudentAttendanceAdapter {
  private static instance: StudentAttendanceAdapter;

  private constructor() {}

  static getInstance(): StudentAttendanceAdapter {
    if (!StudentAttendanceAdapter.instance) {
      StudentAttendanceAdapter.instance = new StudentAttendanceAdapter();
    }
    return StudentAttendanceAdapter.instance;
  }

  async create(data: {
    student_id: string;
    status: 'present' | 'absent';
    subject_status?: SubjectStatus[];
    attendance_date?: string; // Format: YYYY-MM-DD
  }): Promise<StudentAttendanceRecord> {
    const db = getDb();
    const attendance_id = crypto.randomUUID();
    const today = data.attendance_date || new Date().toISOString().split('T')[0];

    const [record] = await db
      .insert(studentAttendance)
      .values({
        attendance_id,
        student_id: data.student_id,
        status: data.status,
        subject_status: data.subject_status
          ? JSON.stringify(data.subject_status)
          : null,
        attendance_date: today,
      })
      .returning();

    return record;
  }

  async findByStudentIdAndDate(
    student_id: string,
    attendance_date: string
  ): Promise<StudentAttendanceRecord | undefined> {
    const db = getDb();
    const [record] = await db
      .select()
      .from(studentAttendance)
      .where(
        and(
          eq(studentAttendance.student_id, student_id),
          eq(studentAttendance.attendance_date, attendance_date)
        )
      )
      .limit(1);

    return record;
  }

  async findByStudentId(student_id: string): Promise<StudentAttendanceRecord | undefined> {
    const db = getDb();
    const [record] = await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.student_id, student_id))
      .limit(1);

    return record;
  }

  // Saare records ek student ke liye (analytics ke liye)
  async findAllByStudentId(student_id: string): Promise<StudentAttendanceRecord[]> {
    const db = getDb();
    return await db
      .select()
      .from(studentAttendance)
      .where(eq(studentAttendance.student_id, student_id));
  }

  async update(
    attendance_id: string,
    data: {
      status?: 'present' | 'absent';
      subject_status?: SubjectStatus[];
    }
  ): Promise<StudentAttendanceRecord> {
    const db = getDb();
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.subject_status !== undefined) {
      updateData.subject_status = JSON.stringify(data.subject_status);
    }

    const [record] = await db
      .update(studentAttendance)
      .set(updateData)
      .where(eq(studentAttendance.attendance_id, attendance_id))
      .returning();

    return record;
  }

  async findAll(): Promise<StudentAttendanceRecord[]> {
    const db = getDb();
    return await db.select().from(studentAttendance);
  }

  async delete(attendance_id: string): Promise<void> {
    const db = getDb();
    await db
      .delete(studentAttendance)
      .where(eq(studentAttendance.attendance_id, attendance_id));
  }
}

export const studentAttendanceAdapter = StudentAttendanceAdapter.getInstance();
