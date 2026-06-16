'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createChapter } from '@/lib/actions/chapter-actions';
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
import { Plus, X } from 'lucide-react';

const chapterSchema = z.object({
  subject_id: z.string().min(1, 'Subject is required'),
  section: z.string().min(1, 'Section is required'),
  chapter_name: z.string().min(2, 'Chapter name must be at least 2 characters'),
  order_index: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), 'Must be a whole number'),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

type ChapterFormProps = {
  subjects: Array<{
    subject_id: string;
    subject_name: string;
    grade_level?: string | null;
  }>;
};

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export function ChapterForm({ subjects }: ChapterFormProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChapterFormData>({ resolver: zodResolver(chapterSchema) });

  const addQuestion = () => {
    const v = questionInput.trim();
    if (!v) { toast.error('Question cannot be empty'); return; }
    setQuestions((p) => [...p, v]);
    setQuestionInput('');
  };

  const onSubmit = async (data: ChapterFormData) => {
    const result = await createChapter({
      subject_id: data.subject_id,
      chapter_name: data.chapter_name,
      section: data.section,
      order_index: data.order_index?.trim() ? Number(data.order_index) : undefined,
      questions,
    });
    if (result.success) {
      toast.success(result.message);
      reset();
      setQuestions([]);
      setQuestionInput('');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Subject + Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Subject <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('subject_id', v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.subject_id} value={s.subject_id}>
                  {s.subject_name}
                  {s.grade_level ? ` — Grade ${s.grade_level}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subject_id && (
            <p className="text-xs text-destructive">{errors.subject_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Section <span className="text-destructive">*</span></Label>
          <Select onValueChange={(v) => setValue('section', v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s} value={s}>Section {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.section && (
            <p className="text-xs text-destructive">{errors.section.message}</p>
          )}
        </div>
      </div>

      {/* Chapter Name + Order */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_100px]">
        <div className="space-y-2">
          <Label htmlFor="chapter_name">
            Chapter Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="chapter_name"
            placeholder="e.g., Trigonometry"
            className="h-10"
            {...register('chapter_name')}
          />
          {errors.chapter_name && (
            <p className="text-xs text-destructive">{errors.chapter_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="order_index">Order</Label>
          <Input
            id="order_index"
            type="number"
            min="1"
            placeholder="1"
            className="h-10"
            {...register('order_index')}
          />
          {errors.order_index && (
            <p className="text-xs text-destructive">{errors.order_index.message}</p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-2">
        <Label>Questions / Topics</Label>
        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                addQuestion();
              }
            }}
            placeholder="Type a question or topic… (Ctrl+Enter to add)"
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={addQuestion}
            aria-label="Add question"
            className="h-9 w-9 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {questions.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {questions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2"
              >
                <span className="shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                  {i + 1}.
                </span>
                <span className="flex-1 break-words text-sm">{q}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuestions((p) => p.filter((_, j) => j !== i))}
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          {questions.length} question{questions.length !== 1 ? 's' : ''} added
        </p>
      </div>

      <Separator />

      <Button type="submit" disabled={isSubmitting} className="w-full h-10">
        {isSubmitting ? 'Creating…' : 'Create Chapter'}
      </Button>
    </form>
  );
}
