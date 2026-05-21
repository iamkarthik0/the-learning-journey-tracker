import { getDb } from '@/lib/db/client';
import { users, schools } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreateUserInput = {
  full_name: string;
  email: string;
  role: 'teacher' | 'student';
  school_id: string;
};

export type User = typeof users.$inferSelect;

export type UserWithSchool = {
  user_id: string;
  school_id: string | null;
  full_name: string;
  email: string;
  role: 'teacher' | 'student';
  created_at: string | null;
  school_name: string | null;
};

export class UserAdapter {
  private db = getDb();

  async create(input: CreateUserInput): Promise<User> {
    const userId = crypto.randomUUID();

    const [user] = await this.db
      .insert(users)
      .values({
        user_id: userId,
        school_id: input.school_id,
        full_name: input.full_name,
        email: input.email.toLowerCase(),
        role: input.role,
      })
      .returning();

    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.db.select().from(users).all();
  }

  async findAllWithSchool(): Promise<UserWithSchool[]> {
    return await this.db
      .select({
        user_id: users.user_id,
        school_id: users.school_id,
        full_name: users.full_name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        school_name: schools.name,
      })
      .from(users)
      .leftJoin(schools, eq(users.school_id, schools.school_id))
      .all();
  }

  async findById(userId: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.user_id, userId))
      .limit(1);

    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return user;
  }

  async findBySchoolId(schoolId: string): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.school_id, schoolId))
      .all();
  }

  async update(userId: string, input: Partial<CreateUserInput>): Promise<User | undefined> {
    const updateData: any = { ...input };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.user_id, userId))
      .returning();

    return user;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.db
      .delete(users)
      .where(eq(users.user_id, userId));

    return result.changes > 0;
  }

  async countByRole(role: 'teacher' | 'student'): Promise<number> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .all();

    return result.length;
  }
}

// Singleton instance
export const userAdapter = new UserAdapter();
