'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPeriodSession } from '@/lib/actions/period-session-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Zod validation schema
const periodSessionSchema = z.object({
  subject_id: z.string().min(1, 'Subject is required'),
  teacher_id: z.string().min(1, 'Teacher is required'),
  grade: z.string().min(1, 'Grade is required'),
  division: z.string().min(1, 'Division is required'),
  period_number: z.coerce
    .number()
    .int('Period number must be an integer')
    .min(1, 'Period number must be at least 1')
    .max(10, 'Period number cannot exceed 10'),
});

type PeriodSessionFormData = z.infer<typeof periodSessionSchema>;

type PeriodSessionFormProps = {
  teachers: Array<{ teacher_id: string; full_name: string }>;
  subjects: Array<{ subject_id: string; subject_name: string }>;
};

export function PeriodSessionForm({ teachers, subjects }: PeriodSessionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PeriodSessionFormData>({
    resolver: zodResolver(periodSessionSchema),
  });

  const onSubmit = async (data: PeriodSessionFormData) => {
    try {
      const result = await createPeriodSession(data);

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
        <CardTitle>Create Period Session</CardTitle>
        <CardDescription>Schedule a new class period session</CardDescription>
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

          {/* Subject Selection */}
          <div className="space-y-2">
            <label htmlFor="subject_id" className="text-sm font-medium">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              id="subject_id"
              {...register('subject_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="text-sm text-red-600">{errors.subject_id.message}</p>
            )}
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <label htmlFor="grade" className="text-sm font-medium">
              Grade <span className="text-red-500">*</span>
            </label>
            <Input
              id="grade"
              type="text"
              placeholder="e.g., 10th"
              {...register('grade')}
            />
            {errors.grade && (
              <p className="text-sm text-red-600">{errors.grade.message}</p>
            )}
          </div>

          {/* Division */}
          <div className="space-y-2">
            <label htmlFor="division" className="text-sm font-medium">
              Division <span className="text-red-500">*</span>
            </label>
            <Input
              id="division"
              type="text"
              placeholder="e.g., A"
              {...register('division')}
            />
            {errors.division && (
              <p className="text-sm text-red-600">{errors.division.message}</p>
            )}
          </div>

          {/* Period Number */}
          <div className="space-y-2">
            <label htmlFor="period_number" className="text-sm font-medium">
              Period Number <span className="text-red-500">*</span>
            </label>
            <Input
              id="period_number"
              type="number"
              placeholder="e.g., 1"
              min="1"
              max="10"
              {...register('period_number')}
            />
            {errors.period_number && (
              <p className="text-sm text-red-600">
                {errors.period_number.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Period Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
