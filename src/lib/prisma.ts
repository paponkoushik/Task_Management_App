import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

const PRISMA_CACHE_KEY = "task-orbit-multi-assignee-v1";

function hasExpectedDelegates(client: PrismaClient | undefined) {
  return Boolean(
    client &&
      "sprint" in (client as PrismaClient & { sprint?: unknown }) &&
      "comment" in (client as PrismaClient & { comment?: unknown }) &&
      "taskAssignment" in (client as PrismaClient & { taskAssignment?: unknown }),
  );
}

const cachedPrisma =
  globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY &&
  hasExpectedDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : undefined;

export const prisma =
  cachedPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY;
}
