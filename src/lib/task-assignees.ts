import type { PrismaClient } from "@prisma/client";
import type { AppMessages } from "@/lib/i18n";

export async function validateMemberAssigneeIds(
  prisma: PrismaClient,
  assigneeIds: number[],
  messages: AppMessages,
): Promise<
  | {
      ok: true;
      assigneeIds: number[];
    }
  | {
      ok: false;
      error: string;
      status: number;
    }
> {
  const uniqueAssigneeIds = [...new Set(assigneeIds)];

  if (uniqueAssigneeIds.length === 0) {
    return {
      ok: true,
      assigneeIds: [],
    };
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueAssigneeIds,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (users.length !== uniqueAssigneeIds.length) {
    return {
      ok: false,
      error: messages.api.assigneeNotFound,
      status: 404,
    };
  }

  if (users.some((user) => user.role !== "MEMBER")) {
    return {
      ok: false,
      error: messages.api.assigneeMustBeMember,
      status: 400,
    };
  }

  return {
    ok: true,
    assigneeIds: uniqueAssigneeIds,
  };
}
