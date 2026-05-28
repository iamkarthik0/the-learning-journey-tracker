'use server';

import { revalidatePath } from 'next/cache';
import { studentAdapter } from '@/lib/adapters/student.adapter';

export type ActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

// Create Student
export async function createStudent(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const fullName = formData.get('full_name') as string;
    const rollNumber = formData.get('roll_number') as string;
    const gradeLevel = formData.get('grade_level') as string;
    const section = formData.get('section') as string;
    const sourcedId = formData.get('sourced_id') as string;

    // Validation
    const errors: Record<string, string[]> = {};

    if (!fullName || fullName.trim().length === 0) {
      errors.full_name = ['Full name is required'];
    }

    if (!rollNumber || rollNumber.trim().length === 0) {
      errors.roll_number = ['Roll number is required'];
    } else if (isNaN(Number(rollNumber))) {
      errors.roll_number = ['Roll number must be a number'];
    }

    if (!gradeLevel || gradeLevel.trim().length === 0) {
      errors.grade_level = ['Grade level is required'];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    // Check if roll number already exists in the SAME grade AND section
    // (Same roll number is allowed across different grades OR different sections)
    // Section is normalized to UPPERCASE for consistency
    const trimmedSection = section?.trim().toUpperCase() || null;
    const existingStudent = await studentAdapter.findByRollNumberGradeAndSection(
      Number(rollNumber),
      gradeLevel.trim(),
      trimmedSection
    );
    if (existingStudent) {
      const sectionLabel = trimmedSection ? ` - Section ${trimmedSection}` : '';
      return {
        success: false,
        message: `Roll number already exists in this grade and section`,
        errors: {
          roll_number: [
            `Roll number ${rollNumber} is already used in Grade ${gradeLevel.trim()}${sectionLabel}`,
          ],
        },
      };
    }

    await studentAdapter.create({
      full_name: fullName.trim(),
      roll_number: Number(rollNumber),
      grade_level: gradeLevel.trim(),
      section: trimmedSection || undefined,
      sourced_id: sourcedId?.trim() || undefined,
    });

    revalidatePath('/dashboard/create');
    revalidatePath('/dashboard/students');
    return {
      success: true,
      message: 'Student created successfully',
    };
  } catch (error: any) {
    console.error('Error creating student:', error);

    return {
      success: false,
      message: 'Failed to create student',
    };
  }
}

// Update Student
export async function updateStudent(
  studentId: string,
  data: {
    full_name: string;
    roll_number: number;
    grade_level: string;
    section?: string;
    sourced_id?: string;
    status?: 'active' | 'inactive';
  }
): Promise<ActionState> {
  try {
    const errors: Record<string, string[]> = {};

    if (!data.full_name || data.full_name.trim().length === 0) {
      errors.full_name = ['Full name is required'];
    }

    if (!data.roll_number || isNaN(Number(data.roll_number))) {
      errors.roll_number = ['Valid roll number is required'];
    }

    if (!data.grade_level || data.grade_level.trim().length === 0) {
      errors.grade_level = ['Grade level is required'];
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: 'Validation failed',
        errors,
      };
    }

    // Check if roll number+grade+section already exists for a DIFFERENT student
    // Section is normalized to UPPERCASE for consistency
    const trimmedSection = data.section?.trim().toUpperCase() || null;
    const existingStudent = await studentAdapter.findByRollNumberGradeAndSection(
      Number(data.roll_number),
      data.grade_level.trim(),
      trimmedSection
    );

    if (existingStudent && existingStudent.student_id !== studentId) {
      const sectionLabel = trimmedSection ? ` - Section ${trimmedSection}` : '';
      return {
        success: false,
        message: 'Roll number already exists in this grade and section',
        errors: {
          roll_number: [
            `Roll number ${data.roll_number} is already used in Grade ${data.grade_level.trim()}${sectionLabel}`,
          ],
        },
      };
    }

    await studentAdapter.update(studentId, {
      full_name: data.full_name.trim(),
      roll_number: Number(data.roll_number),
      grade_level: data.grade_level.trim(),
      section: trimmedSection || undefined,
      sourced_id: data.sourced_id?.trim() || undefined,
      status: data.status,
    });

    revalidatePath('/dashboard/create');
    revalidatePath('/dashboard/students');
    return {
      success: true,
      message: 'Student updated successfully',
    };
  } catch (error) {
    console.error('Error updating student:', error);
    return {
      success: false,
      message: 'Failed to update student',
    };
  }
}

// Get all students
export async function getStudents() {
  return await studentAdapter.findAll();
}

// Get student by ID
export async function getStudentById(student_id: string) {
  return await studentAdapter.findById(student_id);
}

// Get active students only
export async function getActiveStudents() {
  return await studentAdapter.findActiveStudents();
}
