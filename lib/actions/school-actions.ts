'use server';

import { revalidatePath } from 'next/cache';
import { schoolAdapter } from '@/lib/adapters/school.adapter';

export type SchoolFormState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
  };
};

export async function createSchool(
  prevState: SchoolFormState,
  formData: FormData
): Promise<SchoolFormState> {
  try {
    const name = formData.get('name') as string;

    // Validation
    if (!name || name.trim() === '') {
      return {
        success: false,
        message: 'School name is required',
        errors: { name: ['School name is required'] },
      };
    }

    // Create school using adapter
    await schoolAdapter.create({ name });

    revalidatePath('/dashboard/create');

    return {
      success: true,
      message: 'School created successfully!',
    };
  } catch (error) {
    console.error('Error creating school:', error);
    return {
      success: false,
      message: 'Failed to create school',
    };
  }
}

export async function getSchools() {
  try {
    return await schoolAdapter.findAll();
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
}
