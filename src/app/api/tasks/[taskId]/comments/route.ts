import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { createTaskCommentSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export async function POST(
  request: Request,
  context: RouteContext<"/api/tasks/[taskId]/comments">,
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
      creatorId: true,
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

  const canComment =
    currentUser.id === task.creatorId ||
    currentUser.id === task.assigneeId ||
    task.taskAssignments.some((assignment) => assignment.userId === currentUser.id);

  if (!canComment) {
    return NextResponse.json(
      { error: messages.api.onlyCreatorOrAssigneeComment },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createTaskCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: messages.api.commentValidation },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      taskId: task.id,
      authorId: currentUser.id,
    },
    include: {
      author: {
        select: userSelect,
      },
    },
  });

  revalidatePath("/dashboard");

  if (task.sprintId) {
    revalidatePath(`/sprints/${task.sprintId}`);
  }

  return NextResponse.json({ comment }, { status: 201 });
}
