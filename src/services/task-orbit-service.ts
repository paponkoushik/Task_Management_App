import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  AppUserSummary,
  DashboardTask,
  DashboardViewModel,
  SprintBoardViewModel,
  SprintPreview,
  SprintSummary,
  TaskComment,
} from "@/types/task-orbit";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

const sprintPreviewSelect = {
  id: true,
  name: true,
  status: true,
} as const;

const taskCommentsInclude = {
  include: {
    author: {
      select: userSelect,
    },
  },
  orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
};

const taskAssigneesInclude = {
  include: {
    user: {
      select: userSelect,
    },
  },
};

function assignedToCurrentUserFilter(currentUserId: number) {
  return {
    OR: [
      {
        assigneeId: currentUserId,
      },
      {
        taskAssignments: {
          some: {
            userId: currentUserId,
          },
        },
      },
    ],
  };
}

function serializeUser(user: AppUserSummary): AppUserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function serializeSprintPreview(sprint: SprintPreview): SprintPreview {
  return {
    id: sprint.id,
    name: sprint.name,
    status: sprint.status,
  };
}

function serializeTaskComment(comment: {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: AppUserSummary;
}): TaskComment {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: serializeUser(comment.author),
  };
}

function serializeTaskAssignees(task: {
  assignee: AppUserSummary | null;
  taskAssignments: Array<{
    user: AppUserSummary;
  }>;
}) {
  const assigneesById = new Map<number, AppUserSummary>();

  if (task.assignee) {
    assigneesById.set(task.assignee.id, serializeUser(task.assignee));
  }

  for (const assignment of task.taskAssignments) {
    assigneesById.set(assignment.user.id, serializeUser(assignment.user));
  }

  return [...assigneesById.values()].sort((left, right) => left.email.localeCompare(right.email));
}

function serializeDashboardTask(task: {
  id: number;
  title: string;
  description: string | null;
  storyPoints: number | null;
  estimate: string | null;
  status: DashboardTask["status"];
  position: number;
  createdAt: Date;
  updatedAt: Date;
  creator: AppUserSummary;
  assignee: AppUserSummary | null;
  taskAssignments: Array<{
    user: AppUserSummary;
  }>;
  sprint: SprintPreview | null;
  comments: Array<{
    id: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    author: AppUserSummary;
  }>;
}): DashboardTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    storyPoints: task.storyPoints,
    estimate: task.estimate,
    status: task.status,
    position: task.position,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    creator: serializeUser(task.creator),
    assignees: serializeTaskAssignees(task),
    sprint: task.sprint ? serializeSprintPreview(task.sprint) : null,
    comments: task.comments.map((comment) => serializeTaskComment(comment)),
  };
}

function serializeSprint(sprint: {
  id: number;
  name: string;
  goal: string | null;
  status: SprintSummary["status"];
  createdAt: Date;
  updatedAt: Date;
  tasks: Array<{ status: DashboardTask["status"] }>;
}): SprintSummary {
  const counts = sprint.tasks.reduce(
    (accumulator, task) => {
      accumulator[task.status] += 1;
      return accumulator;
    },
    {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETE: 0,
    } satisfies SprintSummary["counts"],
  );

  return {
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    createdAt: sprint.createdAt.toISOString(),
    updatedAt: sprint.updatedAt.toISOString(),
    taskCount: sprint.tasks.length,
    counts,
  };
}

