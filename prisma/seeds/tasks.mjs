const SEEDED_TASKS = [
  {
    title: "Prepare launch checklist",
    description: "Write the items that must be done before release day.",
    storyPoints: 5,
    estimate: "2d",
    status: "TODO",
    creatorKey: "manager",
    assigneeKeys: ["member", "member2"],
  },
  {
    title: "Review task workflow",
    description: "Check that manager assignment and member status updates work.",
    storyPoints: 3,
    estimate: "6h",
    status: "IN_PROGRESS",
    creatorKey: "manager",
    assigneeKeys: ["member3", "member4"],
  },
];

function resolveAssigneeIds(task, usersByKey) {
  return [...new Set(task.assigneeKeys.map((assigneeKey) => usersByKey[assigneeKey]?.id))].filter(
    (userId) => Number.isInteger(userId),
  );
}

async function backfillLegacyTaskAssignments(prisma) {
  const legacyTasks = await prisma.task.findMany({
    where: {
      assigneeId: {
        not: null,
      },
    },
    select: {
      id: true,
      assigneeId: true,
      taskAssignments: {
        select: {
          userId: true,
        },
      },
    },
  });

  for (const task of legacyTasks) {
    if (!task.assigneeId) {
      continue;
    }

    const assignedUserIds = new Set(task.taskAssignments.map((assignment) => assignment.userId));

    if (assignedUserIds.has(task.assigneeId)) {
      continue;
    }

    await prisma.taskAssignment.create({
      data: {
        taskId: task.id,
        userId: task.assigneeId,
      },
    });
  }
}

export async function seedTasks(prisma, usersByKey) {
  await backfillLegacyTaskAssignments(prisma);

  for (const task of SEEDED_TASKS) {
    const assigneeIds = resolveAssigneeIds(task, usersByKey);
    const existingTask = await prisma.task.findFirst({
      where: {
        title: task.title,
      },
      select: {
        id: true,
      },
    });

    const data = {
      description: task.description,
      storyPoints: task.storyPoints,
      estimate: task.estimate,
      status: task.status,
      creatorId: usersByKey[task.creatorKey].id,
      assigneeId: null,
      taskAssignments: {
        deleteMany: {},
        create: assigneeIds.map((userId) => ({
          userId,
        })),
      },
    };

    if (existingTask) {
      await prisma.task.update({
        where: {
          id: existingTask.id,
        },
        data: {
          title: task.title,
          ...data,
        },
      });

      continue;
    }

    await prisma.task.create({
      data: {
        title: task.title,
        ...data,
      },
    });
  }
}
