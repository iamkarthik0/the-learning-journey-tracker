'use client';

import { useActionState, useEffect, useState } from 'react';
import { createStudent, updateStudent, type ActionState } from '@/lib/actions/student-actions';
import { toast } from 'sonner';

type Student = {
  student_id: string;
  full_name: string;
  roll_number: number;
  grade_level: string | null;
  section: string | null;
  sourced_id: string | null;
  status: string | null;
};

type StudentFormProps = {
  editingStudent?: Student | null;
  onSaveComplete?: () => void;
};

export function StudentForm({ editingStudent, onSaveComplete }: StudentFormProps = {}) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    createStudent,
    null
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const isEditMode = !!editingStudent;

  // Show toast on success
  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      // Notify parent on successful create so list refreshes
      onSaveComplete?.();
    } else if (state?.message && !state.success) {
      toast.error(state.message);
    }
  }, [state]);

  const handleUpdate = async (formData: FormData) => {
    if (!editingStudent) return;
    setIsUpdating(true);

    const result = await updateStudent(editingStudent.student_id, {
      full_name: formData.get('full_name') as string,
      roll_number: Number(formData.get('roll_number')),
      grade_level: formData.get('grade_level') as string,
      section: (formData.get('section') as string) || undefined,
      sourced_id: (formData.get('sourced_id') as string) || undefined,
      status: (formData.get('status') as 'active' | 'inactive') || 'active',
    });

    setIsUpdating(false);

    if (result.success) {
      toast.success(result.message);
      onSaveComplete?.();
    } else {
      toast.error(result.message);
      if (result.errors?.roll_number) {
        toast.error(result.errors.roll_number[0]);
      }
    }
  };

  const handleSubmit = (formData: FormData) => {
    if (isEditMode) {
      handleUpdate(formData);
    } else {
      formAction(formData);
    }
  };

  const pending = isPending || isUpdating;

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md" key={editingStudent?.student_id || 'new'}>
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-sm text-blue-800">
          Editing: <strong>{editingStudent.full_name}</strong>
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          defaultValue={editingStudent?.full_name || ''}
          className="w-full px-3 py-2 border rounded-md"
          disabled={pending}
        />
        {state?.errors?.full_name && (
          <p className="text-red-500 text-sm mt-1">{state.errors.full_name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="roll_number" className="block text-sm font-medium mb-1">
          Roll Number *
        </label>
        <input
          type="number"
          id="roll_number"
          name="roll_number"
          required
          defaultValue={editingStudent?.roll_number || ''}
          className="w-full px-3 py-2 border rounded-md"
          disabled={pending}
        />
        {state?.errors?.roll_number && (
          <p className="text-red-500 text-sm mt-1">{state.errors.roll_number[0]}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Same roll number can be used across different grades or sections
        </p>
      </div>

      <div>
        <label htmlFor="grade_level" className="block text-sm font-medium mb-1">
          Grade Level *
        </label>
        <select
          id="grade_level"
          name="grade_level"
          required
          defaultValue={editingStudent?.grade_level || ''}
          className="w-full px-3 py-2 border rounded-md"
          disabled={pending}
        >
          <option value="">Select Grade</option>
          {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(
            (g) => (
              <option key={g} value={g}>
                {g}
              </option>
            )
          )}
        </select>
        {state?.errors?.grade_level && (
          <p className="text-red-500 text-sm mt-1">{state.errors.grade_level[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="section" className="block text-sm font-medium mb-1">
          Section
        </label>
        <input
          type="text"
          id="section"
          name="section"
          placeholder="e.g., A"
          defaultValue={editingStudent?.section || ''}
          className="w-full px-3 py-2 border rounded-md"
          disabled={pending}
        />
      </div>

      <div>
        <label htmlFor="sourced_id" className="block text-sm font-medium mb-1">
          Sourced ID (Optional)
        </label>
        <input
          type="text"
          id="sourced_id"
          name="sourced_id"
          placeholder="OneRoster ID"
          defaultValue={editingStudent?.sourced_id || ''}
          className="w-full px-3 py-2 border rounded-md"
          disabled={pending}
        />
      </div>

      {isEditMode && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={editingStudent.status || 'active'}
            className="w-full px-3 py-2 border rounded-md"
            disabled={pending}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {pending
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update Student'
              : 'Create Student'}
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={() => onSaveComplete?.()}
            disabled={pending}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {state?.message && !isEditMode && (
        <p
          className={`text-sm ${
            state.success ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
