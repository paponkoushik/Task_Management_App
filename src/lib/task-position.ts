import type { PrismaClient, TaskStatus } from "@prisma/client";

export async function getNextTaskPosition(
  prisma: PrismaClient,
  sprintId: number | null,
  status: TaskStatus,
) {
  const positionAggregate = await prisma.task.aggregate({
    where: {
      sprintId,
      status,
    },
    _max: {
      position: true,
    },
  });

  return (positionAggregate._max.position ?? -1) + 1;
}
