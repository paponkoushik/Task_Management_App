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

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  const cachedPrisma =
    globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY &&
    hasExpectedDelegates(globalForPrisma.prisma)
      ? globalForPrisma.prisma
      : undefined;

  const prismaClient = cachedPrisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
    globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY;
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const prismaClient = getPrismaClient() as PrismaClient & Record<PropertyKey, unknown>;
    const value = Reflect.get(prismaClient, property, receiver);
    return typeof value === "function" ? value.bind(prismaClient) : value;
  },
  has(_target, property) {
    return property in getPrismaClient();
  },
  ownKeys() {
    return Reflect.ownKeys(getPrismaClient());
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Object.getOwnPropertyDescriptor(getPrismaClient(), property);

    if (!descriptor) {
      return undefined;
    }

    return {
      ...descriptor,
      configurable: true,
    };
  },
}) as PrismaClient;
