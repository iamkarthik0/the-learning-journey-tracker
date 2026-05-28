import { getDb } from '@/lib/db/client';
import { periodSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreatePeriodSessionInput = {
  subject_id: string;
  teacher_id: string;
  grade: string;
  division: string;
  period_number: number;
};

export type PeriodSession = typeof periodSessions.$inferSelect;

export class PeriodSessionAdapter {
  private db = getDb();

  async create(input: CreatePeriodSessionInput): Promise<PeriodSession> {
    const sessionId = crypto.randomUUID();

    const [session] = await this.db
      .insert(periodSessions)
      .values({
        session_id: sessionId,
        subject_id: input.subject_id,
        teacher_id: input.teacher_id,
        grade: input.grade,
        division: input.division,
        period_number: input.period_number,
        is_completed: false,
      })
      .returning();

    return session;
  }

  async findAll(): Promise<PeriodSession[]> {
    return await this.db.select().from(periodSessions).all();
  }

  async findById(sessionId: string): Promise<PeriodSession | undefined> {
    const [session] = await this.db
      .select()
      .from(periodSessions)
      .where(eq(periodSessions.session_id, sessionId))
      .limit(1);

    return session;
  }

  async findByTeacher(teacherId: string): Promise<PeriodSession[]> {
    return await this.db
      .select()
      .from(periodSessions)
      .where(eq(periodSessions.teacher_id, teacherId))
      .all();
  }

  async findIncompleteSessions(): Promise<PeriodSession[]> {
    return await this.db
      .select()
      .from(periodSessions)
      .where(eq(periodSessions.is_completed, false))
      .all();
  }

  async markAsCompleted(sessionId: string): Promise<PeriodSession | undefined> {
    const [session] = await this.db
      .update(periodSessions)
      .set({ is_completed: true })
      .where(eq(periodSessions.session_id, sessionId))
      .returning();

    return session;
  }

  async update(
    sessionId: string,
    input: Partial<CreatePeriodSessionInput>
  ): Promise<PeriodSession | undefined> {
    const [session] = await this.db
      .update(periodSessions)
      .set(input)
      .where(eq(periodSessions.session_id, sessionId))
      .returning();

    return session;
  }

  async delete(sessionId: string): Promise<boolean> {
    const result = await this.db
      .delete(periodSessions)
      .where(eq(periodSessions.session_id, sessionId));

    return result.changes > 0;
  }
}

// Singleton instance
export const periodSessionAdapter = new PeriodSessionAdapter();
