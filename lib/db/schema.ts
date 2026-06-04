import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const schools = sqliteTable('schools', {
  school_id: text('school_id').primaryKey(),
  name: text('name').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const students = sqliteTable('students', {
  student_id: text('student_id').primaryKey(),
  roll_number: integer('roll_number').notNull(),
  full_name: text('full_name').notNull(),
  sourced_id: text('sourced_id'),
  grade_level: text('grade_level'),
  section: text('section'),
  status: text('status', { enum: ['active', 'inactive'] }).default('active'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// TEACHERS - Teacher information with authentication and professional context
export const teachers = sqliteTable('teachers', {
  teacher_id: text('teacher_id').primaryKey(),
  full_name: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  role: text('role').default('teacher'),
  sourced_id: text('sourced_id'),
  specialization: text('specialization'),
  status: text('status', { enum: ['active', 'inactive'] }).default('active'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// SUBJECTS - Subject information linked to teachers
export const subjects = sqliteTable('subjects', {
  subject_id: text('subject_id').primaryKey(),
  teacher_id: text('teacher_id')
    .notNull()
    .references(() => teachers.teacher_id),
  subject_name: text('subject_name').notNull(),
  sourced_id: text('sourced_id'),
  grade_level: text('grade_level'),
  color_code: text('color_code'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// CHAPTERS - Chapter info with timeline, completion status aur questions (JSON array)
export const chapters = sqliteTable('chapters', {
  chapter_id: text('chapter_id').primaryKey(),
  subject_id: text('subject_id')
    .notNull()
    .references(() => subjects.subject_id),
  chapter_name: text('chapter_name').notNull(), // e.g., "Algebra Basics"
  section: text('section'), // e.g., "A", "B" - kis section ke liye chapter hai

  // TIMELINE DATA - Chapter ka narrative track karne ke liye
  start_date: text('start_date').default(sql`CURRENT_DATE`),
  end_date: text('end_date'), // Jab teacher 'Finish Chapter' click kare

  // COMPLETION STATUS - 0 = In Progress, 1 = Completed
  is_completed: integer('is_completed', { mode: 'boolean' }).default(false),

  // SEQUENCE & AI
  order_index: integer('order_index'), // Ch 1, Ch 2... ka sahi sequence
  ai_context_key: text('ai_context_key'), // Future AI/PDF memory ke liye

  // QUESTIONS ARRAY (JSON) - [{ text, is_completed }]
  // is_completed batata hai ki teacher ne wo question class me padha diya hai ya nahi
  questions: text('questions', { mode: 'json' })
    .$type<Array<{ text: string; is_completed: boolean; taught_date?: string | null }>>()
    .notNull()
    .default([]),

  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});






// ATTENDANCE SESSIONS - Har class period ka session
export const periodSessions = sqliteTable('attendance_sessions', {
  session_id: text('session_id').primaryKey(),
  subject_id: text('subject_id').notNull(),
  teacher_id: text('teacher_id').notNull(),
  grade: text('grade').notNull(), // e.g., "10th", "9th"
  division: text('division').notNull(), // e.g., "A", "B", "C"
  period_number: integer('period_number').notNull(),
  is_completed: integer('is_completed', { mode: 'boolean' }).default(false),
});

// STUDENT ATTENDANCE - Har student ka attendance status with subject completion tracking
export const studentAttendance = sqliteTable('student_attendance', {
  attendance_id: text('attendance_id').primaryKey(),
  student_id: text('student_id').notNull(),
  status: text('status', { enum: ['present', 'absent'] }).default('present'),
  // subject_status stores array of {subject_id: string, is_completed: boolean}
  subject_status: text('subject_status', { mode: 'json' }).$type<
    Array<{ subject_id: string; is_completed: boolean }>
  >(),
  attendance_date: text('attendance_date').notNull(), // Format: YYYY-MM-DD
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
