'use server';

import { revalidatePath } from 'next/cache';
import {
  chapterAdapter,
  ChapterQuestion,
} from '@/lib/adapters/chapter.adapter';

export type ChapterFormState = {
  success: boolean;
  message: string;
  errors?: {
    subject_id?: string[];
    chapter_name?: string[];
    section?: string[];
    questions?: string[];
  };
};

// CREATE a chapter with a bulk list of questions
export async function createChapter(data: {
  subject_id: string;
  chapter_name: string;
  section?: string;
  order_index?: number;
  questions?: string[]; // plain question texts from the bulk textarea
}): Promise<ChapterFormState> {
  try {
    if (!data.subject_id || data.subject_id.trim() === '') {
      return {
        success: false,
        message: 'Subject is required',
        errors: { subject_id: ['Subject is required'] },
      };
    }

    if (!data.chapter_name || data.chapter_name.trim() === '') {
      return {
        success: false,
        message: 'Chapter name is required',
        errors: { chapter_name: ['Chapter name is required'] },
      };
    }

    if (!data.section || data.section.trim() === '') {
      return {
        success: false,
        message: 'Section is required',
        errors: { section: ['Section is required'] },
      };
    }

    // Bulk question texts ko {text, is_completed:false} objects me convert karo
    const questions: ChapterQuestion[] = (data.questions ?? [])
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .map((text) => ({ text, is_completed: false }));

    await chapterAdapter.create({
      subject_id: data.subject_id,
      chapter_name: data.chapter_name.trim(),
      section: data.section.trim().toUpperCase(),
      order_index: data.order_index,
      questions,
    });

    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/daily-log');
    revalidatePath('/dashboard/analytics');

    return {
      success: true,
      message: 'Chapter created successfully!',
    };
  } catch (error) {
    console.error('Error creating chapter:', error);
    return {
      success: false,
      message: 'Failed to create chapter',
    };
  }
}

// Toggle a single question's completion (teacher ne aaj wo question padhaya)
export async function toggleChapterQuestion(data: {
  chapter_id: string;
  question_index: number;
  is_completed: boolean;
}): Promise<ChapterFormState> {
  try {
    const chapter = await chapterAdapter.findById(data.chapter_id);
    if (!chapter) {
      return { success: false, message: 'Chapter not found' };
    }

    const questions = [...(chapter.questions ?? [])];
    if (data.question_index < 0 || data.question_index >= questions.length) {
      return { success: false, message: 'Invalid question' };
    }

    // Aaj ki date (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    questions[data.question_index] = {
      ...questions[data.question_index],
      is_completed: data.is_completed,
      // Mark karne pe aaj ki date set, un-mark pe clear
      taught_date: data.is_completed ? today : null,
    };

    await chapterAdapter.updateQuestions(data.chapter_id, questions);

    // Auto-complete: jab saare questions taught ho jaayein, chapter complete + end_date set
    const allTaught =
      questions.length > 0 && questions.every((q) => q.is_completed);

    if (allTaught && !chapter.is_completed) {
      await chapterAdapter.setCompletion(data.chapter_id, true);
    } else if (!allTaught && chapter.is_completed) {
      // Agar koi question wapas pending hua, chapter reopen ho jaye
      await chapterAdapter.setCompletion(data.chapter_id, false);
    }

    revalidatePath('/dashboard/daily-log');
    revalidatePath('/dashboard/analytics');
    revalidatePath('/dashboard/teacher');

    return {
      success: true,
      message: data.is_completed
        ? allTaught
          ? 'Last question complete! Chapter auto-completed 🎉'
          : 'Marked as taught'
        : 'Marked as not taught',
    };
  } catch (error) {
    console.error('Error toggling question:', error);
    return { success: false, message: 'Failed to update question' };
  }
}

// Mark whole chapter complete / reopen
export async function setChapterCompletion(data: {
  chapter_id: string;
  is_completed: boolean;
}): Promise<ChapterFormState> {
  try {
    const chapter = await chapterAdapter.findById(data.chapter_id);
    if (!chapter) {
      return { success: false, message: 'Chapter not found' };
    }

    // Complete karne se pehle check: koi question pending to nahi
    if (data.is_completed) {
      const pending = (chapter.questions ?? []).filter((q) => !q.is_completed);
      if (pending.length > 0) {
        return {
          success: false,
          message: `${pending.length} question(s) abhi bhi pending hain. Pehle sabhi questions complete karo.`,
        };
      }
    }

    await chapterAdapter.setCompletion(data.chapter_id, data.is_completed);

    revalidatePath('/dashboard/daily-log');
    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/analytics');

    return {
      success: true,
      message: data.is_completed
        ? 'Chapter completed! 🎉'
        : 'Chapter reopened',
    };
  } catch (error) {
    console.error('Error updating chapter completion:', error);
    return { success: false, message: 'Failed to update chapter' };
  }
}

export async function deleteChapter(
  chapter_id: string
): Promise<ChapterFormState> {
  try {
    await chapterAdapter.delete(chapter_id);
    revalidatePath('/dashboard/teacher');
    revalidatePath('/dashboard/daily-log');
    return { success: true, message: 'Chapter deleted' };
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return { success: false, message: 'Failed to delete chapter' };
  }
}

// READ helpers
export async function getChapters() {
  try {
    return await chapterAdapter.findAll();
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}

export async function getChaptersBySubject(subject_id: string) {
  try {
    return await chapterAdapter.findBySubject(subject_id);
  } catch (error) {
    console.error('Error fetching chapters by subject:', error);
    return [];
  }
}
