'use client';

import { useActionState } from 'react';
import { createUser, type ActionState } from '@/lib/actions/user-actions';

type School = {
  school_id: string;
  name: string;
};

export function UserForm({ schools }: { schools: School[] }) {
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    createUser,
    null
  );

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          required
          className="w-full px-3 py-2 border rounded-md"
          disabled={isPending}
        />
        {state?.errors?.full_name && (
          <p className="text-red-500 text-sm mt-1">{state.errors.full_name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border rounded-md"
          disabled={isPending}
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-sm mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <select
          id="role"
          name="role"
          required
          className="w-full px-3 py-2 border rounded-md"
          disabled={isPending}
        >
          <option value="">Select role</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        {state?.errors?.role && (
          <p className="text-red-500 text-sm mt-1">{state.errors.role[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="school_id" className="block text-sm font-medium mb-1">
          School
        </label>
        <select
          id="school_id"
          name="school_id"
          required
          className="w-full px-3 py-2 border rounded-md"
          disabled={isPending}
        >
          <option value="">Select school</option>
          {schools.map((school) => (
            <option key={school.school_id} value={school.school_id}>
              {school.name}
            </option>
          ))}
        </select>
        {state?.errors?.school_id && (
          <p className="text-red-500 text-sm mt-1">{state.errors.school_id[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create User'}
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
