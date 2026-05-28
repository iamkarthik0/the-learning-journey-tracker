import { getDb } from '@/lib/db/client';
import { subjects, teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreateSubjectInput = {
  teacher_id: string;
  subject_name: string;
  sourced_id?: string;
  grade_level?: string;
  color_code?: string;
};

export type Subject = typeof subjects.$inferSelect;
export type SubjectWithTeacher = Subject & {
  teacher_name: string | null;
};

export class SubjectAdapter {
  private db = getDb();

  async create(input: CreateSubjectInput): Promise<Subject> {
    const subjectId = crypto.randomUUID();

    const [subject] = await this.db
      .insert(subjects)
      .values({
        subject_id: subjectId,
        teacher_id: input.teacher_id,
        subject_name: input.subject_name,
        sourced_id: input.sourced_id,
        grade_level: input.grade_level,
        color_code: input.color_code,
      })
      .returning();

    return subject;
  }

  async findAll(): Promise<SubjectWithTeacher[]> {
    const result = await this.db
      .select({
        subject_id: subjects.subject_id,
        teacher_id: subjects.teacher_id,
        subject_name: subjects.subject_name,
        sourced_id: subjects.sourced_id,
        grade_level: subjects.grade_level,
        color_code: subjects.color_code,
        created_at: subjects.created_at,
        teacher_name: teachers.full_name,
      })
      .from(subjects)
      .leftJoin(teachers, eq(subjects.teacher_id, teachers.teacher_id))
      .all();

    return result;
  }

  async findById(subjectId: string): Promise<Subject | undefined> {
    const [subject] = await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.subject_id, subjectId))
      .limit(1);

    return subject;
  }

  async findByTeacher(teacherId: string): Promise<Subject[]> {
    return await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.teacher_id, teacherId))
      .all();
  }

  async findByGradeLevel(gradeLevel: string): Promise<Subject[]> {
    return await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.grade_level, gradeLevel))
      .all();
  }

  async update(
    subjectId: string,
    input: Partial<CreateSubjectInput>
  ): Promise<Subject | undefined> {
    const [subject] = await this.db
      .update(subjects)
      .set(input)
      .where(eq(subjects.subject_id, subjectId))
      .returning();

    return subject;
  }

  async delete(subjectId: string): Promise<boolean> {
    const result = await this.db
      .delete(subjects)
      .where(eq(subjects.subject_id, subjectId));

    return result.changes > 0;
  }
}

// Singleton instance
export const subjectAdapter = new SubjectAdapter();
