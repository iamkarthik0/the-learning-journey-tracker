'use server';

import { revalidatePath } from 'next/cache';
import { periodSessionAdapter } from '@/lib/adapters/period-session.adapter';

export type PeriodSessionFormState = {
  success: boolean;
  message: string;
  errors?: {
    subject_id?: string[];
    teacher_id?: string[];
    grade?: string[];
    division?: string[];
    period_number?: string[];
  };
};

export async function createPeriodSession(
  data: {
    subject_id: string;
    teacher_id: string;
    grade: string;
    division: string;
    period_number: number;
  }
): Promise<PeriodSessionFormState> {
  try {
    // Validation
    if (!data.subject_id || data.subject_id.trim() === '') {
      return {
        success: false,
        message: 'Subject ID is required',
        errors: { subject_id: ['Subject ID is required'] },
      };
    }

    if (!data.teacher_id || data.teacher_id.trim() === '') {
      return {
        success: false,
        message: 'Teacher ID is required',
        errors: { teacher_id: ['Teacher ID is required'] },
      };
    }

    if (!data.grade || data.grade.trim() === '') {
      return {
        success: false,
        message: 'Grade is required',
        errors: { grade: ['Grade is required'] },
      };
    }

    if (!data.division || data.division.trim() === '') {
      return {
        success: false,
        message: 'Division is required',
        errors: { division: ['Division is required'] },
      };
    }

    if (!data.period_number || data.period_number < 1) {
      return {
        success: false,
        message: 'Period number must be at least 1',
        errors: { period_number: ['Period number must be at least 1'] },
      };
    }

    // Create period session using adapter
    await periodSessionAdapter.create({
      subject_id: data.subject_id,
      teacher_id: data.teacher_id,
      grade: data.grade,
      division: data.division,
      period_number: data.period_number,
    });

    revalidatePath('/dashboard/create');

    return {
      success: true,
      message: 'Period session created successfully!',
    };
  } catch (error) {
    console.error('Error creating period session:', error);
    return {
      success: false,
      message: 'Failed to create period session',
    };
  }
}

export async function getPeriodSessions() {
  try {
    return await periodSessionAdapter.findAll();
  } catch (error) {
    console.error('Error fetching period sessions:', error);
    return [];
  }
}
