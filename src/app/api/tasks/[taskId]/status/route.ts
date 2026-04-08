import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sprintStatusUpdateSchema } from "@/lib/schemas";
import { getNextTaskPosition } from "@/lib/task-position";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/tasks/[taskId]/status">,
) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { taskId } = await context.params;
  const parsedTaskId = Number(taskId);

  if (!Number.isInteger(parsedTaskId) || parsedTaskId <= 0) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
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
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const isAssignedMember =
    task.assigneeId === currentUser.id ||
    task.taskAssignments.some((assignment) => assignment.userId === currentUser.id);

  if (currentUser.role !== "MANAGER" && !isAssignedMember) {
    return NextResponse.json(
      { error: "You can only move tasks assigned to you." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = sprintStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid task status." }, { status: 400 });
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
