'use server';

import { revalidatePath } from 'next/cache';
import { teacherAdapter } from '@/lib/adapters/teacher.adapter';

export type TeacherFormState = {
  success: boolean;
  message: string;
  errors?: {
    full_name?: string[];
    email?: string[];
    specialization?: string[];
  };
};

export async function createTeacher(data: {
  full_name: string;
  email: string;
  specialization?: string;
  sourced_id?: string;
}): Promise<TeacherFormState> {
  try {
    // Validation
    if (!data.full_name || data.full_name.trim() === '') {
      return {
        success: false,
        message: 'Full name is required',
        errors: { full_name: ['Full name is required'] },
      };
    }

    if (!data.email || data.email.trim() === '') {
      return {
        success: false,
        message: 'Email is required',
        errors: { email: ['Email is required'] },
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        message: 'Invalid email format',
        errors: { email: ['Invalid email format'] },
      };
    }

    // Check if email already exists
    const existingTeacher = await teacherAdapter.findByEmail(data.email);
    if (existingTeacher) {
      return {
        success: false,
        message: 'Email already exists',
        errors: { email: ['Email already exists'] },
      };
    }

    // Create teacher using adapter
    await teacherAdapter.create({
      full_name: data.full_name,
      email: data.email,
      specialization: data.specialization,
      sourced_id: data.sourced_id,
    });

    revalidatePath('/dashboard/create');

    return {
      success: true,
      message: 'Teacher created successfully!',
    };
  } catch (error) {
    console.error('Error creating teacher:', error);
    return {
      success: false,
      message: 'Failed to create teacher',
    };
  }
}

export async function getTeachers() {
  try {
    return await teacherAdapter.findAll();
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}
