'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createSubject } from '@/lib/actions/subject-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Zod validation schema
const subjectSchema = z.object({
  teacher_id: z.string().min(1, 'Teacher is required'),
  subject_name: z.string().min(2, 'Subject name must be at least 2 characters'),
  grade_level: z.string().optional(),
  color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color code (use #RRGGBB format)').optional().or(z.literal('')),
  sourced_id: z.string().optional(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

type SubjectFormProps = {
  teachers: Array<{ teacher_id: string; full_name: string }>;
};

export function SubjectForm({ teachers }: SubjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
  });

  const onSubmit = async (data: SubjectFormData) => {
    try {
      const result = await createSubject(data);

      if (result.success) {
        toast.success(result.message);
        reset();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Subject</CardTitle>
        <CardDescription>Add a new subject to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <label htmlFor="teacher_id" className="text-sm font-medium">
              Teacher <span className="text-red-500">*</span>
            </label>
            <select
              id="teacher_id"
              {...register('teacher_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.teacher_id} value={teacher.teacher_id}>
                  {teacher.full_name}
                </option>
              ))}
            </select>
            {errors.teacher_id && (
              <p className="text-sm text-red-600">{errors.teacher_id.message}</p>
            )}
          </div>

          {/* Subject Name */}
          <div className="space-y-2">
            <label htmlFor="subject_name" className="text-sm font-medium">
              Subject Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="subject_name"
              type="text"
              placeholder="e.g., Mathematics, Science"
              {...register('subject_name')}
            />
            {errors.subject_name && (
              <p className="text-sm text-red-600">{errors.subject_name.message}</p>
            )}
          </div>

          {/* Grade Level */}
          <div className="space-y-2">
            <label htmlFor="grade_level" className="text-sm font-medium">
              Grade Level
            </label>
            <Input
              id="grade_level"
              type="text"
              placeholder="e.g., 10th Standard"
              {...register('grade_level')}
            />
            {errors.grade_level && (
              <p className="text-sm text-red-600">{errors.grade_level.message}</p>
            )}
          </div>

          {/* Color Code */}
          <div className="space-y-2">
            <label htmlFor="color_code" className="text-sm font-medium">
              Color Code (for UI categorization)
            </label>
            <div className="flex gap-2">
              <Input
                id="color_code"
                type="text"
                placeholder="#FF5733"
                {...register('color_code')}
              />
              <input
                type="color"
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                onChange={(e) => {
                  const colorInput = document.getElementById('color_code') as HTMLInputElement;
                  if (colorInput) colorInput.value = e.target.value;
                }}
              />
            </div>
            {errors.color_code && (
              <p className="text-sm text-red-600">{errors.color_code.message}</p>
            )}
          </div>

          {/* Sourced ID (Optional) */}
          <div className="space-y-2">
            <label htmlFor="sourced_id" className="text-sm font-medium">
              Sourced ID (OneRoster)
            </label>
            <Input
              id="sourced_id"
              type="text"
              placeholder="Optional OneRoster ID"
              {...register('sourced_id')}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Subject'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
