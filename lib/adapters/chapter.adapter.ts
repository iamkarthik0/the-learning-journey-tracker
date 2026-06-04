import { getDb } from '@/lib/db/client';
import { chapters, subjects } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export type ChapterQuestion = {
  text: string;
  is_completed: boolean;
  taught_date?: string | null; // YYYY-MM-DD - kis din ye question complete hua
};

export type CreateChapterInput = {
  subject_id: string;
  chapter_name: string;
  section?: string;
  order_index?: number;
  questions?: ChapterQuestion[];
};

export type Chapter = typeof chapters.$inferSelect;
export type ChapterWithSubject = Chapter & {
  subject_name: string | null;
};

export class ChapterAdapter {
  async create(input: CreateChapterInput): Promise<Chapter> {
    const db = getDb();
    const chapter_id = crypto.randomUUID();

    const [chapter] = await db
      .insert(chapters)
      .values({
        chapter_id,
        subject_id: input.subject_id,
        chapter_name: input.chapter_name,
        section: input.section,
        order_index: input.order_index,
        questions: input.questions ?? [],
      })
      .returning();

    return chapter;
  }

  async findAll(): Promise<ChapterWithSubject[]> {
    const db = getDb();
    return await db
      .select({
        chapter_id: chapters.chapter_id,
        subject_id: chapters.subject_id,
        chapter_name: chapters.chapter_name,
        section: chapters.section,
        start_date: chapters.start_date,
        end_date: chapters.end_date,
        is_completed: chapters.is_completed,
        order_index: chapters.order_index,
        ai_context_key: chapters.ai_context_key,
        questions: chapters.questions,
        created_at: chapters.created_at,
        updated_at: chapters.updated_at,
        subject_name: subjects.subject_name,
      })
      .from(chapters)
      .leftJoin(subjects, eq(chapters.subject_id, subjects.subject_id))
      .orderBy(asc(chapters.order_index))
      .all();
  }

  async findById(chapter_id: string): Promise<Chapter | undefined> {
    const db = getDb();
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.chapter_id, chapter_id))
      .limit(1);

    return chapter;
  }

  async findBySubject(subject_id: string): Promise<Chapter[]> {
    const db = getDb();
    return await db
      .select()
      .from(chapters)
      .where(eq(chapters.subject_id, subject_id))
      .orderBy(asc(chapters.order_index))
      .all();
  }

  // Questions array ko poora replace karta hai (daily log me toggle ke baad)
  async updateQuestions(
    chapter_id: string,
    questions: ChapterQuestion[]
  ): Promise<Chapter | undefined> {
    const db = getDb();
    const [chapter] = await db
      .update(chapters)
      .set({
        questions,
        updated_at: new Date().toISOString(),
      })
      .where(eq(chapters.chapter_id, chapter_id))
      .returning();

    return chapter;
  }

  // Chapter ko complete / reopen karta hai
  async setCompletion(
    chapter_id: string,
    is_completed: boolean
  ): Promise<Chapter | undefined> {
    const db = getDb();
    const [chapter] = await db
      .update(chapters)
      .set({
        is_completed,
        // Complete pe end_date set, reopen pe clear
        end_date: is_completed
          ? new Date().toISOString().split('T')[0]
          : null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(chapters.chapter_id, chapter_id))
      .returning();

    return chapter;
  }

  async update(
    chapter_id: string,
    input: Partial<CreateChapterInput>
  ): Promise<Chapter | undefined> {
    const db = getDb();
    const [chapter] = await db
      .update(chapters)
      .set({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .where(eq(chapters.chapter_id, chapter_id))
      .returning();

    return chapter;
  }

  async delete(chapter_id: string): Promise<boolean> {
    const db = getDb();
    await db.delete(chapters).where(eq(chapters.chapter_id, chapter_id));
    return true;
  }
}

// Singleton instance
export const chapterAdapter = new ChapterAdapter();
