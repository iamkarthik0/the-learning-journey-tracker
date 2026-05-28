'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserPlus, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createStudent, updateStudent } from '@/lib/actions/student-actions';

type Student = {
  student_id: string;
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
  sourced_id: string | null;
  status: string | null;
};

type StudentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStudent?: Student | null;
  onSaveComplete?: () => void;
};

const GRADES = [
  '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

export function StudentFormDialog({
  open,
  onOpenChange,
  editingStudent,
  onSaveComplete,
}: StudentFormDialogProps) {
  const isEditMode = !!editingStudent;

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [section, setSection] = useState('');
  const [sourcedId, setSourcedId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);

  // Sync form state when dialog opens or editingStudent changes
  useEffect(() => {
    if (open) {
      setFullName(editingStudent?.full_name ?? '');
      setRollNumber(editingStudent?.roll_number ? String(editingStudent.roll_number) : '');
      setGradeLevel(editingStudent?.grade_level ?? '');
      setSection(editingStudent?.section ?? '');
      setSourcedId(editingStudent?.sourced_id ?? '');
      setStatus((editingStudent?.status as 'active' | 'inactive') ?? 'active');
      setErrors({});
    }
  }, [open, editingStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsPending(true);

    try {
      let result;
      if (isEditMode && editingStudent) {
        result = await updateStudent(editingStudent.student_id, {
          full_name: fullName,
          roll_number: Number(rollNumber),
          grade_level: gradeLevel,
          section: section || undefined,
          sourced_id: sourcedId || undefined,
          status,
        });
      } else {
        const fd = new FormData();
        fd.append('full_name', fullName);
        fd.append('roll_number', rollNumber);
        fd.append('grade_level', gradeLevel);
        fd.append('section', section);
        fd.append('sourced_id', sourcedId);
        result = await createStudent(null, fd);
      }

      if (result.success) {
        toast.success(result.message);
        onSaveComplete?.();
        onOpenChange(false);
      } else {
        toast.error(result.message);
        if (result.errors) {
          const flatErrors: Record<string, string> = {};
          for (const [key, val] of Object.entries(result.errors)) {
            if (Array.isArray(val) && val[0]) flatErrors[key] = val[0];
          }
          setErrors(flatErrors);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <UserCog className="h-5 w-5 text-blue-500" />
                Edit Student
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-emerald-500" />
                Add New Student
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Update details for ${editingStudent?.full_name}`
              : 'Same roll number can be used across different grades or sections.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Aarav Sharma"
              required
              disabled={isPending}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="roll_number">
                Roll Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roll_number"
                type="number"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g., 5"
                required
                disabled={isPending}
              />
              {errors.roll_number && (
                <p className="text-xs text-destructive">{errors.roll_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_level">
                Grade <span className="text-destructive">*</span>
              </Label>
              <Select
                value={gradeLevel}
                onValueChange={setGradeLevel}
                disabled={isPending}
              >
                <SelectTrigger id="grade_level">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade_level && (
                <p className="text-xs text-destructive">{errors.grade_level}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g., A"
                disabled={isPending}
              />
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as 'active' | 'inactive')}
                  disabled={isPending}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourced_id">
              Sourced ID <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="sourced_id"
              value={sourcedId}
              onChange={(e) => setSourcedId(e.target.value)}
              placeholder="OneRoster ID"
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
