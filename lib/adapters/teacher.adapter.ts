import { getDb } from '@/lib/db/client';
import { teachers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreateTeacherInput = {
  full_name: string;
  email: string;
  role?: string;
  sourced_id?: string;
  specialization?: string;
  status?: 'active' | 'inactive';
};

export type Teacher = typeof teachers.$inferSelect;

export class TeacherAdapter {
  private db = getDb();

  async create(input: CreateTeacherInput): Promise<Teacher> {
    const teacherId = crypto.randomUUID();

    const [teacher] = await this.db
      .insert(teachers)
      .values({
        teacher_id: teacherId,
        full_name: input.full_name,
        email: input.email,
        role: input.role || 'teacher',
        sourced_id: input.sourced_id,
        specialization: input.specialization,
        status: input.status || 'active',
      })
      .returning();

    return teacher;
  }

  async findAll(): Promise<Teacher[]> {
    return await this.db.select().from(teachers).all();
  }

  async findById(teacherId: string): Promise<Teacher | undefined> {
    const [teacher] = await this.db
      .select()
      .from(teachers)
      .where(eq(teachers.teacher_id, teacherId))
      .limit(1);

    return teacher;
  }

  async findByEmail(email: string): Promise<Teacher | undefined> {
    const [teacher] = await this.db
      .select()
      .from(teachers)
      .where(eq(teachers.email, email))
      .limit(1);

    return teacher;
  }

  async findByStatus(status: 'active' | 'inactive'): Promise<Teacher[]> {
    return await this.db
      .select()
      .from(teachers)
      .where(eq(teachers.status, status))
      .all();
  }

  async update(
    teacherId: string,
    input: Partial<CreateTeacherInput>
  ): Promise<Teacher | undefined> {
    const [teacher] = await this.db
      .update(teachers)
      .set(input)
      .where(eq(teachers.teacher_id, teacherId))
      .returning();

    return teacher;
  }

  async delete(teacherId: string): Promise<boolean> {
    const result = await this.db
      .delete(teachers)
      .where(eq(teachers.teacher_id, teacherId));

    return result.changes > 0;
  }
}

// Singleton instance
export const teacherAdapter = new TeacherAdapter();
