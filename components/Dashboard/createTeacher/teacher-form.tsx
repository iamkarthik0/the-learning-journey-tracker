'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createTeacher } from '@/lib/actions/teacher-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Zod validation schema
const teacherSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  specialization: z.string().optional(),
  sourced_id: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

export function TeacherForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
  });

  const onSubmit = async (data: TeacherFormData) => {
    try {
      const result = await createTeacher(data);

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
        <CardTitle>Create Teacher</CardTitle>
        <CardDescription>Add a new teacher to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="full_name"
              type="text"
              placeholder="Enter teacher's full name"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Specialization */}
          <div className="space-y-2">
            <label htmlFor="specialization" className="text-sm font-medium">
              Specialization
            </label>
            <Input
              id="specialization"
              type="text"
              placeholder="e.g., Mathematics, Science"
              {...register('specialization')}
            />
            {errors.specialization && (
              <p className="text-sm text-red-600">{errors.specialization.message}</p>
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
            {isSubmitting ? 'Creating...' : 'Create Teacher'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
