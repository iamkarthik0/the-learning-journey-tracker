import { getDb } from '@/lib/db/client';
import { schools } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreateSchoolInput = {
  name: string;
};

export type School = typeof schools.$inferSelect;

export class SchoolAdapter {
  private db = getDb();

  async create(input: CreateSchoolInput): Promise<School> {
    const schoolId = crypto.randomUUID();

    const [school] = await this.db
      .insert(schools)
      .values({
        school_id: schoolId,
        name: input.name,
      })
      .returning();

    return school;
  }

  async findAll(): Promise<School[]> {
    return await this.db.select().from(schools).all();
  }

  async findById(schoolId: string): Promise<School | undefined> {
    const [school] = await this.db
      .select()
      .from(schools)
      .where(eq(schools.school_id, schoolId))
      .limit(1);

    return school;
  }

  async update(schoolId: string, input: Partial<CreateSchoolInput>): Promise<School | undefined> {
    const [school] = await this.db
      .update(schools)
      .set(input)
      .where(eq(schools.school_id, schoolId))
      .returning();

    return school;
  }

  async delete(schoolId: string): Promise<boolean> {
    const result = await this.db
      .delete(schools)
      .where(eq(schools.school_id, schoolId));

    return result.changes > 0;
  }
}

// Singleton instance
export const schoolAdapter = new SchoolAdapter();
