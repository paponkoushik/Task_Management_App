import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { sprintStatusUpdateSchema } from "@/lib/schemas";
import { getNextTaskPosition } from "@/lib/task-position";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/tasks/[taskId]/status">,
) {
  const messages = await getDictionary();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: messages.api.unauthorized }, { status: 401 });
  }

  const { taskId } = await context.params;
  const parsedTaskId = Number(taskId);

  if (!Number.isInteger(parsedTaskId) || parsedTaskId <= 0) {
    return NextResponse.json({ error: messages.api.invalidTaskId }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    select: {
      id: true,
      status: true,
      assigneeId: true,
      sprintId: true,
      taskAssignments: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: messages.api.taskNotFound }, { status: 404 });
  }

  const isAssignedMember =
    task.assigneeId === currentUser.id ||
    task.taskAssignments.some((assignment) => assignment.userId === currentUser.id);

  if (currentUser.role !== "MANAGER" && !isAssignedMember) {
    return NextResponse.json(
      { error: messages.api.onlyMoveAssignedTasks },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = sprintStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: messages.api.chooseValidTaskStatus }, { status: 400 });
  }

  if (task.status === parsed.data.status) {
    return NextResponse.json({ ok: true });
  }

  const nextPosition = await getNextTaskPosition(prisma, task.sprintId ?? null, parsed.data.status);

  const updatedTask = await prisma.task.update({
    where: { id: parsedTaskId },
    data: {
      status: parsed.data.status,
      position: nextPosition,
    },
  });

  revalidatePath("/dashboard");

  if (task.sprintId) {
    revalidatePath(`/sprints/${task.sprintId}`);
  }

  return NextResponse.json({ task: updatedTask });
}
