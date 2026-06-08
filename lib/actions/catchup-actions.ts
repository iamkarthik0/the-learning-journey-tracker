'use server';

import { revalidatePath } from 'next/cache';
import {
  catchupAdapter,
  type CatchupType,
} from '@/lib/adapters/student-question-catchup.adapter';
import { studentAdapter } from '@/lib/adapters/student.adapter';

export type CatchupStudentInfo = {
  catchup_id: string;
  student_id: string;
  full_name: string;
  roll_number: number;
  type: CatchupType;
  caught_up_date: string;
};

// Toggle: mark present or remove if already exists
export async function toggleStudentCaughtUp(data: {
  student_id: string;
  chapter_id: string;
  question_index: number;
  type: CatchupType;
}): Promise<{ success: boolean; message: string; action: 'added' | 'removed' }> {
  try {
    const existing = await catchupAdapter.findOne(data);

    if (existing) {
      await catchupAdapter.delete(existing.catchup_id);
      revalidatePath('/dashboard/analytics');
      return { success: true, message: 'Removed', action: 'removed' };
    }

    await catchupAdapter.create(data);
    revalidatePath('/dashboard/analytics');
    return { success: true, message: 'Marked as caught up', action: 'added' };
  } catch (err) {
    console.error('Error toggling caught up:', err);
    return { success: false, message: 'Failed', action: 'removed' };
  }
}

// Get all catchup records for a chapter+question with student details
export async function getCatchupForQuestion(data: {
  chapter_id: string;
  question_index: number;
}): Promise<{ catchup: CatchupStudentInfo[]; mastery: CatchupStudentInfo[] }> {
  try {
    const all = await catchupAdapter.findByChapter(data.chapter_id);
    const records = all.filter((r) => r.question_index === data.question_index);

    const allStudents = await studentAdapter.findAll();
    const studentMap = new Map(allStudents.map((s) => [s.student_id, s]));

    const enrich = (type: CatchupType): CatchupStudentInfo[] =>
      records
        .filter((r) => r.type === type)
        .map((r) => ({
          catchup_id: r.catchup_id,
          student_id: r.student_id,
          full_name: studentMap.get(r.student_id)?.full_name ?? 'Unknown',
          roll_number: studentMap.get(r.student_id)?.roll_number ?? 0,
          type: r.type as CatchupType,
          caught_up_date: r.caught_up_date,
        }))
        .sort((a, b) => a.roll_number - b.roll_number);

    return {
      catchup: enrich('catchup'),
      mastery: enrich('mastery'),
    };
  } catch (err) {
    console.error('Error fetching catchup:', err);
    return { catchup: [], mastery: [] };
  }
}
