import { getDb } from '@/lib/db/client';
import { students } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type CreateStudentInput = {
  roll_number: number;
  full_name: string;
  sourced_id?: string;
  grade_level?: string;
  section?: string;
  status?: 'active' | 'inactive';
};

export type Student = typeof students.$inferSelect;

export class StudentAdapter {
  private db = getDb();

  async create(input: CreateStudentInput): Promise<Student> {
    const studentId = crypto.randomUUID();

    const [student] = await this.db
      .insert(students)
      .values({
        student_id: studentId,
        roll_number: input.roll_number,
        full_name: input.full_name,
        sourced_id: input.sourced_id,
        grade_level: input.grade_level,
        section: input.section,
        status: input.status || 'active',
      })
      .returning();

    return student;
  }

  async findAll(): Promise<Student[]> {
    return await this.db.select().from(students).all();
  }

  async findById(studentId: string): Promise<Student | undefined> {
    const [student] = await this.db
      .select()
      .from(students)
      .where(eq(students.student_id, studentId))
      .limit(1);

    return student;
  }

  async findByRollNumber(rollNumber: number): Promise<Student | undefined> {
    const [student] = await this.db
      .select()
      .from(students)
      .where(eq(students.roll_number, rollNumber))
      .limit(1);

    return student;
  }

  async findByRollNumberAndGrade(
    rollNumber: number,
    gradeLevel: string
  ): Promise<Student | undefined> {
    const [student] = await this.db
      .select()
      .from(students)
      .where(
        and(
          eq(students.roll_number, rollNumber),
          eq(students.grade_level, gradeLevel)
        )
      )
      .limit(1);

    return student;
  }

  async findByRollNumberGradeAndSection(
    rollNumber: number,
    gradeLevel: string,
    section: string | null
  ): Promise<Student | undefined> {
    // Build where clauses dynamically because section may be null
    const conditions = [
      eq(students.roll_number, rollNumber),
      eq(students.grade_level, gradeLevel),
    ];

    if (section) {
      conditions.push(eq(students.section, section));
    }

    const rows = await this.db
      .select()
      .from(students)
      .where(and(...conditions))
      .all();

    if (section) {
      return rows[0];
    }

    // If no section provided, match only those with NULL/empty section
    return rows.find((r) => !r.section);
  }

  async findByGradeAndSection(gradeLevel: string, section: string): Promise<Student[]> {
    return await this.db
      .select()
      .from(students)
      .where(eq(students.grade_level, gradeLevel))
      .where(eq(students.section, section))
      .all();
  }

  async findActiveStudents(): Promise<Student[]> {
    return await this.db
      .select()
      .from(students)
      .where(eq(students.status, 'active'))
      .all();
  }

  async update(studentId: string, input: Partial<CreateStudentInput>): Promise<Student | undefined> {
    const updateData: any = { 
      ...input,
      updated_at: new Date().toISOString(),
    };

    const [student] = await this.db
      .update(students)
      .set(updateData)
      .where(eq(students.student_id, studentId))
      .returning();

    return student;
  }

  async delete(studentId: string): Promise<boolean> {
    const result = await this.db
      .delete(students)
      .where(eq(students.student_id, studentId));

    return result.changes > 0;
  }

  async countByGrade(gradeLevel: string): Promise<number> {
    const result = await this.db
      .select()
      .from(students)
      .where(eq(students.grade_level, gradeLevel))
      .all();

    return result.length;
  }

  async countByStatus(status: 'active' | 'inactive'): Promise<number> {
    const result = await this.db
      .select()
      .from(students)
      .where(eq(students.status, status))
      .all();

    return result.length;
  }
}

// Singleton instance
export const studentAdapter = new StudentAdapter();
