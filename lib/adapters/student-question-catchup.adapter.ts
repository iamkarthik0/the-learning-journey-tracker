import { getDb } from '@/lib/db/client';
import { studentQuestionCatchup } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type StudentQuestionCatchupRecord =
  typeof studentQuestionCatchup.$inferSelect;

export type CatchupType = 'catchup' | 'mastery' | 'caught_up_mastered';

class StudentQuestionCatchupAdapter {
  private static instance: StudentQuestionCatchupAdapter;
  private constructor() {}
  static getInstance() {
    if (!this.instance) this.instance = new StudentQuestionCatchupAdapter();
    return this.instance;
  }

  async create(data: {
    student_id: string;
    chapter_id: string;
    question_index: number;
    type: CatchupType;
    caught_up_date?: string;
  }): Promise<StudentQuestionCatchupRecord> {
    const db = getDb();
    const catchup_id = crypto.randomUUID();
    const today = data.caught_up_date ?? new Date().toISOString().split('T')[0];

    const [record] = await db
      .insert(studentQuestionCatchup)
      .values({
        catchup_id,
        student_id: data.student_id,
        chapter_id: data.chapter_id,
        question_index: data.question_index,
        type: data.type,
        caught_up_date: today,
      })
      .returning();

    return record;
  }

  async delete(catchup_id: string): Promise<void> {
    const db = getDb();
    await db
      .delete(studentQuestionCatchup)
      .where(eq(studentQuestionCatchup.catchup_id, catchup_id));
  }

  /** Find record for a specific student+chapter+question+type combination */
  async findOne(data: {
    student_id: string;
    chapter_id: string;
    question_index: number;
    type: CatchupType;
  }): Promise<StudentQuestionCatchupRecord | undefined> {
    const db = getDb();
    const [record] = await db
      .select()
      .from(studentQuestionCatchup)
      .where(
        and(
          eq(studentQuestionCatchup.student_id, data.student_id),
          eq(studentQuestionCatchup.chapter_id, data.chapter_id),
          eq(studentQuestionCatchup.question_index, data.question_index),
          eq(studentQuestionCatchup.type, data.type)
        )
      )
      .limit(1);
    return record;
  }

  /** All records (both types) for a chapter */
  async findByChapter(
    chapter_id: string
  ): Promise<StudentQuestionCatchupRecord[]> {
    const db = getDb();
    return await db
      .select()
      .from(studentQuestionCatchup)
      .where(eq(studentQuestionCatchup.chapter_id, chapter_id));
  }
}

export const catchupAdapter = StudentQuestionCatchupAdapter.getInstance();