export async function getDashboardViewModel(currentUser: SessionUser): Promise<DashboardViewModel> {
  const memberVisibilityFilter =
    currentUser.role === "MANAGER" ? {} : assignedToCurrentUserFilter(currentUser.id);

  const [users, sprints, backlogTasks, sprintTasks] = await Promise.all([
    currentUser.role === "MANAGER"
      ? prisma.user.findMany({
          where: {
            role: "MEMBER",
          },
          select: userSelect,
          orderBy: [{ email: "asc" }],
        })
      : Promise.resolve([]),
    prisma.sprint.findMany({
      where:
        currentUser.role === "MANAGER"
          ? undefined
          : {
              tasks: {
                some: assignedToCurrentUserFilter(currentUser.id),
              },
            },
      include: {
        tasks: {
          select: {
            status: true,
          },
          where: currentUser.role === "MANAGER" ? undefined : assignedToCurrentUserFilter(currentUser.id),
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.task.findMany({
      where: {
        sprintId: null,
        ...memberVisibilityFilter,
      },
      include: {
        creator: {
          select: userSelect,
        },
        assignee: {
          select: userSelect,
        },
        taskAssignments: taskAssigneesInclude,
        sprint: {
          select: sprintPreviewSelect,
        },
        comments: taskCommentsInclude,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.task.findMany({
      where: {
        sprintId: {
          not: null,
        },
        ...memberVisibilityFilter,
      },
      include: {
        creator: {
          select: userSelect,
        },
        assignee: {
          select: userSelect,
        },
        taskAssignments: taskAssigneesInclude,
        sprint: {
          select: sprintPreviewSelect,
        },
        comments: taskCommentsInclude,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    currentUser: serializeUser(currentUser),
    users: users.map((user) => serializeUser(user as AppUserSummary)),
    sprints: sprints.map((sprint) => serializeSprint(sprint)),
    backlogTasks: backlogTasks.map((task) =>
      serializeDashboardTask({
        ...task,
        creator: task.creator as AppUserSummary,
        assignee: task.assignee as AppUserSummary | null,
        taskAssignments: task.taskAssignments as Array<{
          user: AppUserSummary;
        }>,
        sprint: task.sprint as SprintPreview | null,
        comments: task.comments as Array<{
          id: number;
          body: string;
          createdAt: Date;
          updatedAt: Date;
          author: AppUserSummary;
        }>,
      }),
    ),
    sprintTasks: sprintTasks.map((task) =>
      serializeDashboardTask({
        ...task,
        creator: task.creator as AppUserSummary,
        assignee: task.assignee as AppUserSummary | null,
        taskAssignments: task.taskAssignments as Array<{
          user: AppUserSummary;
        }>,
        sprint: task.sprint as SprintPreview | null,
        comments: task.comments as Array<{
          id: number;
          body: string;
          createdAt: Date;
          updatedAt: Date;
          author: AppUserSummary;
        }>,
      }),
    ),
  };
}

export async function getSprintBoardViewModel({
  currentUser,
  sprintId,
}: {
  currentUser: SessionUser;
  sprintId: number;
}): Promise<SprintBoardViewModel | null> {
  const memberVisibilityFilter =
    currentUser.role === "MANAGER" ? {} : assignedToCurrentUserFilter(currentUser.id);

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      tasks: {
        select: {
          status: true,
        },
        where: currentUser.role === "MANAGER" ? undefined : assignedToCurrentUserFilter(currentUser.id),
      },
    },
  });

  if (!sprint) {
    return null;
  }

  const [users, tasks, backlogTasks] = await Promise.all([
    currentUser.role === "MANAGER"
      ? prisma.user.findMany({
          where: {
            role: "MEMBER",
          },
          select: userSelect,
          orderBy: [{ email: "asc" }],
        })
      : Promise.resolve([]),
    prisma.task.findMany({
      where: {
        sprintId: sprint.id,
        ...memberVisibilityFilter,
      },
      include: {
        creator: {
          select: userSelect,
        },
        assignee: {
          select: userSelect,
        },
        taskAssignments: taskAssigneesInclude,
        sprint: {
          select: sprintPreviewSelect,
        },
        comments: taskCommentsInclude,
      },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    }),
    currentUser.role === "MANAGER"
      ? prisma.task.findMany({
          where: {
            sprintId: null,
          },
          include: {
            creator: {
              select: userSelect,
            },
            assignee: {
              select: userSelect,
            },
            taskAssignments: taskAssigneesInclude,
            sprint: {
              select: sprintPreviewSelect,
            },
            comments: taskCommentsInclude,
          },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
  ]);

  return {
    currentUser: serializeUser(currentUser),
    users: users.map((user) => serializeUser(user as AppUserSummary)),
    sprint: serializeSprint(sprint),
    tasks: tasks.map((task) =>
      serializeDashboardTask({
        ...task,
        creator: task.creator as AppUserSummary,
        assignee: task.assignee as AppUserSummary | null,
        taskAssignments: task.taskAssignments as Array<{
          user: AppUserSummary;
        }>,
        sprint: task.sprint as SprintPreview | null,
        comments: task.comments as Array<{
          id: number;
          body: string;
          createdAt: Date;
          updatedAt: Date;
          author: AppUserSummary;
        }>,
      }),
    ),
    backlogTasks: backlogTasks.map((task) =>
      serializeDashboardTask({
        ...task,
        creator: task.creator as AppUserSummary,
        assignee: task.assignee as AppUserSummary | null,
        taskAssignments: task.taskAssignments as Array<{
          user: AppUserSummary;
        }>,
        sprint: task.sprint as SprintPreview | null,
        comments: task.comments as Array<{
          id: number;
          body: string;
          createdAt: Date;
          updatedAt: Date;
          author: AppUserSummary;
        }>,
      }),
    ),
  };
}
