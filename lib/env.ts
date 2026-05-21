// Environment helper for Cloudflare Workers
import { env } from "cloudflare:workers";

export interface Env {
  // D1 Database
  DB: D1Database;
  
  // Better Auth secrets
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  
  // Assets and Images (from Vinext)
  ASSETS?: Fetcher;
  IMAGES?: Fetcher;
}

// Export env directly from cloudflare:workers
export { env };
