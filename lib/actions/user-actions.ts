'use server';

import { revalidatePath } from 'next/cache';
import { schoolAdapter } from '@/lib/adapters/school.adapter';
import { userAdapter } from '@/lib/adapters/user.adapter';

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

// Create School
export async function createSchool(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const name = formData.get('name') as string;

    if (!name || name.trim().length === 0) {
      return {
        success: false,
        message: 'Validation failed',
        errors: { name: ['School name is required'] },
      };
    }

    await schoolAdapter.create({
      name: name.trim(),
    });

    revalidatePath('/demo');
    return {
      success: true,
      message: 'School created successfully',
    };
  } catch (error) {
    console.error('Error creating school:', error);
    return {
      success: false,
      message: 'Failed to create school',
    };
  }
}

// Create User
export async function createUser(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as 'teacher' | 'student';
    const schoolId = formData.get('school_id') as string;

    // Validation
    const errors: Record<string, string[]> = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.full_name = ['Full name is required'];
    }

    if (!email || email.trim().length === 0) {
      errors.email = ['Email is required'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = ['Invalid email format'];
    }

    if (!role || !['teacher', 'student'].includes(role)) {
      errors.role = ['Role must be either teacher or student'];
    }

    if (!schoolId || schoolId.trim().length === 0) {
      errors.school_id = ['School is required'];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    // Check if email already exists
    const existingUser = await userAdapter.findByEmail(email);
    if (existingUser) {
      return {
        success: false,
        message: 'Email already exists',
        errors: { email: ['This email is already registered'] },
      };
    }

    await userAdapter.create({
      full_name: fullName.trim(),
      email: email.trim(),
      role,
      school_id: schoolId,
    });

    revalidatePath('/demo');
    return {
      success: true,
      message: 'User created successfully',
    };
  } catch (error: any) {
    console.error('Error creating user:', error);

    return {
      success: false,
      message: 'Failed to create user',
    };
  }
}

// Get all schools
export async function getSchools() {
  return await schoolAdapter.findAll();
}

// Get all users with school info
export async function getUsers() {
  return await userAdapter.findAllWithSchool();
}
