import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const schools = sqliteTable('schools', {
  school_id: text('school_id').primaryKey(),
  name: text('name').notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})
export const users = sqliteTable('users', {
  user_id: text('user_id').primaryKey(),
  school_id: text('school_id').references(() => schools.school_id),
  full_name: text('full_name').notNull(),
  email: text('email').unique().notNull(),
  role: text('role', { enum: ['teacher', 'student'] }).notNull(),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
})
