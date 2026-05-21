// db/client.ts
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";
import { env } from "../env";

// Create db instance from D1 binding
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// For use in server components and API routes
export function getDb() {
  return drizzle(env.DB, { schema });
}