'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createChapter } from '@/lib/actions/chapter-actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

// Zod validation schema
const chapterSchema = z.object({
  subject_id: z.string().min(1, 'Subject is required'),
  chapter_name: z.string().min(2, 'Chapter name must be at least 2 characters'),
  section: z.string().min(1, 'Section is required'),
  order_index: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d+$/.test(val),
      'Must be a whole number'
    ),
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
  // Questions ko ek-ek karke add karne ke liye local state
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
  });

  const addQuestion = () => {
    const value = questionInput.trim();
    if (value.length === 0) {
      toast.error('Question khaali nahi ho sakta');
      return;
    }
    setQuestions((prev) => [...prev, value]);
    setQuestionInput('');
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ChapterFormData) => {
    try {
      const result = await createChapter({
        subject_id: data.subject_id,
        chapter_name: data.chapter_name,
        section: data.section,
        order_index:
          data.order_index && data.order_index.trim() !== ''
            ? Number(data.order_index)
            : undefined,
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
    } catch {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Chapter</CardTitle>
        <CardDescription>
          Add a chapter and bulk-add its questions (one per line)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject Selection */}
          <div className="space-y-2">
            <label htmlFor="subject_id" className="text-sm font-medium">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              id="subject_id"
              {...register('subject_id')}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name}
                  {subject.grade_level ? ` — Grade ${subject.grade_level}` : ''}
                </option>
              ))}
            </select>
            {errors.subject_id && (
              <p className="text-sm text-red-600">{errors.subject_id.message}</p>
            )}
          </div>

          {/* Section Selection */}
          <div className="space-y-2">
            <label htmlFor="section" className="text-sm font-medium">
              Section <span className="text-red-500">*</span>
            </label>
            <select
              id="section"
              {...register('section')}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a section</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
            {errors.section && (
              <p className="text-sm text-red-600">{errors.section.message}</p>
            )}
          </div>

          {/* Chapter Name */}
          <div className="space-y-2">
            <label htmlFor="chapter_name" className="text-sm font-medium">
              Chapter Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="chapter_name"
              type="text"
              placeholder="e.g., Trigonometry"
              {...register('chapter_name')}
            />
            {errors.chapter_name && (
              <p className="text-sm text-red-600">
                {errors.chapter_name.message}
              </p>
            )}
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <label htmlFor="order_index" className="text-sm font-medium">
              Chapter Number / Order
            </label>
            <Input
              id="order_index"
              type="number"
              min="1"
              placeholder="e.g., 1"
              {...register('order_index')}
            />
            {errors.order_index && (
              <p className="text-sm text-red-600">
                {errors.order_index.message}
              </p>
            )}
          </div>

          {/* Questions - ek-ek karke add karo */}
          <div className="space-y-2">
            <label htmlFor="question_input" className="text-sm font-medium">
              Questions / Topics
            </label>

            {/* Input + Add button. Bada question ke liye textarea, Ctrl+Enter se add */}
            <div className="flex items-start gap-2">
              <textarea
                id="question_input"
                rows={2}
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addQuestion();
                  }
                }}
                placeholder="Ek question/topic likho (bada ho to bhi chalega)..."
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={addQuestion}
                title="Add question"
                aria-label="Add question"
                className="shrink-0"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Plus button ya Ctrl+Enter se question add karo. Har question
              alag se save hota hai.
            </p>

            {/* Added questions list */}
            {questions.length > 0 && (
              <ul className="mt-2 space-y-2">
                {questions.map((q, index) => (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 p-2"
                  >
                    <span className="flex gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="wrap-break-word">{q}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                      title="Remove"
                      aria-label="Remove question"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted-foreground">
              {questions.length} question(s) added
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Chapter'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
