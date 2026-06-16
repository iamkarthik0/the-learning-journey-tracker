'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createSubject } from '@/lib/actions/subject-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BookOpen, Palette } from 'lucide-react';

const GRADES = [
  '1st','2nd','3rd','4th','5th','6th',
  '7th','8th','9th','10th','11th','12th',
];

const subjectSchema = z.object({
  teacher_id: z.string().min(1, 'Teacher is required'),
  subject_name: z.string().min(2, 'Subject name must be at least 2 characters'),
  grade_level: z.string().optional(),
  color_code: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use #RRGGBB format')
    .optional()
    .or(z.literal('')),
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
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { grade_level: '', color_code: '' },
  });

  const colorValue = watch('color_code') ?? '';

  const onSubmit = async (data: SubjectFormData) => {
    const result = await createSubject(data);
    if (result.success) {
      toast.success(result.message);
      reset({ grade_level: '', color_code: '' });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Teacher */}
      <div className="space-y-2">
        <Label htmlFor="teacher_id">
          Teacher <span className="text-destructive">*</span>
        </Label>
        <Select onValueChange={(v) => setValue('teacher_id', v)}>
          <SelectTrigger id="teacher_id" className="h-10">
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.teacher_id} value={t.teacher_id}>
                {t.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teacher_id && (
          <p className="text-xs text-destructive">{errors.teacher_id.message}</p>
        )}
      </div>

      {/* Subject Name */}
      <div className="space-y-2">
        <Label htmlFor="subject_name">
          Subject Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="subject_name"
            placeholder="e.g., Mathematics, Science"
            className="h-10 pl-9"
            {...register('subject_name')}
          />
        </div>
        {errors.subject_name && (
          <p className="text-xs text-destructive">{errors.subject_name.message}</p>
        )}
      </div>

      {/* Grade Level */}
      <div className="space-y-2">
        <Label htmlFor="grade_level">Grade Level</Label>
        <Select onValueChange={(v) => setValue('grade_level', v)}>
          <SelectTrigger id="grade_level" className="h-10">
            <SelectValue placeholder="Select grade (optional)" />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={g}>Grade {g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Code */}
      <div className="space-y-2">
        <Label htmlFor="color_code">Color</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Palette className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="color_code"
              placeholder="#3B82F6"
              className="h-10 pl-9 font-mono text-sm"
              {...register('color_code')}
            />
          </div>
          <div className="relative">
            <input
              type="color"
              value={colorValue || '#3B82F6'}
              onChange={(e) => setValue('color_code', e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-0.5"
            />
          </div>
        </div>
        {errors.color_code && (
          <p className="text-xs text-destructive">{errors.color_code.message}</p>
        )}
      </div>

      <Separator />

      <Button type="submit" disabled={isSubmitting} className="w-full h-10">
        {isSubmitting ? 'Creating…' : 'Create Subject'}
      </Button>
    </form>
  );
}
