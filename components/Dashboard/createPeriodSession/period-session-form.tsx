'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createPeriodSession } from '@/lib/actions/period-session-actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const GRADES   = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];
const SECTIONS = ['A','B','C','D','E'];

const schema = z.object({
  teacher_id:    z.string().min(1, 'Teacher is required'),
  subject_id:    z.string().min(1, 'Subject is required'),
  grade:         z.string().min(1, 'Grade is required'),
  division:      z.string().min(1, 'Division is required'),
  period_number: z.string().refine((v) => /^\d+$/.test(v) && +v >= 1 && +v <= 10, 'Period must be 1–10'),
});

type FormData = z.infer<typeof schema>;

type Props = {
  teachers: Array<{ teacher_id: string; full_name: string }>;
  subjects: Array<{ subject_id: string; subject_name: string }>;
};

export function PeriodSessionForm({ teachers, subjects }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await createPeriodSession({
      ...data,
      period_number: Number(data.period_number),
    });
    if (result.success) { toast.success(result.message); reset(); }
    else toast.error(result.message);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Teacher + Subject */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Teacher <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('teacher_id', v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select teacher" /></SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.teacher_id} value={t.teacher_id}>{t.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.teacher_id && <p className="text-xs text-destructive">{errors.teacher_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Subject <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('subject_id', v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subject_id && <p className="text-xs text-destructive">{errors.subject_id.message}</p>}
        </div>
      </div>

      {/* Grade + Division + Period */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Grade <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('grade', v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Division <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('division', v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Div" /></SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => <SelectItem key={s} value={s}>Div {s}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.division && <p className="text-xs text-destructive">{errors.division.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="period_number">Period <span className="text-destructive">*</span></Label>
          <Input id="period_number" type="number" placeholder="1" min="1" max="10" className="h-10"
            {...register('period_number')} />
          {errors.period_number && <p className="text-xs text-destructive">{errors.period_number.message}</p>}
        </div>
      </div>

      <Separator />

      <Button type="submit" disabled={isSubmitting} className="w-full h-10">
        {isSubmitting ? 'Creating…' : 'Create Period Session'}
      </Button>
    </form>
  );
}
