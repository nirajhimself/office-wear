import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var officeWearPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.officeWearPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.officeWearPrisma = prisma;
