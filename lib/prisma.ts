import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var officeWearPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.officeWearPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.officeWearPrisma = prisma;

// Pooled Postgres connections (Supabase/pgbouncer) are recycled behind our back,
// so the first query after an idle period can fail with a connection error even
// though the database is healthy. Retry those once or twice before giving up.
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

function isTransient(error: unknown) {
  const code = (error as { code?: string })?.code;
  return typeof code === "string" && TRANSIENT_CODES.has(code);
}

export async function withDb<T>(query: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await query();
    } catch (error) {
      lastError = error;
      if (!isTransient(error)) throw error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt));
    }
  }
  throw lastError;
}
