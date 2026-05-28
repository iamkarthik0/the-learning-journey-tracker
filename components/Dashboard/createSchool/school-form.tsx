'use client';

import { useActionState } from 'react';
import { createSchool, type SchoolFormState } from '@/lib/actions/school-actions';

export function SchoolForm() {
  const [state, formAction, isPending] = useActionState<SchoolFormState | null, FormData>(
    createSchool,
    null
  );

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          School Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border rounded-md"
          disabled={isPending}
        />
        {state?.errors?.name && (
          <p className="text-red-500 text-sm mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create School'}
      </button>

      {state?.message && (
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
