'use server';

import { revalidatePath } from 'next/cache';
import { subjectAdapter } from '@/lib/adapters/subject.adapter';

export type SubjectFormState = {
  success: boolean;
  message: string;
  errors?: {
    teacher_id?: string[];
    subject_name?: string[];
    grade_level?: string[];
    color_code?: string[];
  };
};

export async function createSubject(data: {
  teacher_id: string;
  subject_name: string;
  grade_level?: string;
  color_code?: string;
  sourced_id?: string;
}): Promise<SubjectFormState> {
  try {
    // Validation
    if (!data.teacher_id || data.teacher_id.trim() === '') {
      return {
        success: false,
        message: 'Teacher is required',
        errors: { teacher_id: ['Teacher is required'] },
      };
    }

    if (!data.subject_name || data.subject_name.trim() === '') {
      return {
        success: false,
        message: 'Subject name is required',
        errors: { subject_name: ['Subject name is required'] },
      };
    }

    // Create subject using adapter
    await subjectAdapter.create({
      teacher_id: data.teacher_id,
      subject_name: data.subject_name,
      grade_level: data.grade_level,
      color_code: data.color_code,
      sourced_id: data.sourced_id,
    });

    revalidatePath('/dashboard/create');

    return {
      success: true,
      message: 'Subject created successfully!',
    };
  } catch (error) {
    console.error('Error creating subject:', error);
    return {
      success: false,
      message: 'Failed to create subject',
    };
  }
}

export async function getSubjects() {
  try {
    return await subjectAdapter.findAll();
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}
