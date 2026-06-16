'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createTeacher } from '@/lib/actions/teacher-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, User, BookOpen } from 'lucide-react';

const teacherSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email:     z.string().email('Invalid email address'),
  specialization: z.string().optional(),
  sourced_id:     z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

export function TeacherForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TeacherFormData>({ resolver: zodResolver(teacherSchema) });

  const onSubmit = async (data: TeacherFormData) => {
    const result = await createTeacher(data);
    if (result.success) { toast.success(result.message); reset(); }
    else toast.error(result.message);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="full_name" placeholder="Enter teacher's full name" className="h-10 pl-9" {...register('full_name')} />
        </div>
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" placeholder="teacher@school.com" className="h-10 pl-9" {...register('email')} />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Specialization */}
      <div className="space-y-2">
        <Label htmlFor="specialization">Specialization</Label>
        <div className="relative">
          <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="specialization" placeholder="e.g., Mathematics, Science" className="h-10 pl-9" {...register('specialization')} />
        </div>
      </div>

      <Separator />

      <Button type="submit" disabled={isSubmitting} className="w-full h-10">
        {isSubmitting ? 'Adding…' : 'Add Teacher'}
      </Button>
    </form>
  );
}
