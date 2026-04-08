import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { managerTaskUpdateSchema } from "@/lib/schemas";
import { validateMemberAssigneeIds } from "@/lib/task-assignees";
import { getNextTaskPosition } from "@/lib/task-position";

export async function PATCH(request: Request, context: RouteContext<"/api/tasks/[taskId]">) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { taskId } = await context.params;
  const parsedTaskId = Number(taskId);

  if (!Number.isInteger(parsedTaskId) || parsedTaskId <= 0) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  }

  const existingTask = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    select: {
      id: true,
      sprintId: true,
      status: true,
    },
  });

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  if (currentUser.role === "MANAGER") {
    const parsed = managerTaskUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Manager updates require title, description, sprint, status, and assignee info." },
        { status: 400 },
      );
    }

    const validatedAssigneeIds = await validateMemberAssigneeIds(prisma, parsed.data.assigneeIds);

    if (!validatedAssigneeIds.ok) {
      return NextResponse.json(
        { error: validatedAssigneeIds.error },
        { status: validatedAssigneeIds.status },
      );
    }

    if (parsed.data.sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: parsed.data.sprintId },
        select: { id: true },
      });

      if (!sprint) {
        return NextResponse.json({ error: "Selected sprint was not found." }, { status: 404 });
      }
    }

    const movedIntoDifferentSprint = parsed.data.sprintId !== existingTask.sprintId;
    const nextPosition =
      parsed.data.sprintId === null
        ? 0
        : movedIntoDifferentSprint
          ? await getNextTaskPosition(prisma, parsed.data.sprintId, "TODO")
          : existingTask.status !== parsed.data.status
            ? await getNextTaskPosition(prisma, parsed.data.sprintId, parsed.data.status)
            : undefined;

    const task = await prisma.task.update({
      where: { id: parsedTaskId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        storyPoints: parsed.data.storyPoints,
        estimate: parsed.data.estimate,
        assigneeId: null,
        sprintId: parsed.data.sprintId,
        status: movedIntoDifferentSprint && parsed.data.sprintId !== null ? "TODO" : parsed.data.status,
        position: nextPosition ?? undefined,
        taskAssignments: {
          deleteMany: {},
          create: validatedAssigneeIds.assigneeIds.map((userId) => ({
            userId,
          })),
        },
      },
    });

    revalidatePath("/dashboard");

    if (existingTask.sprintId) {
      revalidatePath(`/sprints/${existingTask.sprintId}`);
    }

    if (parsed.data.sprintId) {
      revalidatePath(`/sprints/${parsed.data.sprintId}`);
    }

    return NextResponse.json({ task });
  }

  return NextResponse.json(
    { error: "Only the manager can edit full task details." },
    { status: 403 },
  );
}

export async function DELETE(_request: Request, context: RouteContext<"/api/tasks/[taskId]">) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (currentUser.role !== "MANAGER") {
    return NextResponse.json(
      { error: "Only the manager can delete tasks." },
      { status: 403 },
    );
  }

  const { taskId } = await context.params;
  const parsedTaskId = Number(taskId);

  if (!Number.isInteger(parsedTaskId) || parsedTaskId <= 0) {
    return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
  }

  const existingTask = await prisma.task.findUnique({
    where: { id: parsedTaskId },
    select: {
      sprintId: true,
    },
  });

  if (!existingTask) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  await prisma.task.delete({
    where: { id: parsedTaskId },
  });

  revalidatePath("/dashboard");

  if (existingTask.sprintId) {
    revalidatePath(`/sprints/${existingTask.sprintId}`);
  }

  return NextResponse.json({ ok: true });
}
